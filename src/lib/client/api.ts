import { z } from 'zod';

export async function fetchApi<T extends z.ZodType>(path: string, schema: T, signal?: AbortSignal): Promise<z.output<T>> {
  if (!path.startsWith('/api/v1/') || path.includes('://')) throw new Error('Ruta de API no admitida');
  const response = await fetch(path, { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000), headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`La consulta no está disponible (${response.status})`);
  const result = schema.safeParse(await response.json());
  if (!result.success) throw new Error('La respuesta del catálogo no es válida');
  return result.data;
}
