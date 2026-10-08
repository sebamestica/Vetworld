import { describe, expect, it } from "vitest";
import { viewerAssets } from "../../src/modules/viewer/assets";
import { viewerAssetSchema, VIEWER_BUDGET } from "../../src/modules/viewer/manifest";
import { meshPresentation } from "../../src/modules/viewer/visibility";
import { readBoundedBody, safeResourceUri, validateLoadedScene } from "../../src/modules/viewer/loading";
import { Group, Mesh, BoxGeometry, MeshStandardMaterial } from "three";

const asset = viewerAssets.find(a => a.id === "canine-technical-demo")!;

describe("manifiestos y selección del visor", () => {
  it("mantiene separados mappings caninos/felinos del mismo archivo técnico", () => {
    const demos = viewerAssets.filter(a => a.purpose === "technical_demo");
    expect(demos).toHaveLength(2);
    expect(demos[1].resourceUrl).toBe(demos[0].resourceUrl);
    for (const entry of demos) { expect(entry.purpose).toBe("technical_demo"); expect(entry.reviewStatus).toBe("pending"); expect(entry.meshMappings.every((mapping) => mapping.structureId.startsWith(`${entry.speciesId}:`))).toBe(true); }
  });
  it.each(["https://evil.example/model.glb", "/models/../secret.glb", "/models/%2e%2e/secret.glb", "/models/demo.glb?url=x"])("rechaza ruta insegura %s", (resourceUrl) => expect(viewerAssetSchema.safeParse({ ...asset, resourceUrl }).success).toBe(false));
  it("rechaza presupuestos excesivos y mappings mezclados", () => {
    expect(viewerAssetSchema.safeParse({ ...asset, byteSize: VIEWER_BUDGET.bytes + 1 }).success).toBe(false);
    expect(viewerAssetSchema.safeParse({ ...asset, meshMappings: [{ ...asset.meshMappings[0], structureId: "feline:scapula" }] }).success).toBe(false);
    expect(viewerAssetSchema.safeParse({ ...asset, meshMappings: [asset.meshMappings[0], asset.meshMappings[0]] }).success).toBe(false);
    expect(viewerAssetSchema.safeParse({ ...asset, license: { ...asset.license, verified: false } }).success).toBe(false);
  });
  it("desactiva selección de nodos sin mapping, ocultos y aislados fuera de selección", () => {
    expect(meshPresentation(asset, "unknown", {}, null).visible).toBe(false);
    expect(meshPresentation(asset, "demo-sphere", { skeleton: { visible: false, opacity: 1 } }, null).visible).toBe(false);
    expect(meshPresentation(asset, "demo-sphere", {}, "canine:biceps-brachii").visible).toBe(false);
    expect(meshPresentation(asset, "demo-sphere", {}, "canine:scapula").visible).toBe(true);
  });
  it("acota transparencia sin alterar identidad", () => {
    const result = meshPresentation(asset, "demo-box", { "muscles-unclassified": { visible: true, opacity: -5 } }, null);
    expect(result.opacity).toBe(0.15); expect(result.mapping?.structureId).toBe("canine:biceps-brachii");
  });
});

describe("carga limitada y recursos del visor", () => {
  it("lee un cuerpo exacto y rechaza longitud excedida o incompleta", async () => {
    expect((await readBoundedBody(new Response(new Uint8Array([1, 2, 3])), 3)).byteLength).toBe(3);
    await expect(readBoundedBody(new Response(new Uint8Array([1, 2, 3, 4])), 3)).rejects.toThrow("excede");
    await expect(readBoundedBody(new Response(new Uint8Array([1, 2])), 3)).rejects.toThrow("inesperado");
    await expect(readBoundedBody(new Response(new Uint8Array([1]), { headers: { "content-length": "10000000" } }), 3)).rejects.toThrow("excede");
  });
  it("permite imágenes y buffers embebidos y recursos locales; bloquea origen externo", () => {
    const origin = "http://localhost:3000";
    for (const uri of ["data:image/png;base64,AABB", "data:image/jpeg;base64,AABB", "data:image/webp;base64,AABB", "data:application/octet-stream;base64,AABB", "blob:http://localhost:3000/id", "/models/local/texture.png"]) expect(safeResourceUri(uri, origin)).toBeTruthy();
    for (const uri of ["https://evil.example/model.bin", "blob:https://evil.example/id", "data:text/html;base64,AABB", "/api/private", "/models/%2e%2e/secret"]) expect(() => safeResourceUri(uri, origin)).toThrow();
  });
  it("rechaza escena con conteo falso, nodo ausente o coordenadas no finitas", () => {
    const scene = new Group(), geometry = new BoxGeometry(), mesh = new Mesh(geometry, new MeshStandardMaterial()); mesh.name = "demo-box"; scene.add(mesh);
    expect(() => validateLoadedScene(scene, asset)).toThrow("triángulos");
    const mappedAsset = { ...asset, triangleCount: 12 };
    expect(() => validateLoadedScene(scene, mappedAsset)).toThrow("Mapping");
    const mapped = { ...mappedAsset, meshMappings: [mappedAsset.meshMappings[1]] };
    expect(() => validateLoadedScene(scene, mapped)).not.toThrow();
    geometry.getAttribute("position").setX(0, NaN);
    expect(() => validateLoadedScene(scene, mapped)).toThrow("no finitas");
    geometry.dispose(); mesh.material.dispose();
  });
});
