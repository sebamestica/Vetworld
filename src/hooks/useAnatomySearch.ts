'use client';

import { useEffect, useState } from 'react';
import { responseSchemas } from '@/lib/api/contracts';
import { fetchApi } from '@/lib/client/api';
import type { Structure } from '@/modules/anatomy/schemas/catalog';
import { normalizeTerm } from '@/modules/search/normalize';

export function useAnatomySearch(query: string) {
  const normalized = normalizeTerm(query);
  const [result, setResult] = useState<{ query: string; structures: Structure[]; status: 'loading' | 'ready' | 'error' }>({ query: '', structures: [], status: 'ready' });
  useEffect(() => {
    if (!normalized || !/[\p{L}\p{N}]/u.test(normalized)) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setResult({ query: normalized, structures: [], status: 'loading' });
      void fetchApi(`/api/v1/search?q=${encodeURIComponent(normalized)}&limit=12`, responseSchemas.search, controller.signal).then(response => {
        if (!controller.signal.aborted) setResult({ query: normalized, structures: response.data.map(hit => hit.structure), status: 'ready' });
      }).catch(() => {
        if (!controller.signal.aborted) setResult({ query: normalized, structures: [], status: 'error' });
      });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [normalized]);
  const searchable = !!normalized && /[\p{L}\p{N}]/u.test(normalized);
  return result.query === normalized && searchable ? result : { query: normalized, structures: [] as Structure[], status: searchable ? 'loading' as const : 'ready' as const };
}
