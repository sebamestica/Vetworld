/** Normalize Spanish/Latin search text without modifying scientific records. */
export function normalizeTerm(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('es').trim().replace(/\s+/g, ' ');
}

export function scoreTerm(query: string, terms: readonly string[]): number {
  const normalized = normalizeTerm(query);
  if (!normalized) return 0;
  return Math.max(0, ...terms.map(term => {
    const candidate = normalizeTerm(term);
    if (candidate === normalized) return 300;
    if (candidate.startsWith(normalized)) return 200;
    if (candidate.includes(normalized)) return 100;
    if (normalized.length < 4) return 0;
    const bound = normalized.length >= 6 ? 2 : 1;
    const distance = Math.min(...[candidate, ...candidate.split(' ')].map(word => boundedDistance(normalized, word, bound)));
    return distance <= bound ? 60 - distance * 10 : 0;
  }));
}

/** Banded Levenshtein: reject lengths and rows beyond the small typo budget. */
function boundedDistance(a: string, b: string, bound: number): number {
  if (Math.abs(a.length - b.length) > bound) return bound + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i <= bound ? i : bound + 1);
  for (let i = 1; i <= a.length; i++) {
    const row = new Array<number>(b.length + 1).fill(bound + 1);
    row[0] = i <= bound ? i : bound + 1;
    let minimum = row[0];
    for (let j = Math.max(1, i - bound); j <= Math.min(b.length, i + bound); j++) {
      row[j] = Math.min(previous[j] + 1, row[j - 1] + 1, previous[j - 1] + Number(a[i - 1] !== b[j - 1]));
      minimum = Math.min(minimum, row[j]);
    }
    if (minimum > bound) return bound + 1;
    previous = row;
  }
  return previous[b.length];
}
