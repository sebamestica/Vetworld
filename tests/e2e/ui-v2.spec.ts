import { test, expect, type Page } from '@playwright/test';

async function ready(page: Page) {
  await page.goto('/technical-demo'); await expect(page.getByTestId('viewer-status')).toHaveText('Visor listo');
  const portrait = page.getByRole('button', { name: 'Continuar en vertical' }); if (await portrait.isVisible()) await portrait.click();
}
async function settings(page: Page) { const portrait = page.getByRole('button', { name: 'Continuar en vertical' }); if (await portrait.isVisible()) await portrait.click(); await page.getByRole('button', { name: 'Abrir herramientas' }).click(); await page.getByRole('tab', { name: 'Ajustes', exact: true }).click(); }

test('menú inicialmente cerrado, capas reales y navegación por teclado', async ({ page }) => {
  await ready(page); await expect(page.getByRole('complementary', { name: 'Herramientas' })).toHaveCount(0);
  const trigger = page.getByRole('button', { name: 'Abrir herramientas' }); await trigger.click();
  const tools = page.getByRole('complementary', { name: 'Herramientas' }); await expect(tools).toBeVisible();
  await expect(tools.getByRole('checkbox')).toHaveCount(8);
  for (const name of ['Huesos', 'Músculos', 'Nervios', 'Tendones']) await expect(tools.getByRole('checkbox', { name, exact: true })).toBeEnabled();
  for (const name of ['Piel', 'Ligamentos', 'Vasos', 'Órganos']) await expect(tools.getByRole('checkbox', { name, exact: true })).toBeDisabled();
  const layers = tools.getByRole('tab', { name: 'Capas', exact: true }); await layers.focus(); await layers.press('ArrowRight');
  await expect(tools.getByRole('tab', { name: 'Vistas', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('Escape'); await expect(tools).toHaveCount(0); await expect(trigger).toBeFocused();
});

test('búsqueda global aproximada cambia especie con fichas reales y no inventa masetero', async ({ page }) => {
  await ready(page); const search = page.getByRole('combobox', { name: 'Buscar estructuras anatómicas' }); await search.fill('scapulla');
  const list = page.getByRole('listbox', { name: 'Resultados de búsqueda' }); await expect(list.getByRole('option')).toHaveCount(2);
  await expect(list.getByRole('group', { name: 'Canino', exact: true })).toBeVisible(); await expect(list.getByRole('group', { name: 'Felino', exact: true })).toBeVisible();
  await search.press('ArrowDown'); await search.press('ArrowDown'); await search.press('Enter');
  await expect(page.getByLabel('Especie', { exact: true })).toHaveValue('feline');
  await expect(page.getByTestId('detail-panel').getByRole('heading', { name: 'Escápula', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar ficha' }).click(); await search.fill('masetero'); await expect(page.getByText('No hay estructuras coincidentes en el catálogo.')).toBeVisible();
  await search.press('Escape'); await expect(search).toHaveAttribute('aria-expanded', 'false');
});

test('color, tamaño y calidad persisten; idioma traduce controles y conserva anatomía', async ({ page }) => {
  await ready(page); await settings(page);
  const hex = page.getByRole('textbox', { name: 'Código hexadecimal del tema' }); await hex.fill('#ZZZZZZ'); await expect(hex).toHaveAttribute('aria-invalid', 'true');
  await hex.fill('#355C48'); await page.getByRole('combobox', { name: 'Tamaño de letra', exact: true }).selectOption('1.15');
  await page.getByRole('button', { name: 'Baja', exact: true }).click();
  await expect(page.locator('[data-quality="low"]').first()).toHaveAttribute('data-quality', 'low');
  await expect(page.locator('[data-dpr]').first()).toHaveAttribute('data-dpr', '1');
  const exposure = await page.locator('[data-exposure]').first().getAttribute('data-exposure'); expect(Number(exposure)).toBeGreaterThan(0);
  await page.reload(); await expect(page.getByTestId('viewer-status')).toHaveText('Visor listo'); await settings(page);
  await expect(page.getByRole('textbox', { name: 'Código hexadecimal del tema' })).toHaveValue('#355C48');
  await expect(page.getByRole('combobox', { name: 'Tamaño de letra', exact: true })).toHaveValue('1.15'); await expect(page.getByRole('button', { name: 'Baja', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('combobox', { name: 'Idioma', exact: true }).selectOption('en'); await expect(page.getByRole('tab', { name: 'Settings', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close tools' }).click(); const search = page.getByRole('combobox', { name: 'Search anatomical structures' }); await search.fill('biceps');
  await expect(page.getByRole('listbox', { name: 'Search results' }).getByRole('option').first()).toBeVisible(); await search.press('ArrowDown'); await search.press('Enter');
  await expect(page.getByTestId('detail-panel').getByRole('heading', { name: 'Bíceps braquial', exact: true })).toBeVisible();
  await expect(page.getByTestId('detail-panel').getByText('Musculus biceps brachii', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close record' }).click(); await page.getByRole('button', { name: 'Open tools' }).click(); await page.getByRole('tab', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: 'Reset appearance' }).click(); await expect(page.getByRole('tab', { name: 'Ajustes', exact: true })).toBeVisible();
});

test('vistas y cortes cambian geometría técnica, sin afirmar anatomía interna', async ({ page }) => {
  await ready(page); const canvas = page.getByTestId('viewer-canvas').locator('canvas'); const before = await canvas.screenshot();
  await page.getByRole('button', { name: 'Abrir herramientas' }).click(); await page.getByRole('tab', { name: 'Vistas', exact: true }).click();
  await page.getByRole('button', { name: 'Izquierda', exact: true }).click(); await page.getByRole('button', { name: 'Cerrar herramientas' }).click();
  await expect.poll(async () => before.equals(await canvas.screenshot())).toBe(false);
  await page.getByRole('button', { name: 'Abrir herramientas' }).click(); await page.getByRole('button', { name: 'Craneal', exact: true }).click(); await page.getByRole('button', { name: 'Cerrar herramientas' }).click(); const full = await canvas.screenshot();
  await page.getByRole('button', { name: 'Abrir herramientas' }).click(); await page.getByRole('button', { name: 'Sagital', exact: true }).click();
  await expect(page.getByRole('complementary', { name: 'Herramientas' }).getByText(/no representa anatomía interna/)).toBeVisible(); await page.getByRole('slider', { name: 'Posición del corte' }).fill('0.5');
  await page.getByRole('button', { name: 'Cerrar herramientas' }).click(); await expect.poll(async () => full.equals(await canvas.screenshot())).toBe(false);
  await page.getByRole('button', { name: 'Restaurar', exact: true }).click();
});

test('voz sin soporte mantiene búsqueda escrita y orientación es recomendación', async ({ page }, info) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'SpeechRecognition', { value: undefined }); Object.defineProperty(window, 'webkitSpeechRecognition', { value: undefined }); });
  await page.goto('/technical-demo'); await expect(page.getByTestId('viewer-status')).toHaveText('Visor listo');
  const portrait = page.getByRole('button', { name: 'Continuar en vertical' }); if (info.project.name === 'mobile') await expect(portrait).toBeVisible(); if (await portrait.isVisible()) await portrait.click();
  await page.getByRole('button', { name: 'Buscar por voz' }).click(); await expect(page.getByText(/puede enviar audio/)).toBeVisible(); await page.getByRole('button', { name: 'Iniciar escucha' }).click();
  await expect(page.getByText(/La búsqueda por voz no está disponible/)).toBeVisible(); const search = page.getByRole('combobox', { name: 'Buscar estructuras anatómicas' }); await search.fill('biceps');
  const list = page.getByRole('listbox', { name: 'Resultados de búsqueda' });
  await expect(list.getByRole('option')).toHaveCount(8);
  await expect(list.getByRole('group', { name: 'Canino', exact: true }).getByRole('option', { name: /^Bíceps braquial/ })).toBeVisible();
  await expect(list.getByRole('group', { name: 'Felino', exact: true }).getByRole('option', { name: /^Bíceps braquial/ })).toBeVisible();
  await search.press('ArrowDown'); await search.press('Enter');
  await expect(page.getByTestId('detail-panel').getByRole('heading', { name: 'Bíceps braquial', exact: true })).toBeVisible();
});
