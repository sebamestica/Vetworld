import { test, expect, type Page } from '@playwright/test';

async function ready(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('viewer-status')).toHaveText('Visor listo');
  await expect(page.getByTestId('viewer-canvas').locator('canvas')).toBeVisible();
}

test('recorrido real Canvas → ficha → referencias → visor', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  const calls: string[] = [];
  page.on('request', req => { if (req.url().includes('/api/v1/')) calls.push(req.url()); });
  const started = Date.now();
  await ready(page);
  await page.getByRole('button', { name: /Perro Canis/ }).click();
  await page.getByLabel('Región anatómica', { exact: true }).selectOption('thoracic-limb');
  const canvas = page.getByTestId('viewer-canvas').locator('canvas');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  const unselectedCanvas = await canvas.screenshot();
  // Initial perspective: sphere centre(-1.25,.9), camera distance ~6.85 and fov40.
  const scale = box!.height / (2 * Math.tan(40 * Math.PI / 360) * 6.85);
  const position = { x: box!.width / 2 - 1.25 * scale, y: box!.height / 2 - .9 * scale };
  if (info.project.name === 'desktop') await canvas.click({ position });
  else await canvas.tap({ position });
  const panel = page.getByTestId('detail-panel');
  await expect(panel.getByRole('heading', { name: 'Escápula', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Esfera', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(panel.getByRole('heading', { name: 'Revisión humana pendiente' })).toBeVisible();
  const gallery = panel.getByRole('region', { name: 'Referencias anatómicas reales' });
  await expect(gallery.getByRole('heading', { name: 'Referencias anatómicas reales' })).toBeVisible();
  const source = gallery.getByRole('link', { name: /Consultar fuente académica/ }).first();
  await expect(source).toHaveAttribute('href', /^https:\/\/open\.lib\.umn\.edu\//);
  await expect(source).toHaveAttribute('rel', /noreferrer/);
  expect(calls.some(url => url.includes('/structures/canine%3Ascapula'))).toBe(true);
  expect(calls.some(url => url.includes('/references?structure='))).toBe(true);
  await page.screenshot({ path: `docs/phase2/screenshots/${info.project.name}-selected.png`, fullPage: true });
  await source.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `docs/phase2/screenshots/${info.project.name}-references.png`, fullPage: true });
  await panel.getByRole('button', { name: 'Cerrar ficha' }).click();
  await expect(canvas).toBeVisible();
  expect(unselectedCanvas.equals(await canvas.screenshot())).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `docs/phase2/screenshots/${info.project.name}-atlas.png`, fullPage: true });
  expect(errors).toEqual([]);
  await info.attach('recorrido', { body: JSON.stringify({ elapsedMs: Date.now() - started, viewport: info.project.name, apiRequests: calls.length, renderer: 'Chromium WebGL software SwiftShader', geometry: 'synthetic technical fixture' }), contentType: 'application/json' });
});

test('cámara cambia al girar y acercar; CSP y red permanecen locales', async ({ page }, info) => {
  const response = await page.goto('/');
  const csp = response!.headers()['content-security-policy'];
  expect(csp).toContain("script-src 'self' 'nonce-");
  expect(csp).not.toContain('unsafe-eval');
  expect(csp).toContain("connect-src 'self';");
  await expect(page.getByTestId('viewer-status')).toHaveText('Visor listo');
  const canvas = page.getByTestId('viewer-canvas').locator('canvas');
  const before = await canvas.screenshot();
  const box = (await canvas.boundingBox())!;
  const x = box.x + box.width * .5, y = box.y + box.height * .5;
  if (info.project.name === 'desktop') {
    await page.mouse.move(x, y); await page.mouse.down();
    await page.mouse.move(x + 60, y + 20, { steps: 10 }); await page.mouse.up();
    await page.mouse.wheel(0, -200);
  } else {
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 40, y: y + 15, id: 1 }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x - 30, y, id: 1 }, { x: x + 30, y, id: 2 }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 60, y: y + 15, id: 1 }, { x: x + 60, y: y + 15, id: 2 }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await session.detach();
  }
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const after = await canvas.screenshot();
  expect(before.equals(after)).toBe(false);
});

test('galería amplía una imagen sintética controlada y gestiona archivo ausente', async ({ page }) => {
  const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lWQAAAAASUVORK5CYII=', 'base64');
  let missing = false;
  await page.route('**/api/v1/references?structure=*', async route => {
    const original = await route.fetch(); const body = await original.json();
    const reference = body.data[0];
    const image = missing ? '/reference-images/e2e-missing.png' : '/reference-images/e2e-test.png';
    body.data = [{ ...reference, authors: ['Fixture de prueba'], title: 'Ilustración sintética de prueba', kind: 'illustration', displayMode: 'internal', imagePath: image, thumbnailPath: image, license: { label: 'Fixture sintética propia, solo pruebas', verified: true, redistributionAllowed: true } }];
    await route.fulfill({ json: body });
  });
  await page.route('**/reference-images/e2e-test.png', route => route.fulfill({ body: pixel, contentType: 'image/png' }));
  await ready(page);
  await page.getByRole('button', { name: 'Esfera', exact: true }).click();
  const thumb = page.getByRole('button', { name: 'Ampliar Ilustración sintética de prueba' });
  await thumb.click();
  await expect(page.getByRole('dialog', { name: 'Ilustración sintética de prueba' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByTestId('detail-panel').getByRole('button', { name: 'Cerrar ficha' }).click();
  missing = true;
  await page.route('**/reference-images/e2e-missing.png', route => route.abort());
  await page.getByRole('button', { name: 'Esfera', exact: true }).click();
  await expect(page.getByText('Imagen no disponible. Consulte la fuente original.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ampliar Ilustración sintética de prueba' })).toHaveCount(0);
});

test('capas, aislamiento, transparencia y reset no mezclan selección', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: 'Cubo', exact: true }).click();
  await expect(page.getByTestId('detail-panel').getByRole('heading', { name: 'Bíceps braquial', exact: true })).toBeVisible();
  await page.getByTestId('detail-panel').getByRole('button', { name: 'Cerrar ficha' }).click();
  await page.getByRole('button', { name: 'Aislar selección' }).click();
  await expect(page.getByRole('button', { name: 'Esfera', exact: true })).toBeDisabled();
  const muscleLayer = page.getByRole('checkbox', { name: /Músculos|Músculo|muscular/i });
  await muscleLayer.uncheck();
  await expect(page.getByRole('button', { name: 'Cubo', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Restablecer vista' }).click();
  await expect(page.getByRole('button', { name: 'Cubo', exact: true })).toBeEnabled();
  await page.getByRole('slider').first().fill('0.5');
  await page.getByRole('button', { name: 'Restablecer vista' }).click();
  await expect(page.getByRole('slider').first()).toHaveValue('1');
});

test('cambio de especie y región limpia la ficha y muestra disponibilidad real', async ({ page }) => {
  await ready(page);
  await page.getByRole('button', { name: 'Cubo', exact: true }).click();
  await expect(page.getByTestId('detail-panel').getByText('Musculus biceps brachii', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Gato Felis/ }).click();
  await expect(page.getByTestId('detail-panel').getByText('Musculus biceps brachii', { exact: true })).toHaveCount(0);
  await expect(page.getByTestId('viewer-status')).toHaveText('Visor listo');
  await page.getByRole('button', { name: 'Cubo', exact: true }).click();
  await expect(page.getByTestId('detail-panel').getByText('Gato · Brazo · Músculo', { exact: true })).toBeVisible();
  await page.getByTestId('detail-panel').getByRole('button', { name: 'Cerrar ficha' }).click();
  await page.getByLabel('Región anatómica', { exact: true }).selectOption('head');
  await expect(page.getByTestId('viewer-status')).toHaveText('Modelo 3D no disponible');
  await expect(page.getByTestId('viewer-canvas').locator('canvas')).toHaveCount(0);
  await expect(page.getByText('Todavía no hay fichas registradas en esta región.')).toBeVisible();
});

test('archivo fallido conserva acceso textual y permite reintento', async ({ page }) => {
  await page.route('**/models/technical/*.glb*', route => route.abort());
  await page.goto('/');
  await expect(page.getByTestId('viewer-status')).toContainText('No se pudo abrir');
  await page.getByRole('button', { name: /Bíceps braquial Músculo/ }).click();
  await expect(page.getByTestId('detail-panel').getByRole('heading', { name: 'Bíceps braquial', exact: true })).toBeVisible();
  await page.getByTestId('detail-panel').getByRole('button', { name: 'Cerrar ficha' }).click();
  await page.unroute('**/models/technical/*.glb*');
  await page.getByRole('button', { name: 'Reintentar visor' }).click();
  await expect(page.getByTestId('viewer-status')).toHaveText('Visor listo');
});

test('pérdida WebGL ofrece recuperación y fichas accesibles', async ({ page }) => {
  await ready(page);
  await page.getByTestId('viewer-canvas').locator('canvas').evaluate(canvas => { const context = (canvas as HTMLCanvasElement).getContext('webgl2'); context?.getExtension('WEBGL_lose_context')?.loseContext(); });
  await expect(page.getByTestId('viewer-status')).toContainText('contexto perdido');
  await page.getByRole('button', { name: /Escápula Hueso/ }).click();
  await expect(page.getByTestId('detail-panel').getByRole('heading', { name: 'Escápula', exact: true })).toBeVisible();
  await page.getByTestId('detail-panel').getByRole('button', { name: 'Cerrar ficha' }).click();
  await page.getByRole('button', { name: 'Reintentar visor' }).click();
  await expect(page.getByTestId('viewer-status')).toHaveText('Visor listo');
});
