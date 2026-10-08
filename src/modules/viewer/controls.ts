import { Box3, Plane, Vector3 } from "three";

export type ViewPreset = "left" | "right" | "front" | "back" | "dorsal" | "ventral" | "free";
export type CutPlane = "none" | "sagittal" | "median" | "transverse" | "dorsal";

// Ejes cartesianos de la fixture técnica; no constituyen orientación anatómica.
export function viewDirection(preset: ViewPreset): Vector3 {
  const axes: Record<ViewPreset, [number, number, number]> = { left: [-1, 0, 0], right: [1, 0, 0], front: [0, 0, 1], back: [0, 0, -1], dorsal: [0, 1, 0], ventral: [0, -1, 0], free: [0, 0, 1] };
  return new Vector3(...axes[preset]);
}
export function cameraFrame(box: Box3, fov: number, aspect: number) {
  const center = box.getCenter(new Vector3());
  const radius = Math.max(box.getSize(new Vector3()).length() / 2, 0.001);
  const vertical = Math.max(1, Math.min(170, fov)) * Math.PI / 360;
  const angle = Math.min(vertical, Math.atan(Math.tan(vertical) * Math.max(aspect, 0.01)));
  const distance = radius / Math.sin(angle) * 1.12;
  return { center, radius, distance, minDistance: radius * 1.05, maxDistance: distance * 8 };
}
export function zoomDistance(distance: number, delta: number, min: number, max: number) {
  return Math.min(max, Math.max(min, distance * (delta > 0 ? 0.85 : delta < 0 ? 1.15 : 1)));
}
export function clippingPlane(plane: CutPlane, box: Box3, offset: number): Plane[] {
  if (plane === "none") return [];
  const axis = plane === "transverse" ? "z" : plane === "dorsal" ? "y" : "x";
  const center = box.getCenter(new Vector3()), size = box.getSize(new Vector3());
  const fraction = plane === "median" ? 0 : Number.isFinite(offset) ? Math.max(-1, Math.min(1, offset)) : 0;
  const normal = new Vector3(); normal[axis] = 1;
  return [new Plane(normal, -(center[axis] + size[axis] * fraction / 2))];
}
