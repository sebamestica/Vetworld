import { z } from 'zod';
import { ApiError } from '@/lib/errors/api-error';
import { errorSchema, paginationSchema } from './contracts';

export function paginate<T>(items: T[], page: number, limit: number) {
  return { items: items.slice((page - 1) * limit, page * limit), pagination: paginationSchema.parse({ page, limit, total: items.length, totalPages: Math.ceil(items.length / limit) }) };
}

export function parseQuery<T extends z.ZodType>(url: string, schema: T): z.output<T> {
  const params = new URL(url).searchParams;
  const values: Record<string, string> = Object.create(null);
  for (const [key, value] of params) {
    if (Object.hasOwn(values, key)) throw new ApiError(400, 'VALIDATION_ERROR', `Parámetro repetido: ${key.slice(0, 40)}`);
    // Reject malformed percent encodings; URLSearchParams otherwise silently substitutes U+FFFD.
    if (key.includes('\uFFFD') || value.includes('\uFFFD')) throw new ApiError(400, 'VALIDATION_ERROR', 'Codificación inválida de parámetros');
    values[key] = value;
  }
  if (/%(?![0-9a-f]{2})/i.test(new URL(url).search)) throw new ApiError(400, 'VALIDATION_ERROR', 'Codificación inválida de parámetros');
  const parsed = schema.safeParse(values);
  if (!parsed.success) throw new ApiError(400, 'VALIDATION_ERROR', 'Parámetros inválidos o no admitidos');
  return parsed.data;
}

export function errorResponse(error: unknown): Response {
  const safe = error instanceof ApiError ? error : new ApiError(500, 'INTERNAL_ERROR', 'No se pudo procesar la consulta');
  return Response.json(errorSchema.parse({ error: { code: safe.code, message: safe.message } }), {
    status: safe.status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  });
}

export function methodNotAllowed() {
  const response = errorResponse(new ApiError(405, 'METHOD_NOT_ALLOWED', 'La API es de solo lectura'));
  response.headers.set('Allow', 'GET, HEAD, OPTIONS');
  return response;
}

export function options() { return new Response(null, { status: 204, headers: { Allow: 'GET, HEAD, OPTIONS', 'Cache-Control': 'no-store' } }); }
