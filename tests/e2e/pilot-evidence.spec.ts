import { test, expect } from '@playwright/test';

test('ficha felina nueva muestra evidencia sin simular geometría admitida', async ({page}) => {
  await page.goto('/');
  await expect(page.getByTestId('viewer-status')).toHaveText('Visor listo');
  const portrait=page.getByRole('button',{name:'Continuar en vertical'});
  if(await portrait.isVisible()) await portrait.click();
  const search=page.getByRole('combobox',{name:'Buscar estructuras anatómicas'});
  await search.fill('femur');
  await page.getByRole('group',{name:'Felino',exact:true}).getByRole('option').click();
  const panel=page.getByTestId('detail-panel');
  await expect(panel.getByRole('heading',{name:'Fémur',exact:true})).toBeVisible();
  await expect(panel.getByText('Os femoris',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Aislar',exact:true})).toBeDisabled();
  await panel.getByRole('tab',{name:'Fuentes',exact:true}).click();
  await expect(panel.getByTestId('field-evidence')).toContainText('Evidencia por campo');
  await expect(panel.getByTestId('field-evidence')).toContainText('pp.79–80');
  await expect(panel.getByRole('link',{name:/Anatomy of the Cat/})).toHaveAttribute('href','https://www.gutenberg.org/cache/epub/58394/pg58394-images.html');
  await page.screenshot({path:`workbench/segmentation/feline/pilot/panel-${test.info().project.name}.png`});
});
