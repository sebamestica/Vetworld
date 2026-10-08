"use client";

import { useEffect, useState, useRef, Component, type ReactNode } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { LoadingManager, Mesh, MeshStandardMaterial, Object3D, Color, Box3, Texture, PerspectiveCamera, type Material, type Plane } from "three";
import type { OrbitControls as Controls } from "three-stdlib";
import { viewerAssetSchema, type ViewerAsset } from "@/modules/viewer/manifest";
import { meshPresentation, type ViewerLayers } from "@/modules/viewer/visibility";
import { readBoundedBody, safeResourceUri, validateLoadedScene } from "@/modules/viewer/loading";
import { cameraFrame, clippingPlane, viewDirection, zoomDistance, type CutPlane, type ViewPreset } from "@/modules/viewer/controls";
import { updateCameraRange, updateRendererExposure } from "@/modules/viewer/rendering";
import styles from "./AnatomyViewer.module.css";

export interface AnatomyViewerProps {
  asset: ViewerAsset | null; selectedId: string | null; onSelect: (id: string) => void;
  layers: ViewerLayers; isolatedId: string | null; resetToken: number; quality: "balanced" | "low" | "high";
  onReady?: (info: { triangles: number; renderer: string }) => void;
  variant?: "classic" | "immersive"; language?: "es" | "en"; backgroundColor?: string; exposure?: number;
  viewPreset?: ViewPreset; viewToken?: number; zoomRequest?: { token: number; delta: number };
  cutPlane?: CutPlane; clipOffset?: number;
  onRenderMetrics?: (info: { dpr: number; exposure: number; shadowMapSize: number }) => void;
}
function dispose(scene: Object3D) {
  const textures = new Set<Texture>();
  scene.traverse((object) => { if (object instanceof Mesh) { object.geometry.dispose(); const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach((material) => { for (const value of Object.values(material)) { if (value instanceof Texture) textures.add(value); } material.dispose(); }); } });
  textures.forEach((texture) => texture.dispose());
}
class CanvasBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}
function Scene({ scene, onSceneReady, onContextLost, ...props }: AnatomyViewerProps & { scene: Object3D; onSceneReady: () => void; onContextLost: () => void }) {
  const { invalidate, camera, gl, size, setDpr } = useThree();
  const controls = useRef<Controls>(null);
  const metrics = useRef(props.onRenderMetrics);
  useEffect(() => { metrics.current = props.onRenderMetrics; }, [props.onRenderMetrics]);
  const ready = useRef(props.onReady);
  const firstFrame = useRef(false);
  const cameraFitted = useRef(false);
  const contextLost = useRef(onContextLost);
  useEffect(() => { contextLost.current = onContextLost; }, [onContextLost]);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); contextLost.current(); };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl]);
  useFrame(() => {
    if (firstFrame.current || !cameraFitted.current) return;
    firstFrame.current = true;
    // El callback se ejecuta después de renderizar el primer frame y sus matrices.
    queueMicrotask(onSceneReady);
  });
  useEffect(() => { ready.current = props.onReady; }, [props.onReady]);
  const scaleToMeters = props.asset!.scaleToMeters;
  useEffect(() => {
    const limit = props.quality === "low" ? 1 : props.quality === "high" ? 2 : 1.5;
    setDpr(Math.min(window.devicePixelRatio || 1, limit, Math.sqrt(4_000_000 / Math.max(1, size.width * size.height))));
  }, [props.quality, size.width, size.height, setDpr]);
  useEffect(() => {
    const asset = props.asset!;
    scene.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const presentation = meshPresentation(asset, object.name, props.layers, props.isolatedId);
      object.visible = presentation.visible;
      object.castShadow = props.quality !== "low"; object.receiveShadow = props.quality !== "low";
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        material.opacity = presentation.opacity; material.transparent = presentation.opacity < 1; material.depthWrite = presentation.opacity >= 1;
        if (material instanceof MeshStandardMaterial) {
          material.emissive = new Color(presentation.mapping?.structureId === props.selectedId ? "#087e83" : "#000000");
          material.emissiveIntensity = presentation.mapping?.structureId === props.selectedId ? 0.65 : 0;
        }
        material.needsUpdate = true;
      }
    });
    invalidate();
  }, [scene, props.asset, props.layers, props.isolatedId, props.selectedId, props.quality, invalidate]);
  useEffect(() => {
    scene.scale.setScalar(scaleToMeters);
    const frame = cameraFrame(new Box3().setFromObject(scene), camera instanceof PerspectiveCamera ? camera.fov : 40, size.width / Math.max(size.height, 1));
    const preset = props.asset?.purpose === "technical_demo" ? props.viewPreset ?? "free" : "free";
    camera.up.set(0, 1, 0); if (preset === "dorsal" || preset === "ventral") camera.up.set(0, 0, -1);
    camera.position.copy(frame.center).addScaledVector(viewDirection(preset), frame.distance);
    updateCameraRange(camera, frame.radius / 100, frame.maxDistance * 4);
    camera.lookAt(frame.center);
    if (controls.current) { controls.current.target.copy(frame.center); controls.current.minDistance = frame.minDistance; controls.current.maxDistance = frame.maxDistance; controls.current.update(); }
    cameraFitted.current = true;
    invalidate();
  }, [scene, props.resetToken, props.viewPreset, props.viewToken, props.asset?.purpose, scaleToMeters, camera, size.width, size.height, invalidate]);
  useEffect(() => {
    if (!props.zoomRequest || !controls.current) return;
    const target = controls.current.target;
    const offset = camera.position.clone().sub(target);
    offset.setLength(zoomDistance(offset.length(), props.zoomRequest.delta, controls.current.minDistance, controls.current.maxDistance));
    camera.position.copy(target).add(offset); controls.current.update(); invalidate();
  }, [props.zoomRequest, camera, invalidate]);
  useEffect(() => {
    const planes = props.asset?.purpose === "technical_demo" ? clippingPlane(props.cutPlane ?? "none", new Box3().setFromObject(scene), props.clipOffset ?? 0) : [];
    scene.traverse((object) => { if (object instanceof Mesh) for (const material of Array.isArray(object.material) ? object.material : [object.material]) { material.clippingPlanes = planes; material.clipShadows = true; material.needsUpdate = true; } });
    invalidate();
  }, [scene, props.asset?.purpose, props.cutPlane, props.clipOffset, invalidate]);
  useEffect(() => {
    updateRendererExposure(gl, props.exposure ?? 1, props.quality);
    metrics.current?.({ dpr: gl.getPixelRatio(), exposure: gl.toneMappingExposure, shadowMapSize: props.quality === "low" ? 0 : props.quality === "high" ? 1024 : 512 });
    invalidate();
  }, [gl, props.exposure, props.quality, size.width, size.height, invalidate]);
  useEffect(() => {
    const context = gl.getContext();
    const debug = context.getExtension("WEBGL_debug_renderer_info");
    const renderer = debug ? String(context.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : String(context.getParameter(context.RENDERER));
    let triangles = 0;
    scene.traverse((object) => { if (object instanceof Mesh) triangles += (object.geometry.index?.count ?? object.geometry.getAttribute("position").count) / 3; });
    ready.current?.({ triangles, renderer });
  }, [scene, gl]);
  function select(event: ThreeEvent<MouseEvent>) {
    if (event.delta > 5 || !(event.object instanceof Mesh)) return;
    const state = meshPresentation(props.asset!, event.object.name, props.layers, props.isolatedId);
    if (!state.visible || !state.mapping) return;
    const materials = Array.isArray(event.object.material) ? event.object.material : [event.object.material];
    if (materials.some((material: Material) => material.clippingPlanes?.some((plane: Plane) => plane.distanceToPoint(event.point) < 0))) return;
    event.stopPropagation(); props.onSelect(state.mapping.structureId);
  }
  return <>
    <hemisphereLight args={["#ffffff", "#71808b", 2.2]} />
    <directionalLight position={[3, 5, 6]} intensity={2.8} castShadow={props.quality !== "low"} shadow-mapSize-width={props.quality === "high" ? 1024 : 512} shadow-mapSize-height={props.quality === "high" ? 1024 : 512} shadow-bias={-0.0005} />
    <directionalLight position={[-4, 1, 2]} intensity={0.6} />
    <primitive object={scene} onClick={select} dispose={null} />
    <OrbitControls ref={controls} makeDefault enableDamping />
  </>;
}
export default function AnatomyViewer(props: AnatomyViewerProps) {
  const [scene, setScene] = useState<Object3D | null>(null);
  const [status, setStatus] = useState("Cargando demostración técnica…");
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const resourceUrl = props.asset?.resourceUrl;
  const expectedBytes = props.asset?.byteSize;
  const expectedHash = props.asset?.sha256;
  useEffect(() => {
    let loaded: Object3D | null = null, cancelled = false;
    const controller = new AbortController();
    if (!props.asset || props.asset.availability !== "available") {
      void Promise.resolve().then(() => { if (!cancelled) { setScene(null); setStatus("Modelo 3D no disponible"); } });
      return () => { cancelled = true; };
    }
    async function load() {
      try {
        await Promise.resolve();
        if (cancelled) return;
        setScene(null); setFailed(false); setStatus("Cargando demostración técnica…");
        const asset = viewerAssetSchema.parse(props.asset);
        const response = await fetch(`${asset.resourceUrl}?v=${asset.sha256}`, { cache: "force-cache", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]) });
        if (!response.ok) throw new Error("Archivo no disponible");
        const bytes = await readBoundedBody(response, asset.byteSize);
        const digest = await crypto.subtle.digest("SHA-256", bytes);
        const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
        if (hash !== asset.sha256) throw new Error("Integridad del archivo inválida");
        const manager = new LoadingManager();
        manager.setURLModifier((url) => safeResourceUri(url, window.location.origin));
        const gltf = await new GLTFLoader(manager).parseAsync(bytes, `${window.location.origin}${asset.resourceUrl.slice(0, asset.resourceUrl.lastIndexOf("/") + 1)}`);
        loaded = gltf.scene;
        validateLoadedScene(loaded, asset);
        const originals = new Set<Material>();
        loaded.traverse((object) => {
          if (object instanceof Mesh) {
            const materials: Material[] = Array.isArray(object.material) ? object.material : [object.material];
            materials.forEach((material) => originals.add(material));
            object.material = Array.isArray(object.material) ? materials.map((material) => material.clone()) : materials[0].clone();
          }
        });
        originals.forEach((material) => material.dispose());
        if (cancelled) { dispose(loaded); loaded = null; return; }
        setScene(loaded);
      } catch {
        if (loaded) { dispose(loaded); loaded = null; }
        if (!cancelled) { setFailed(true); setStatus("No se pudo abrir el visor 3D. Las fichas siguen disponibles en la lista."); }
      }
    }
    void load();
    return () => { cancelled = true; controller.abort(); if (loaded) dispose(loaded); };
    // La misma URL compartida por las especies se carga una vez; el mapping cambia por props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceUrl, expectedBytes, expectedHash, retry]);
  function fail() { setFailed(true); setStatus("WebGL no disponible o contexto perdido. Las fichas siguen disponibles en la lista."); }
  return <section className={`${styles.viewer} ${props.variant === "immersive" ? styles.immersive : ""}`} style={{ backgroundColor: props.backgroundColor }} aria-label={props.language === "en" ? "Three-dimensional viewer" : "Visor tridimensional"}>
    {props.variant !== "immersive" && <div className={styles.notice}>{props.asset?.purpose === "technical_demo" ? "Demostración técnica · formas geométricas, sin representación anatómica" : "Visor de activo científico · revisión indicada en su ficha"}</div>}
    <div data-testid="viewer-status" role="status" className={`${styles.status} ${props.variant === 'immersive' && status === 'Visor listo' ? styles.readyStatus : ''}`}>{status}</div>
    <div data-testid="viewer-canvas" className={styles.canvas}>
      {scene && !failed && <CanvasBoundary key={retry} onError={fail}><Canvas key={props.quality} shadows={props.quality === "low" ? false : "soft"} frameloop="demand" dpr={[1, props.quality === "low" ? 1 : props.quality === "high" ? 2 : 1.5]} camera={{ position: [0, 0, 7], fov: 40, near: 0.01, far: 100 }} gl={{ alpha: true, antialias: props.quality !== "low", powerPreference: "low-power", localClippingEnabled: true }} onCreated={({ gl }) => { gl.domElement.setAttribute("aria-label", "Escena 3D: arrastre para girar, rueda para acercar; selección alternativa mediante botones"); }} fallback={<span>WebGL no disponible. Consulte las fichas mediante la lista.</span>}><Scene scene={scene} {...props} onSceneReady={() => setStatus("Visor listo")} onContextLost={fail} /></Canvas></CanvasBoundary>}
      {failed && <button className={styles.retry} onClick={() => setRetry((value) => value + 1)}>Reintentar visor</button>}
    </div>
    {scene && !failed && props.asset && <div className={styles.meshButtons} aria-label="Selección de formas por teclado">{props.asset.meshMappings.map((mapping) => { const state = meshPresentation(props.asset!, mapping.nodeId, props.layers, props.isolatedId); const technicalLabels: Record<string, string> = { "demo-sphere": "Esfera", "demo-box": "Cubo", "demo-torus": "Toro", "demo-cone": "Cono" }; return <button key={mapping.nodeId} disabled={!state.visible} aria-pressed={mapping.structureId === props.selectedId} onClick={() => props.onSelect(mapping.structureId)}>{props.asset?.purpose === "technical_demo" ? technicalLabels[mapping.nodeId] ?? mapping.nodeId : mapping.nodeId}</button>; })}</div>}
    {props.variant !== "immersive" && <p className={styles.help}>Arrastre para girar · rueda o gesto para acercar · clic o toque para seleccionar</p>}
  </section>;
}
