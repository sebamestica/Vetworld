import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import coverage from '../../data/osteology/feline-geometry-coverage.json';
import proposals from '../../data/osteology/proposals/feline/feline-surface-proposals-2026-10-31.json';
import { felineGeometryCoverageSchema } from '../../scripts/osteology/feline-geometry-coverage-schema';

const workbookIds = readFileSync('docs/phase3/feline-scientific-workbook.csv', 'utf8').replace(/^﻿/, '')
  .split(/\r?\n/).slice(1).filter(Boolean).map(line => line.split(',')[0].replace(/^"|"$/g, ''));
type Row = Record<string, unknown> & { candidateProposalIds: string[]; proposalId?: string | null; admissionStatus?: string; surfaceIntegrity?: string; referenceSide?: string; visibility?: string };
type Coverage = { rows: Row[]; remainderFaces: number } & Record<string, unknown>;
const clone = () => structuredClone(coverage) as unknown as Coverage;

describe('Matriz geométrica felina separada de la bibliográfica', () => {
  it('valida y cubre exactamente las 323 filas del workbook', () => {
    const data = felineGeometryCoverageSchema.parse(coverage);
    expect(workbookIds).toHaveLength(323);
    expect(data.rows.map(row => row.referenceId)).toEqual(workbookIds);
  });

  it('conserva la suma de caras del GLB fuente y coincide con las propuestas privadas', () => {
    const data = felineGeometryCoverageSchema.parse(coverage);
    expect(data.assignedFaces + data.remainderFaces).toBe(74235);
    expect(proposals.sumCheck).toBe(74235);
    expect(data.proposals.map(p => [p.proposalId, p.faceCount])).toEqual(proposals.proposals.map(p => [p.proposalId, p.faceCount]));
    expect(proposals.proposals.every(p => p.side === 'unknown' && p.reviewStatus === 'pending' && !p.publicAvailable)).toBe(true);
  });

  it('no admite huesos, escala ni lateralidad y no usa el estado revisado', () => {
    const data = felineGeometryCoverageSchema.parse(coverage);
    expect(data.anatomicallyAcceptedBones).toBe(0);
    expect(data.scale).toBe('unknown');
    expect(data.rows.some(row => row.referenceSide !== 'midline' && row.proposalId)).toBe(false);
    expect(JSON.stringify(data)).not.toMatch(/"revisado"|human-reviewed/);
    expect(data.rows.filter(row => row.admissionStatus === 'hueso_geometrico_suficiente')).toHaveLength(0);
  });

  it('rechaza estados inventados o incoherentes', () => {
    const reviewed = clone(); reviewed.rows[0].admissionStatus = 'revisado';
    expect(felineGeometryCoverageSchema.safeParse(reviewed).success).toBe(false);
    const sided = clone(); const lateral = sided.rows.find((row: Row) => row.candidateProposalIds.length && row.referenceSide === 'left')!;
    lateral.proposalId = lateral.candidateProposalIds[0]; lateral.candidateProposalIds = lateral.candidateProposalIds.slice(1);
    expect(felineGeometryCoverageSchema.safeParse(sided).success).toBe(false);
    const lost = clone(); lost.remainderFaces -= 1;
    expect(felineGeometryCoverageSchema.safeParse(lost).success).toBe(false);
    const ghost = clone(); ghost.rows[0].candidateProposalIds = ['inexistente'];
    expect(felineGeometryCoverageSchema.safeParse(ghost).success).toBe(false);
    const noSurface = clone(); const hidden = noSurface.rows.find((row: Row) => row.visibility === 'oculta')!;
    hidden.admissionStatus = 'superficie_identificada_parcial'; hidden.surfaceIntegrity = 'superficie_parcial';
    expect(felineGeometryCoverageSchema.safeParse(noSurface).success).toBe(false);
    const scaled = clone(); scaled.scale = 1;
    expect(felineGeometryCoverageSchema.safeParse(scaled).success).toBe(false);
  });

  it('distingue «no visible» de «ausente»: no hay filas no_representada sin evidencia', () => {
    const data = felineGeometryCoverageSchema.parse(coverage);
    for (const row of data.rows.filter(r => r.visibility === 'no_representada')) expect(row.evidence.length).toBeGreaterThan(0);
    expect(data.rows.filter(row => row.visibility === 'oculta').every(row => row.subregion === 'middle-ear')).toBe(true);
  });
});
