const academicHosts = new Set(['open.lib.umn.edu', 'www.cvmbs.colostate.edu', 'wava-amav.org', 'www.wava-amav.org', 'www.digimorph.org', 'www.morphosource.org']);

export function isSafeExternalUrl(value: string): boolean {
  if (!value.startsWith('https://') || /[\s\\]/.test(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && academicHosts.has(url.hostname);
  } catch { return false; }
}

export function safeLocalImagePath(value: string): boolean {
  return /^\/reference-images\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:png|jpe?g|webp)$/.test(value);
}
