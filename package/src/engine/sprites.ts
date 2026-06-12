/**
 * Pre-rendered radial glow sprites. Canvas shadowBlur is far too slow for
 * hundreds of particles per frame, so every glow in the game is one of these
 * cached offscreen canvases composited with 'lighter' (additive) blending —
 * that is what produces the bloom look at 60 fps.
 */

const cache = new Map<string, HTMLCanvasElement>();

export function glowSprite(color: string, radius = 32): HTMLCanvasElement {
  const key = `${color}:${radius}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const size = radius * 2;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
  g.addColorStop(0, color);
  g.addColorStop(0.25, colorWithAlpha(color, 0.6));
  g.addColorStop(0.6, colorWithAlpha(color, 0.16));
  g.addColorStop(1, colorWithAlpha(color, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  cache.set(key, c);
  return c;
}

/** Draw a cached glow centered at (x, y) scaled to `r`. Caller sets composite mode. */
export function drawGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  alpha = 1,
): void {
  const sprite = glowSprite(color);
  ctx.globalAlpha = alpha;
  ctx.drawImage(sprite, x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = 1;
}

/** Convert hex (#rrggbb) or pass-through color into an rgba() string with alpha. */
export function colorWithAlpha(color: string, alpha: number): string {
  if (color.startsWith('#') && color.length === 7) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return color;
}
