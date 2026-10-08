type RGB = [number, number, number];
const rgb = (s: string): RGB => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)) as RGB;
const hex = (c: RGB) => '#' + c.map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');
const mix = (a: RGB, b: RGB, p: number): RGB => a.map((n, i) => n * (1 - p) + b[i] * p) as RGB;
const lum = (c: RGB) => c.map(v => { const x = v / 255; return x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }).reduce((n, v, i) => n + v * [.2126, .7152, .0722][i], 0);
export function contrastRatio(a: string, b: string): number {
  const [x, y] = [lum(rgb(a)), lum(rgb(b))].sort((a, b) => b - a);
  return (x + .05) / (y + .05);
}
function readable(candidate: string, backgrounds: string[], light: boolean): string {
  const target: RGB = light ? [15, 19, 24] : [250, 251, 252];
  for (let p = 0; p <= 1; p += .02) {
    const color = hex(mix(rgb(candidate), target, Math.min(1, p)));
    if (backgrounds.every(bg => contrastRatio(color, bg) >= 4.5)) return color;
  }
  return hex(target);
}
/** Paleta del boceto v2; los textos secundarios conservan contraste legible. */
export function themeColors(input: string): { variables: Record<string, string>; stageColor: string; exposure: number } {
  const color = rgb(/^#[\da-f]{6}$/i.test(input) ? input : '#29303A');
  const light = lum(color) > .47, black: RGB = [15, 19, 24], white: RGB = [250, 251, 252];
  const bg = light ? mix(color, [225, 228, 231], .72) : mix(color, black, .64);
  const top = light ? mix(color, white, .87) : mix(color, [32, 36, 43], .70);
  const surface = light ? mix(color, white, .73) : mix(color, [74, 80, 88], .78);
  const panel = light ? mix(color, white, .89) : mix(color, [42, 47, 56], .79);
  let stage = mix(color, [18, 22, 28], .84);
  if (lum(stage) > .16) stage = mix(stage, black, .55);
  const hover = light ? mix(surface, black, .09) : mix(surface, white, .10);
  const backgrounds = [bg, top, surface, panel, hover].map(hex);
  const accent = hex(light ? mix(color, [30, 37, 43], .72) : mix(color, [219, 243, 231], .83));
  const variables = {
    '--bg': hex(bg), '--top': hex(top), '--stage': hex(stage),
    '--panel': `rgba(${panel.map(Math.round).join(',')},${light ? '.91' : '.90'})`,
    '--surface': hex(surface), '--surface-hover': hex(hover),
    '--text': readable(light ? '#1c2229' : '#f5f6f7', backgrounds, light),
    '--muted': readable(light ? '#545d67' : '#b9bec6', backgrounds, light),
    '--subtle': readable(light ? '#69717c' : '#929ba5', backgrounds, light),
    '--accent': accent, '--accent-ink': readable(light ? '#ffffff' : '#152621', [accent], !light),
    '--accent-soft': light ? 'rgba(18,32,34,.09)' : 'rgba(207,238,223,.105)',
    '--line': light ? 'rgba(15,23,32,.095)' : 'rgba(255,255,255,.09)',
    '--edge': light ? 'rgba(15,23,32,.15)' : 'rgba(255,255,255,.15)',
    '--shadow': light ? '0 18px 50px rgba(0,0,0,.16)' : '0 20px 60px rgba(0,0,0,.32)', '--fontScale': '1',
  };
  return { variables, stageColor: hex(stage), exposure: 1.15 };
}
