/** Normalize Spanish/Latin search text without modifying scientific records. */
export function normalizeTerm(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('es').trim().replace(/\s+/g, ' ');
}

export function scoreTerm(query: string, terms: readonly string[]): number {
  const normalized = normalizeTerm(query);
  if (!normalized) return 0;
  return Math.max(0, ...terms.map(term => {
    const candidate = normalizeTerm(term);
    return candidate === normalized ? 300 : candidate.startsWith(normalized) ? 200 : candidate.includes(normalized) ? 100 : 0;
  }));
}
