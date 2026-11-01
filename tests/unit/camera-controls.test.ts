import { describe, expect, it } from "vitest";
import { Box3, BufferAttribute, BufferGeometry, Mesh, Vector3 } from "three";
import { cameraFrame, clippingPlane, expandByIndexedVertices, viewDirection, zoomDistance } from "../../src/modules/viewer/controls";

const box = new Box3(new Vector3(-2, -1, -3), new Vector3(2, 1, 3));
describe("Controles cartesianos de la demostración técnica", () => {
  it("encuadra todos los extremos y se adapta al lienzo vertical", () => {
    const wide = cameraFrame(box, 40, 2), narrow = cameraFrame(box, 40, 0.5);
    expect(wide.distance).toBeGreaterThan(wide.radius);
    expect(narrow.distance).toBeGreaterThan(wide.distance);
    expect(wide.center.toArray()).toEqual([0, 0, 0]);
  });
  it("conserva escala al calcular los límites de cámara", () => {
    const scaled = cameraFrame(new Box3(box.min.clone().multiplyScalar(0.01), box.max.clone().multiplyScalar(0.01)), 40, 1);
    expect(scaled.distance).toBeCloseTo(cameraFrame(box, 40, 1).distance * 0.01);
    expect(scaled.minDistance).toBeLessThan(scaled.distance);
    expect(scaled.maxDistance).toBeGreaterThan(scaled.distance);
  });
  it("presets opuestos usan ejes explícitos sin asignar identidad anatómica", () => {
    expect(viewDirection("left").dot(viewDirection("right"))).toBe(-1);
    expect(viewDirection("front").dot(viewDirection("back"))).toBe(-1);
    expect(viewDirection("dorsal").dot(viewDirection("ventral"))).toBe(-1);
  });
  it("zoom acerca, aleja y respeta límites físicos derivados del activo", () => {
    expect(zoomDistance(10, 1, 2, 20)).toBe(8.5);
    expect(zoomDistance(10, -1, 2, 20)).toBe(11.5);
    expect(zoomDistance(2, 1, 2, 20)).toBe(2);
    expect(zoomDistance(20, -1, 2, 20)).toBe(20);
  });
  it("recorta con ejes y offsets de bounding box, sin generar superficies internas", () => {
    expect(clippingPlane("none", box, 1)).toEqual([]);
    expect(clippingPlane("median", box, 1)[0].constant).toBeCloseTo(0);
    expect(clippingPlane("sagittal", box, 0.5)[0].distanceToPoint(new Vector3(1, 0, 0))).toBe(0);
    expect(clippingPlane("transverse", box, 0.5)[0].distanceToPoint(new Vector3(0, 0, 1.5))).toBe(0);
    expect(clippingPlane("dorsal", box, 0.5)[0].distanceToPoint(new Vector3(0, 0.5, 0))).toBe(0);
    expect(Number.isFinite(clippingPlane("sagittal", box, Number.NaN)[0].constant)).toBe(true);
  });
});

describe("encuadre de piezas con búfer de posiciones compartido", () => {
  it("usa solo los vértices indexados y la transformación de mundo", () => {
    // Geometría sintética: dos triángulos en un búfer compartido; la pieza indexa solo el segundo.
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Float32Array([-10, 0, 0, -9, 0, 0, -10, 1, 0, 1, 0, 0, 2, 0, 0, 1, 1, 0]), 3));
    geometry.setIndex([3, 4, 5]);
    const mesh = new Mesh(geometry); mesh.position.set(0, 0, 5);
    const piece = expandByIndexedVertices(new Box3(), mesh);
    expect(piece.min.toArray()).toEqual([1, 0, 5]); expect(piece.max.toArray()).toEqual([2, 1, 5]);
    expect(new Box3().setFromObject(mesh).min.x).toBe(-10);
    geometry.dispose();
  });
});
