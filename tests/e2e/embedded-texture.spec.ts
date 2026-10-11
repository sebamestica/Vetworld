import { test, expect } from '@playwright/test';

test('textura GLB embebida carga con CSP y decodifica JPEG real', async ({page}) => {
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error' && /GLTFLoader|Content Security Policy|Fetch API cannot load blob/.test(message.text())) errors.push(message.text()); });
  const response = await page.goto('/');
  expect(response?.headers()['content-security-policy']).toMatch(/connect-src[^;]*blob:/);
  await expect(page.getByTestId('viewer-status')).toHaveText('Visor listo');
  const dimensions = await page.evaluate(async () => {
    const response = await fetch('/models/feline/tavernier-skeleton.glb');
    const bytes = await response.arrayBuffer(); const view = new DataView(bytes);
    const jsonLength = view.getUint32(12,true);
    const document = JSON.parse(new TextDecoder().decode(bytes.slice(20,20+jsonLength)));
    const image = document.images[0]; const buffer = document.bufferViews[image.bufferView];
    const start = 28+jsonLength+(buffer.byteOffset ?? 0);
    const uri = URL.createObjectURL(new Blob([bytes.slice(start,start+buffer.byteLength)],{type:image.mimeType}));
    try {
      const bitmap = await createImageBitmap(await (await fetch(uri)).blob());
      const size = [bitmap.width,bitmap.height]; bitmap.close(); return size;
    } finally { URL.revokeObjectURL(uri); }
  });
  expect(dimensions).toEqual([2048,2048]);
  expect(errors).toEqual([]);
});

test('error de decodificación de textura no produce falso visor listo', async ({page}) => {
  await page.addInitScript(() => { window.createImageBitmap = async () => { throw new Error('Fixture: decodificación fallida'); }; });
  await page.goto('/');
  await expect(page.getByTestId('viewer-status')).toContainText('No se pudo abrir');
  await expect(page.getByTestId('viewer-canvas').locator('canvas')).toHaveCount(0);
});
