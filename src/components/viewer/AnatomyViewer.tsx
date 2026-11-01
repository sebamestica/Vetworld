"use client";

import { useEffect, useState, useRef, Component, type ReactNode } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { LoadingManager, Mesh, MeshStandardMaterial, Object3D, Color, Box3, Texture, PerspectiveCamera, type Material, type Plane } from "three";
import type { OrbitControls as Controls } from "three-stdlib";
import { viewerAssetSchema, type ViewerAsset } from "@/modules/viewer/manifest";
import { meshPresentation, type ViewerLayers, type ViewerPieces } from "@/modules/viewer/visibility";
import { selectablePieces } from "@/modules/viewer/selection";
import { readBoundedBody, safeResourceUri, validateLoadedScene } from "@/modules/viewer/loading";
import { cameraFrame, clippingPlane, expandByIndexedVertices, viewDirection, zoomDistance, type CutPlane, type ViewPreset } from "@/modules/viewer/controls";
import { adaptiveDpr, dprLimit, markFocusedPiece, updateCameraRange, updateRendererExposure } from "@/modules/viewer/rendering";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { t, type Language, type UiKey } from "@/lib/ui/i18n";
import styles from "./AnatomyViewer.module.css";

export interface AnatomyViewerProps {
  asset: ViewerAsset | null; selectedId: string | null; onSelect: (id: string) => void;
  layers: ViewerLayers; isolatedId: string | null; resetToken: number; quality: "balanced" | "low" | "high";
  onReady?: (info: { triangles: number; renderer: string }) => void;
  variant?: "classic" | "immersive"; language?: Language; backgroundColor?: string; exposure?: number;
  viewPreset?: ViewPreset; viewToken?: number; zoomRequest?: { token: number; delta: number };
  cutPlane?: CutPlane; clipOffset?: number;
  onRenderMetrics?: (info: { dpr: number; exposure: number; shadowMapSize: number }) => void;
  /** Nombres del catálogo por `structureId` para etiquetar la alternativa textual del canvas. */
  structureNames?: Record<string, { spanishName: string; canonicalLatinName: string }>;
  /** Visibilidad/opacidad por pieza (`structureId`), combinada con la de su capa. */
  pieces?: ViewerPieces;
  /** Encuadra las mallas visibles de `structureId` cuando cambia `token` (> 0). */
  focusRequest?: { token: number; structureId: string | null };
}
/** Factor de rendimiento de R3F: baja a 0,5 durante la interacción (`OrbitControls regress`) y vuelve a 1 tras 200 ms. Constante para no reconfigurar en cada render. */
const PERFORMANCE = { min: 0.5, debounce: 200 } as const;
const technicalLabels: Record<string, UiKey> = { "demo-sphere": "shapeSphere", "demo-box": "shapeBox", "demo-torus": "shapeTorus", "demo-cone": "shapeCone" };
/** Español muestra el nombre común; inglés el latino NAV (invariable), porque el nombre común no tiene traducción revisada. */
function structureLabel(names: AnatomyViewerProps["structureNames"], id: string | null, language: Language): string | null {
  const entry = id ? names?.[id] : undefined;
  if (!entry) return null;
  return language === "en" ? entry.canonicalLatinName : entry.spanishName;
}
function dispose(scene: Object3D) {
  const textures = new Set<Texture>();
  scene.traverse((object) => { if (object instanceof Mesh) { object.geometry.dispose(); const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach((material) => { for (const value of Object.values(material)) { if (value instanceof Texture) textures.add(value); } material.dispose(); }); } });
  textures.forEach((texture) => {
    texture.dispose();
    // ImageBitmapLoader decodifica fuera del montón JS: cerrar el bitmap libera su memoria sin esperar al GC.
    if (typeof ImageBitmap !== "undefined" && texture.image instanceof ImageBitmap) texture.image.close();
  });
}
class CanvasBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}
function Scene({ scene, onSceneReady, onContextLost, onDpr, ...props }: AnatomyViewerProps & { scene: Object3D; onSceneReady: () => void; onContextLost: () => void; onDpr: (dpr: number) => void }) {
  const { invalidate, camera, gl, size, setDpr } = useThree();
  const performanceFactor = useThree((state) => state.performance.current);
  const viewportDpr = useThree((state) => state.viewport.dpr);
  const controls = useRef<Controls>(null);
  const reducedMotion = usePrefersReducedMotion();
  const language = props.language ?? "es";
  useEffect(() => { gl.domElement.setAttribute("aria-label", t(language, "canvasLabel")); }, [gl, language]);
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
  const reportDpr = useRef(onDpr);
  useEffect(() => { reportDpr.current = onDpr; }, [onDpr]);
  useEffect(() => {
    // El DPR se informa también al Canvas: R3F restablece `dpr` desde su prop en cada render, de modo que un setDpr aislado se perdería.
    const target = adaptiveDpr({ devicePixelRatio: window.devicePixelRatio, quality: props.quality, width: size.width, height: size.height, performance: performanceFactor });
    setDpr(target); reportDpr.current(target); invalidate();
  }, [props.quality, size.width, size.height, performanceFactor, setDpr, invalidate]);
  useEffect(() => {
    const asset = props.asset!;
    scene.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const presentation = meshPresentation(asset, object.name, props.layers, props.isolatedId, props.pieces);
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
  }, [scene, props.asset, props.layers, props.pieces, props.isolatedId, props.selectedId, props.quality, invalidate]);
  const focusToken = props.focusRequest?.token ?? 0, focusId = props.focusRequest?.structureId ?? null;
  /** Pieza encuadrada vigente: sobrevive a cambios de tamaño (p. ej. al abrir la ficha) y se anula con Restaurar o una vista. */
  const focused = useRef<string | null>(null);
  const framing = useRef({ resetToken: props.resetToken, viewToken: props.viewToken, focusToken: 0, scene });
  useEffect(() => {
    const last = framing.current;
    if (last.resetToken !== props.resetToken || last.viewToken !== props.viewToken || last.scene !== scene) focused.current = null;
    if (focusToken && focusToken !== last.focusToken) focused.current = focusId;
    framing.current = { resetToken: props.resetToken, viewToken: props.viewToken, focusToken, scene };
    scene.scale.setScalar(scaleToMeters);
    scene.updateMatrixWorld(true);
    const aspect = size.width / Math.max(size.height, 1), fov = camera instanceof PerspectiveCamera ? camera.fov : 40;
    const frame = cameraFrame(new Box3().setFromObject(scene), fov, aspect);
    // Caja de la pieza enfocada: solo sus mallas visibles; sin ellas se vuelve al encuadre completo.
    const pieceBox = new Box3(), asset = props.asset!, target = focused.current;
    if (target) scene.traverse((object) => { if (object instanceof Mesh && object.visible && asset.meshMappings.some(m => m.nodeId === object.name && m.structureId === target)) expandByIndexedVertices(pieceBox, object); });
    const preset = props.asset?.purpose === "technical_demo" ? props.viewPreset ?? "free" : "free";
    updateCameraRange(camera, frame.radius / 100, frame.maxDistance * 4);
    if (controls.current) { controls.current.minDistance = frame.minDistance; controls.current.maxDistance = frame.maxDistance; }
    if (target && !pieceBox.isEmpty() && controls.current) {
      // Encuadre de la pieza: misma dirección de cámara; salto inmediato (sin animación).
      const piece = cameraFrame(pieceBox, fov, aspect);
      const direction = camera.position.clone().sub(controls.current.target).normalize();
      if (direction.lengthSq() === 0) direction.set(0, 0, 1);
      controls.current.minDistance = Math.min(frame.minDistance, piece.minDistance);
      controls.current.target.copy(piece.center);
      camera.position.copy(piece.center).addScaledVector(direction, Math.max(piece.distance, controls.current.minDistance));
      markFocusedPiece(gl, target, camera.position.distanceTo(piece.center));
    } else {
      camera.up.set(0, 1, 0); if (preset === "dorsal" || preset === "ventral") camera.up.set(0, 0, -1);
      camera.position.copy(frame.center).addScaledVector(viewDirection(preset), frame.distance);
      camera.lookAt(frame.center);
      controls.current?.target.copy(frame.center);
      markFocusedPiece(gl, null, frame.distance);
    }
    controls.current?.update();
    cameraFitted.current = true;
    invalidate();
    // La visibilidad/selección no reencuadra: solo tamaño, restauración, vista o una nueva petición de foco.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, props.resetToken, props.viewPreset, props.viewToken, props.asset?.purpose, scaleToMeters, camera, size.width, size.height, invalidate, focusToken]);
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
  }, [gl, props.exposure, props.quality, size.width, size.height, viewportDpr, invalidate]);
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
    const state = meshPresentation(props.asset!, event.object.name, props.layers, props.isolatedId, props.pieces);
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
    <OrbitControls ref={controls} makeDefault enableDamping={!reducedMotion} regress />
  </>;
}
export default function AnatomyViewer(props: AnatomyViewerProps) {
  const [scene, setScene] = useState<Object3D | null>(null);
  const [status, setStatus] = useState<UiKey>("viewerLoadingDemo");
  const language = props.language ?? "es";
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [dpr, setDprState] = useState<{ quality: AnatomyViewerProps["quality"]; value: number } | null>(null);
  const resourceUrl = props.asset?.resourceUrl;
  const expectedBytes = props.asset?.byteSize;
  const expectedHash = props.asset?.sha256;
  useEffect(() => {
    let loaded: Object3D | null = null, cancelled = false;
    const controller = new AbortController();
    if (!props.asset || props.asset.availability !== "available") {
      void Promise.resolve().then(() => { if (!cancelled) { setScene(null); setStatus("noModel"); } });
      return () => { cancelled = true; };
    }
    async function load() {
      try {
        await Promise.resolve();
        if (cancelled) return;
        setScene(null); setFailed(false); setStatus(props.asset?.purpose === "technical_demo" ? "viewerLoadingDemo" : "viewerLoadingModel");
        const asset = viewerAssetSchema.parse(props.asset);
        const response = await fetch(`${asset.resourceUrl}?v=${asset.sha256}`, { cache: "force-cache", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]) });
        if (!response.ok) throw new Error("Archivo no disponible");
        const bytes = await readBoundedBody(response, asset.byteSize);
        const digest = await crypto.subtle.digest("SHA-256", bytes);
        const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
        if (hash !== asset.sha256) throw new Error("Integridad del archivo inválida");
        const manager = new LoadingManager();
        let resourceFailed = false;
        manager.onError = () => { resourceFailed = true; };
        manager.setURLModifier((url) => safeResourceUri(url, window.location.origin));
        const gltf = await new GLTFLoader(manager).parseAsync(bytes, `${window.location.origin}${asset.resourceUrl.slice(0, asset.resourceUrl.lastIndexOf("/") + 1)}`);
        loaded = gltf.scene;
        if (resourceFailed) throw new Error('No se pudieron cargar las texturas del modelo');
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
        if (!cancelled) { setFailed(true); setStatus("viewerLoadFailed"); }
      }
    }
    void load();
    return () => { cancelled = true; controller.abort(); if (loaded) dispose(loaded); };
    // La misma URL compartida por las especies se carga una vez; el mapping cambia por props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceUrl, expectedBytes, expectedHash, retry]);
  function fail() { setFailed(true); setStatus("viewerContextLost"); }
  const selectedName = structureLabel(props.structureNames, props.selectedId, language);
  const pieces = selectablePieces(props.asset);
  const technical = props.asset?.purpose === "technical_demo";
  return <section className={`${styles.viewer} ${props.variant === "immersive" ? styles.immersive : ""}`} style={{ backgroundColor: props.backgroundColor }} aria-label={t(language, "viewerLabel")}>
    {props.variant !== "immersive" && <div className={styles.notice}>{t(language, technical ? "technicalNotice" : "scientificNotice")}</div>}
    <div data-testid="viewer-status" role="status" aria-live="polite" aria-atomic="true" className={`${styles.status} ${props.variant === 'immersive' && status === 'viewerReady' ? styles.readyStatus : ''}`}>{t(language, status)}</div>
    <div data-testid="viewer-canvas" className={styles.canvas}>
      {scene && !failed && <CanvasBoundary key={retry} onError={fail}><Canvas key={props.quality} shadows={props.quality === "low" ? false : "soft"} frameloop="demand" performance={PERFORMANCE} dpr={dpr?.quality === props.quality ? dpr.value : [1, dprLimit(props.quality)]} camera={{ position: [0, 0, 7], fov: 40, near: 0.01, far: 100 }} gl={{ alpha: true, antialias: props.quality !== "low", powerPreference: "low-power", localClippingEnabled: true }} fallback={<span>{t(language, "webglFallback")}</span>}><Scene scene={scene} {...props} onSceneReady={() => setStatus("viewerReady")} onContextLost={fail} onDpr={(value) => setDprState((current) => current?.quality === props.quality && current.value === value ? current : { quality: props.quality, value })} /></Canvas></CanvasBoundary>}
      {failed && <button className={styles.retry} onClick={() => setRetry((value) => value + 1)}>{t(language, "retryViewer")}</button>}
    </div>
    {scene && !failed && props.asset && <div className={styles.meshButtons} role="group" aria-label={t(language, technical ? "shapeSelection" : "pieceSelection")} data-testid="viewer-pieces">
      {pieces.length === 0 && <p className={styles.emptyPieces}>{t(language, "noSelectablePieces")}</p>}
      {pieces.map((piece) => {
        // Una entrada por ficha: los semiespacios de escena de una misma estructura no se presentan como lados.
        const visible = piece.nodeIds.some(nodeId => meshPresentation(props.asset!, nodeId, props.layers, props.isolatedId, props.pieces).visible);
        const nodeId = piece.nodeIds[0];
        const name = technical ? (technicalLabels[nodeId] ? t(language, technicalLabels[nodeId]) : nodeId) : structureLabel(props.structureNames, piece.structureId, language) ?? nodeId;
        const label = piece.admission === "partial-surface" ? t(language, "pieceLabelPartial", { name }) : name;
        return <button key={piece.structureId} type="button" disabled={!visible} aria-pressed={piece.structureId === props.selectedId} onClick={() => props.onSelect(piece.structureId)}>{label}</button>;
      })}
    </div>}
    <p className={styles.srOnly} aria-live="polite" aria-atomic="true" data-testid="viewer-selection">{selectedName ? t(language, "selectedStructure", { name: selectedName }) : ""}</p>
    {props.variant !== "immersive" && <p className={styles.help}>{t(language, "viewerHelp")}</p>}
  </section>;
}
