import { readFileSync } from 'node:fs';
import { test, expect, type Page } from '@playwright/test';
import { Box3, Vector3 } from 'three';
import { cameraFrame } from '../../src/modules/viewer/controls';

async function dismissOrientation(page: Page) {
  const button = page.getByRole('button', { name: 'Continuar en vertical' });
  if (await button.isVisible()) await button.click();
}
async function ready(page: Page) {
  await page.goto('/technical-demo');
  await expect(page.getByTestId('viewer-status')).toHaveText('Visor listo');
  await dismissOrientation(page);
  await expect(page.getByTestId('viewer-canvas').locator('canvas')).toBeVisible();
}
async function choose(page: Page, query: string, species = 'Canino') {
  const search = page.getByRole('combobox', { name: 'Buscar estructuras anatómicas' });
  await search.fill(query);
  const group = page.getByRole('listbox', { name: 'Resultados de búsqueda' }).getByRole('group', { name: species, exact: true });
  const option = group.getByRole('option', { name: query === 'biceps' ? /^Bíceps braquial/ : /^Escápula/ });
  await expect(option).toBeVisible(); await option.click();
}
async function openTools(page: Page) { await page.getByRole('button', { name: 'Abrir herramientas' }).click(); }
function fixtureBounds() {
  const glb = readFileSync('public/models/technical/interaction-demo.glb');
  const json = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString());
  const bounds = new Box3();
  for (const node of json.nodes) {
    const accessor = json.accessors[json.meshes[node.mesh].primitives[0].attributes.POSITION];
    const offset = new Vector3(...node.translation);
    bounds.union(new Box3(new Vector3(...accessor.min).add(offset), new Vector3(...accessor.max).add(offset)));
  }
  return bounds;
}

test('recorrido real Canvas → ficha → referencias → visor', async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  const calls: string[] = []; page.on('request', req => { if (req.url().includes('/api/v1/')) calls.push(req.url()); });
  await ready(page);
  const canvas = page.getByTestId('viewer-canvas').locator('canvas');
  const box = (await canvas.boundingBox())!;
  const frame = cameraFrame(fixtureBounds(), 40, box.width / box.height);
  const scale = box.height / (2 * Math.tan(40 * Math.PI / 360) * frame.distance);
  const position = { x: box.width / 2 + (-1.25 - frame.center.x) * scale, y: box.height / 2 - (.9 - frame.center.y) * scale };
  if (info.project.name === 'desktop') await canvas.click({ position }); else await canvas.tap({ position });
  const panel = page.getByTestId('detail-panel');
  await expect(panel.getByRole('heading', { name: 'Escápula', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Esfera', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(panel.getByText('Revisión humana pendiente', { exact: true }).first()).toBeVisible();
  await page.getByRole('tab', { name: 'Imágenes reales', exact: true }).click();
  const gallery = panel.getByRole('region', { name: 'Referencias anatómicas reales' });
  await expect(gallery.getByRole('heading', { name: 'Referencias anatómicas reales' })).toBeVisible();
  const source = gallery.getByRole('link', { name: /Consultar fuente académica/ }).first();
  await expect(source).toHaveAttribute('href', /^https:\/\/open\.lib\.umn\.edu\//);
  await expect(source).toHaveAttribute('rel', /noreferrer/);
  expect(calls.some(url => url.includes('/structures/canine%3Ascapula'))).toBe(true);
  expect(calls.some(url => url.includes('/references?structure='))).toBe(true);
  await page.screenshot({ path: `docs/ui-v2/screenshots/references-${info.project.name}.png`, fullPage: true });
  await panel.getByRole('button', { name: 'Cerrar ficha' }).click();
  await expect(canvas).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `docs/ui-v2/screenshots/result-${info.project.name}.png`, fullPage: true });
  expect(errors).toEqual([]);
  await info.attach('recorrido', { body: JSON.stringify({ viewport: info.project.name, apiRequests: calls.length, renderer: 'Chromium WebGL software SwiftShader', geometry: 'synthetic technical fixture' }), contentType: 'application/json' });
});

test('cámara cambia al girar y acercar; CSP permanece local', async ({ page }, info) => {
  const response = await page.goto('/technical-demo'); const csp = response!.headers()['content-security-policy'];
  expect(csp).toContain("script-src 'self' 'nonce-"); expect(csp).not.toContain('unsafe-eval'); expect(csp).toContain("connect-src 'self';");
  await expect(page.getByTestId('viewer-status')).toHaveText('Visor listo'); await dismissOrientation(page);
  const canvas = page.getByTestId('viewer-canvas').locator('canvas'); const before = await canvas.screenshot();
  const box = (await canvas.boundingBox())!; const x = box.x + box.width * .5, y = box.y + box.height * .5;
  if (info.project.name === 'desktop') {
    await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 60, y + 20, { steps: 10 }); await page.mouse.up(); await page.mouse.wheel(0, -200);
  } else {
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 40, y: y + 15, id: 1 }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await session.detach();
    await page.getByRole('button', { name: 'Acercar', exact: true }).click();
  }
  await expect.poll(async () => before.equals(await canvas.screenshot())).toBe(false);
});

test('galería amplía fixture sintética y gestiona archivo ausente', async ({ page }) => {
  const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lWQAAAAASUVORK5CYII=', 'base64'); let missing = false;
  await page.route('**/api/v1/references?structure=*', async route => {
    const original = await route.fetch(); const body = await original.json(); const image = missing ? '/reference-images/e2e-missing.png' : '/reference-images/e2e-test.png';
    body.data = [{ ...body.data[0], authors: ['Fixture de prueba'], title: 'Ilustración sintética de prueba', kind: 'illustration', displayMode: 'internal', imagePath: image, thumbnailPath: image, license: { label: 'Fixture sintética propia, solo pruebas', verified: true, redistributionAllowed: true } }];
    await route.fulfill({ json: body });
  });
  await page.route('**/reference-images/e2e-test.png', route => route.fulfill({ body: pixel, contentType: 'image/png' }));
  await ready(page); await choose(page, 'scapula'); await page.getByRole('tab', { name: 'Imágenes reales', exact: true }).click();
  await page.getByRole('button', { name: 'Ampliar Ilustración sintética de prueba' }).click();
  await expect(page.getByRole('dialog', { name: 'Ilustración sintética de prueba' })).toBeVisible(); await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button', { name: 'Cerrar ficha' }).click(); missing = true;
  await page.route('**/reference-images/e2e-missing.png', route => route.abort());
  await choose(page, 'scapula'); await page.getByRole('tab', { name: 'Imágenes reales', exact: true }).click();
  await expect(page.getByText('Imagen no disponible. Consulte la fuente original.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ampliar Ilustración sintética de prueba' })).toHaveCount(0);
});

test('capas, aislamiento, opacidad y restauración no mezclan selección', async ({ page }) => {
  await ready(page); await choose(page, 'biceps'); await expect(page.getByTestId('detail-panel').getByRole('heading', { name: 'Bíceps braquial', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar ficha' }).click(); await page.getByRole('button', { name: 'Aislar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Esfera', exact: true })).toBeDisabled(); await openTools(page);
  await page.getByRole('checkbox', { name: 'Músculos', exact: true }).uncheck();
  await expect(page.getByRole('button', { name: 'Cubo', exact: true })).toBeDisabled(); await page.getByRole('button', { name: 'Cerrar herramientas' }).click();
  await page.getByRole('button', { name: 'Restaurar', exact: true }).click(); await expect(page.getByRole('button', { name: 'Cubo', exact: true })).toBeEnabled();
  await openTools(page); const slider = page.getByRole('slider', { name: /Opacidad.*Huesos/ }); await slider.fill('0.5');
  await page.getByRole('button', { name: 'Cerrar herramientas' }).click(); await page.getByRole('button', { name: 'Restaurar', exact: true }).click(); await openTools(page); await expect(slider).toHaveValue('1');
});

test('cambio de especie y región limpia ficha y muestra disponibilidad real', async ({ page }) => {
  await ready(page); await choose(page, 'biceps'); await expect(page.getByTestId('detail-panel').getByText('Musculus biceps brachii', { exact: true })).toBeVisible();
  await page.getByLabel('Especie', { exact: true }).selectOption('feline'); await expect(page.getByTestId('detail-panel')).toHaveCount(0);
  const felineRequest = page.waitForResponse(response => response.url().includes('/structures/feline%3Abiceps-brachii') && response.ok());
  await choose(page, 'biceps', 'Felino'); await felineRequest;
  await expect(page.getByTestId('detail-panel').getByText('Musculus biceps brachii', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Especie', { exact: true })).toHaveValue('feline');
  await page.getByRole('button', { name: 'Cerrar ficha' }).click();
  const region = page.getByRole('combobox', { name: 'Región anatómica', exact: true });
  if (!await region.isVisible()) await openTools(page);
  await page.getByRole('combobox', { name: 'Región anatómica', exact: true }).selectOption('head');
  const closeTools = page.getByRole('button', { name: 'Cerrar herramientas' });
  if (await closeTools.isVisible()) await closeTools.click();
  await expect(page.getByTestId('viewer-status')).toHaveText('Modelo 3D no disponible'); await expect(page.getByTestId('viewer-canvas').locator('canvas')).toHaveCount(0);
  await expect(page.getByRole('combobox', {name: 'Consultar estructura'})).toBeVisible();
});

test('archivo fallido conserva acceso textual y permite reintento', async ({ page }) => {
  await page.route('**/models/technical/*.glb*', route => route.abort()); await page.goto('/technical-demo'); await dismissOrientation(page);
  await expect(page.getByTestId('viewer-status')).toContainText('No se pudo abrir'); await choose(page, 'biceps');
  await expect(page.getByTestId('detail-panel').getByRole('heading', { name: 'Bíceps braquial', exact: true })).toBeVisible(); await page.getByRole('button', { name: 'Cerrar ficha' }).click();
  await page.unroute('**/models/technical/*.glb*'); await page.getByRole('button', { name: 'Reintentar visor' }).click(); await expect(page.getByTestId('viewer-status')).toHaveText('Visor listo');
});

test('pérdida WebGL ofrece recuperación y fichas accesibles', async ({ page }) => {
  await ready(page); await page.getByTestId('viewer-canvas').locator('canvas').evaluate(canvas => { const context = (canvas as HTMLCanvasElement).getContext('webgl2'); context?.getExtension('WEBGL_lose_context')?.loseContext(); });
  await expect(page.getByTestId('viewer-status')).toContainText('contexto perdido'); await choose(page, 'scapula');
  await expect(page.getByTestId('detail-panel').getByRole('heading', { name: 'Escápula', exact: true })).toBeVisible(); await page.getByRole('button', { name: 'Cerrar ficha' }).click();
  await page.getByRole('button', { name: 'Reintentar visor' }).click(); await expect(page.getByTestId('viewer-status')).toHaveText('Visor listo');
});
