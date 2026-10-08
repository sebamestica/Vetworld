import { inject } from 'vitest';

export function api(path: string, init?: RequestInit): Promise<Response> {
  const base = inject('apiBaseUrl');
  if (!base) throw new Error('Falta globalSetup HTTP: tests/helpers/http-server.ts debe proveer apiBaseUrl');
  return fetch(`${base}/api/v1/${path}`, { ...init, signal: AbortSignal.timeout(15000) });
}
