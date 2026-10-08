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
}
