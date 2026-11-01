import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import report from '../../data/osteology/diagnostics/canine.json';
import reference from '../../data/osteology/reference/canine.json';
import { canineAdmissionStates, canineDiagnosticsSchema } from '../../scripts/osteology/canine-diagnostics-schema';

const receiptSha256: Record<string, string> = {
  skull: '7a2d498293ed84dce2e039cf239b11fbe0f406ba1a69fc3bf0a3c80922c529d2',
  'vertebral-column': 'a4b9d4e7503651e7c3bbb79b65e157cbd6633c7d982ad32c3a7b2d140e654f48',
  'thoracic-limb': '14f3ba51632f405159d754a8f5c21c1eb22beacfc34835e69a7a9d1641ae2498',
  'pelvic-limb': '6ba7a11ae2874af14972bb2fd4b4ba37de92631fb3ac01bda42958350294fe99',
};

describe('Diagnóstico canino privado (3DExport 285869)', () => {
  const parsed = canineDiagnosticsSchema.parse(report);

  it('valida con Zod y conserva los hashes del recibo', () => {
    expect(parsed.pieces.map(piece => [piece.pieceId, piece.sourceSha256])).toEqual(Object.entries(receiptSha256));
    expect(parsed.totals.triangles).toBe(179813);
    expect(parsed.geometryModified).toBe(false);
  });

  it('mantiene unidades desconocidas, sin registro ni transformaciones', () => {
    expect(parsed.pieces.every(piece => piece.units === 'unknown')).toBe(true);
    expect(parsed.registration.status).toBe('not_registered');
    expect(parsed.registration.transformsApplied).toHaveLength(0);
  });

  it('cubre cada componente con una sola propuesta, lado desconocido y revisión pendiente', () => {
    for (const piece of parsed.pieces) {
      const ranks = parsed.identificationProposals.filter(p => p.pieceId === piece.pieceId).flatMap(p => p.componentRanks);
      expect([...ranks].sort((a, b) => a - b)).toEqual(piece.componentsTolerance0.map(component => component.rank));
    }
    expect(parsed.identificationProposals.every(p => p.side === 'unknown' && p.reviewStatus === 'pending')).toBe(true);
    expect(canineAdmissionStates).not.toContain('reviewed');
  });

  it('solo enlaza IDs existentes del inventario canino de referencia', () => {
    const known = new Set(reference.structures.map(entry => entry.id));
    const missing = parsed.identificationProposals.flatMap(p => p.candidateReferenceIds).filter(value => !known.has(value));
    expect(missing).toEqual([]);
  });

  it('rechaza unidades, lado, revisión o transformaciones no acreditados', () => {
    const variants: ((copy: typeof report) => void)[] = [
      copy => { (copy.pieces[0] as { units: string }).units = 'mm'; },
      copy => { (copy.identificationProposals[0] as { side: string }).side = 'left'; },
      copy => { (copy.identificationProposals[0] as { reviewStatus: string }).reviewStatus = 'reviewed'; },
      copy => { (copy.identificationProposals[0] as { admissionState: string }).admissionState = 'reviewed'; },
      copy => { (copy.registration.transformsApplied as unknown[]).push({ translate: [0, 0, 0] }); },
      copy => { (copy.privacy as { webAvailable: boolean }).webAvailable = true; },
      copy => { copy.identificationProposals[0].candidateReferenceIds = ['feline:reference:head:midline:skull']; },
      copy => { copy.identificationProposals[1].componentRanks = [0]; },
      copy => { copy.pieces[0].componentsTolerance0[0].faceCount += 1; },
      copy => { copy.identificationProposals[0].evidence[0].path = 'public/skull.png'; },
    ];
    for (const mutate of variants) {
      const copy = structuredClone(report);
      mutate(copy);
      expect(canineDiagnosticsSchema.safeParse(copy).success).toBe(false);
    }
  });

  it('no publica derivados caninos en public/', () => {
    const files = readdirSync('public', { recursive: true, encoding: 'utf8' }).map(file => join('public', file).toLowerCase());
    expect(files.filter(file => /dog_skeleton|3dexport|canine-private|canine_private/.test(file))).toEqual([]);
  });
});
