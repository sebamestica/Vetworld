import type { Camera, WebGLRenderer } from "three";

// Three.js administra estos recursos imperativos fuera del estado de React.
export function updateCameraRange(camera: Camera & { near: number; far: number; updateProjectionMatrix: () => void }, near: number, far: number) {
  camera.near = near; camera.far = far; camera.updateProjectionMatrix();
}
export function updateRendererExposure(renderer: WebGLRenderer, exposure: number, quality: string) {
  renderer.toneMappingExposure = Number.isFinite(exposure) ? Math.min(4, Math.max(0.1, exposure)) : 1;
  renderer.domElement.dataset.quality = quality;
  renderer.domElement.dataset.dpr = String(renderer.getPixelRatio());
  renderer.domElement.dataset.exposure = String(renderer.toneMappingExposure);
  // Recuento de recursos GPU vivos (renderer.info.memory) para pruebas de liberación; no es medición de VRAM.
  const memory = renderer.info?.memory;
  if (memory) { renderer.domElement.dataset.geometries = String(memory.geometries); renderer.domElement.dataset.textures = String(memory.textures); }
}

export type ViewerQuality = "balanced" | "low" | "high";
/** Límite superior de DPR por calidad (sin factor adaptativo). */
export function dprLimit(quality: ViewerQuality) { return quality === "low" ? 1 : quality === "high" ? 2 : 1.5; }
/** Píxeles máximos del búfer de dibujo (~4 MP) para acotar coste de relleno en pantallas grandes. */
export const MAX_DRAWING_PIXELS = 4_000_000;
/** DPR mínimo durante la interacción, para que el modelo siga siendo legible al girar. */
export const MIN_INTERACTIVE_DPR = 0.75;
/**
 * DPR objetivo: `devicePixelRatio` acotado por calidad y por ~4 MP de búfer, multiplicado por el
 * factor de rendimiento de R3F (`performance.current`, 0,5–1, que baja durante la interacción con
 * `OrbitControls regress` y vuelve a 1 tras `debounce`). Nunca supera el DPR base ni baja de 0,75
 * salvo que el base ya sea menor. Redondeado a centésimas para evitar re-render por ruido.
 */
export function adaptiveDpr(input: { devicePixelRatio: number; quality: ViewerQuality; width: number; height: number; performance?: number }) {
  const device = Number.isFinite(input.devicePixelRatio) && input.devicePixelRatio > 0 ? input.devicePixelRatio : 1;
  const base = Math.min(device, dprLimit(input.quality), Math.sqrt(MAX_DRAWING_PIXELS / Math.max(1, input.width * input.height)));
  const factor = Math.min(1, Math.max(0, input.performance ?? 1));
  const target = factor >= 1 ? base : Math.min(base, Math.max(MIN_INTERACTIVE_DPR, base * factor));
  return Math.round(target * 100) / 100;
}
