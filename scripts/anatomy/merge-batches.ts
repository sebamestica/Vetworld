/**
 * Fusiona lotes de agentes (data/anatomy/_batches/*.json) en el catálogo central.
 *
 * Formato de lote:
 * { "batchId": "feline-L-F1", "speciesId": "feline", "author": "A3",
 *   "structures": [...], "relations": [...], "sources": [...] }
 *
 * Reglas: cada entrada del lote sustituye o agrega por id; la especie de una estructura
 * debe coincidir con la del lote y con el prefijo del id; review.status siempre "pending";
 * no se permiten ids duplicados dentro de un lote ni lotes que reclamen la misma estructura
 * o relación. Una fuente puede aparecer en varios lotes si sus campos coinciden (salvo
 * supportedStructureIds). Tras fusionar, supportedStructureIds se recalcula de forma
 * recíproca: estructuras existentes que citan la fuente en sourceIds.
 * El resultado se valida con catalogSchema antes de escribir. Uso:
 *   tsx scripts/anatomy/merge-batches.ts [--dry-run] [--batches <dir>] [--data <dir>]
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { catalogSchema } from '../../src/modules/anatomy/schemas/catalog';

type Entry = { id: string; [key: string]: unknown };
export interface Batch {
  batchId: string;
  speciesId: 'canine' | 'feline';
  author?: string;
  structures?: Entry[];
  relations?: Entry[];
  sources?: Entry[];
}
export interface MergeInput { structures: Entry[]; relations: Entry[]; sources: Entry[] }

const KEYS = ['structures', 'relations', 'sources'] as const;

export function mergeBatches(base: MergeInput, batches: Batch[]): { result: MergeInput; report: string[] } {
  const report: string[] = [];
  const claimed = new Map<string, string>();
  const result: MergeInput = { structures: [...base.structures], relations: [...base.relations], sources: [...base.sources] };
  for (const batch of [...batches].sort((a, b) => a.batchId.localeCompare(b.batchId))) {
    if (batch.speciesId !== 'canine' && batch.speciesId !== 'feline') throw new Error(`${batch.batchId}: speciesId inválido`);
    for (const key of KEYS) {
      const seen = new Set<string>();
      for (const entry of batch[key] ?? []) {
        if (!entry || typeof entry.id !== 'string' || !entry.id) throw new Error(`${batch.batchId}: entrada sin id en ${key}`);
        if (seen.has(entry.id)) throw new Error(`${batch.batchId}: id duplicado ${entry.id}`);
        seen.add(entry.id);
        const claimKey = `${key}:${entry.id}`;
        const owner = claimed.get(claimKey);
        if (owner && owner !== batch.batchId && key !== 'sources') throw new Error(`${entry.id} reclamado por ${owner} y ${batch.batchId}`);
        claimed.set(claimKey, batch.batchId);
        if (key === 'structures') {
          if (entry.speciesId !== batch.speciesId) throw new Error(`${entry.id}: especie distinta del lote ${batch.batchId}`);
          if (!entry.id.startsWith(`${batch.speciesId}:`)) throw new Error(`${entry.id}: prefijo de especie incorrecto`);
          const review = entry.review as { status?: unknown } | undefined;
          if (review?.status !== 'pending') throw new Error(`${entry.id}: review.status debe ser pending`);
        }
        if (key === 'relations') {
          for (const end of ['fromId', 'toId']) {
            const value = entry[end];
            if (typeof value === 'string' && !value.startsWith(`${batch.speciesId}:`)) throw new Error(`${entry.id}: ${end} mezcla especies`);
          }
        }
        const list = result[key];
        const index = list.findIndex((item) => item.id === entry.id);
        if (index >= 0) {
          if (key === 'structures' && list[index].speciesId !== entry.speciesId) throw new Error(`${entry.id}: cambio de especie`);
          if (key === 'sources' && owner && owner !== batch.batchId && sourceBody(list[index]) !== sourceBody(entry)) throw new Error(`${entry.id}: fuente modificada de forma distinta por ${owner} y ${batch.batchId}`);
          list[index] = entry;
          report.push(`${batch.batchId}: actualiza ${key} ${entry.id}`);
        } else {
          list.push(entry);
          report.push(`${batch.batchId}: agrega ${key} ${entry.id}`);
        }
      }
    }
  }
  const structureIds = new Set(result.structures.map((s) => s.id));
  result.sources = result.sources.map((source) => {
    if (!Array.isArray(source.supportedStructureIds)) return source;
    const citing = result.structures.filter((s) => Array.isArray(s.sourceIds) && (s.sourceIds as unknown[]).includes(source.id)).map((s) => s.id);
    const previous = (source.supportedStructureIds as string[]).filter((id) => structureIds.has(id) && citing.includes(id));
    const merged = [...previous, ...citing.filter((id) => !previous.includes(id))];
    return { ...source, supportedStructureIds: merged };
  });
  return { result, report };
}

function sourceBody(source: Entry): string {
  const { supportedStructureIds: _ignored, ...rest } = source;
  void _ignored;
  return JSON.stringify(rest);
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8').replace(/^﻿/, '')) as T;
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const opt = (name: string, fallback: string) => {
    const i = args.indexOf(name);
    return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
  };
  const dataDir = resolve(opt('--data', 'data/anatomy'));
  const batchDir = resolve(opt('--batches', join(dataDir, '_batches')));
  if (!existsSync(batchDir)) { console.log('Sin lotes.'); return; }
  const files = readdirSync(batchDir).filter((f) => f.endsWith('.json')).sort();
  const batches = files.map((f) => readJson<Batch>(join(batchDir, f)));
  const base: MergeInput = {
    structures: readJson(join(dataDir, 'structures.json')),
    relations: readJson(join(dataDir, 'relations.json')),
    sources: readJson(join(dataDir, 'sources.json')),
  };
  const { result, report } = mergeBatches(base, batches);
  const read = (name: string) => readJson<unknown>(join(dataDir, `${name}.json`));
  const metadata = read('metadata') as Record<string, unknown>;
  catalogSchema.parse({
    ...metadata,
    species: read('species'), regions: read('regions'), systems: read('systems'), layers: read('layers'), models: read('models'),
    ...result,
  });
  console.log(report.join('\n') || 'Lotes sin cambios.');
  console.log(`structures=${result.structures.length} relations=${result.relations.length} sources=${result.sources.length}`);
  if (dryRun) return;
  for (const key of KEYS) writeFileSync(join(dataDir, `${key}.json`), `${JSON.stringify(result[key], null, 2)}\n`, 'utf8');
}

if (process.argv[1] && /merge-batches\.ts$/.test(process.argv[1])) {
  try { main(); } catch (error) { console.error('Fusión rechazada:', error instanceof Error ? error.message : error); process.exitCode = 1; }
}
