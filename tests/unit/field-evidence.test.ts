import { describe, expect, it } from 'vitest';
import { catalogRepository } from '../../src/modules/anatomy/repositories/catalog-repository';
import { validateCatalog } from '../../src/modules/anatomy/validation/validate-catalog';
import { catalogService } from '../../src/modules/catalog/services/catalog-service';
import { isSafeExternalUrl } from '../../src/modules/media/safety';

describe('Fichas científicas independientes de la disponibilidad geométrica', () => {
  it.each(['feline:scapula','feline:humerus','feline:femur','feline:tibia'])('%s tiene evidencia por campo y revisión pendiente', id => {
    const structure = catalogService.structure(id);
    expect(structure.kind).toBe('bone');
    expect(structure.review.status).toBe('pending');
    expect(structure.completeness).toBe('partial');
    expect(structure.fieldEvidence?.length).toBeGreaterThan(5);
    expect(structure.origin).toBeUndefined();
    expect(structure.fieldEvidence?.every(entry => !entry.locator.includes('workbench/'))).toBe(true);
  });
  it('rechaza evidencia para campo vacío o fuente no asociada', () => {
    const catalog = catalogRepository.read();
    const row = catalog.structures.find(entry => entry.id === 'feline:femur')!;
    row.fieldEvidence!.push({field:'vascularSupply',sourceId:'missing-source',locator:'fixture sintética',claim:'NO CIENTÍFICO'});
    expect(validateCatalog(catalog).errors.some(error => error.includes('evidencia de campo ausente'))).toBe(true);
    expect(validateCatalog(catalog).errors.some(error => error.includes('evidencia de fuente no asociada'))).toBe(true);
  });
  it('busca huesos nuevos sin asignarles una malla ficticia', () => {
    expect(catalogService.search({q:'femur',species:'feline'}).some(entry => entry.structure.id === 'feline:femur')).toBe(true);
    expect(catalogService.structure('feline:femur').modelIds).toEqual([]);
    expect(catalogService.structure('feline:tibia').modelIds).toEqual([]);
  });
  it('permite bibliografía curada y bloquea orígenes parecidos o credenciales', () => {
    expect(isSafeExternalUrl('https://bdvets.org/JAVAR/V5I4/e292_pp410-419.pdf')).toBe(true);
    expect(isSafeExternalUrl('https://pmc.ncbi.nlm.nih.gov/articles/PMC11148912/')).toBe(true);
    expect(isSafeExternalUrl('https://bdvets.org.evil.example/image')).toBe(false);
    expect(isSafeExternalUrl('https://user:pass@bdvets.org/image')).toBe(false);
  });
});
