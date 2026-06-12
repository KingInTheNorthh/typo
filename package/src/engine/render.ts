import type { GamePalette } from '../config/palettes';
import { POWERUP_DEFS } from '../config/powerups';
import type { ShipSkin } from '../types';
import type { Enemy } from './entities';
import { colorWithAlpha, drawGlow } from './sprites';

/* ── Player ship ──────────────────────────────────────────────────────── */

export function drawShip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  skin: ShipSkin,
  time: number,
  muzzle: number,
  shieldCharges: number,
  shieldColor: string,
): void {
  // Engine exhaust — flickering additive glow trailing behind
  const flicker = 0.7 + 0.3 * Math.sin(time * 31) * Math.sin(time * 17);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  drawGlow(ctx, x, y + 18, 16 + flicker * 7, skin.engineColor, 0.8);
  drawGlow(ctx, x, y + 27, 8 + flicker * 5, '#ffffff', 0.35);
  ctx.restore();

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle * 0.35); // lean toward the target, subtly

  // Hull — sharp dart with swept wings
  ctx.beginPath();
  ctx.moveTo(0, -22);
  ctx.lineTo(7, -2);
  ctx.lineTo(20, 12);
  ctx.lineTo(13, 14);
  ctx.lineTo(5, 8);
  ctx.lineTo(0, 11);
  ctx.lineTo(-5, 8);
  ctx.lineTo(-13, 14);
  ctx.lineTo(-20, 12);
  ctx.lineTo(-7, -2);
  ctx.closePath();
  ctx.fillStyle = 'rgba(10, 12, 30, 0.92)';
  ctx.fill();
  ctx.strokeStyle = skin.trimColor;
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Cockpit slit
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(2.5, -4);
  ctx.lineTo(-2.5, -4);
  ctx.closePath();
  ctx.fillStyle = skin.hullColor;
  ctx.fill();

  ctx.restore();

  // Muzzle flash on recent shots
  if (muzzle > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, x + Math.sin(angle) * 8, y - 22, 10 + muzzle * 14, skin.trimColor, muzzle);
    ctx.restore();
  }

  // Shield bubble
  if (shieldCharges > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const pulse = 0.75 + 0.25 * Math.sin(time * 4);
    ctx.strokeStyle = colorWithAlpha(shieldColor, 0.35 * pulse + 0.12 * shieldCharges);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y - 2, 34, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

/* ── Enemies ──────────────────────────────────────────────────────────── */

/**
 * Each archetype gets a distinct silhouette so players can read threat
 * at a glance, before the word even registers.
 */
export function drawEnemy(
  ctx: CanvasRenderingContext2D,
  e: Enemy,
  palette: GamePalette,
  isTarget: boolean,
): void {
  const color = e.power
    ? POWERUP_DEFS[e.power].color
    : isTarget
      ? palette.target
      : palette.hostile;
  const s = e.size;
  const y = e.y + e.knock;

  // Under-glow so ships feel lit
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  drawGlow(ctx, e.x, y, s * 1.7, color, e.doomed ? 0.6 : isTarget ? 0.4 : 0.22);
  ctx.restore();

  ctx.save();
  ctx.translate(e.x, y);
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = e.flash > 0 ? '#ffffff' : color;
  ctx.fillStyle = 'rgba(8, 9, 24, 0.9)';

  switch (e.kind) {
    case 'scout': // small downward dart
      poly(ctx, [0, s, s * 0.8, -s * 0.7, 0, -s * 0.25, -s * 0.8, -s * 0.7]);
      break;
    case 'frigate': // wide chevron with wing tips
      poly(ctx, [0, s * 0.9, s, -s * 0.2, s * 0.55, -s * 0.75, 0, -s * 0.35, -s * 0.55, -s * 0.75, -s, -s * 0.2]);
      break;
    case 'tank': // heavy hexagonal bulk
      poly(ctx, [0, s, s * 0.9, s * 0.4, s * 0.9, -s * 0.5, 0, -s, -s * 0.9, -s * 0.5, -s * 0.9, s * 0.4]);
      ctx.strokeRect(-s * 0.4, -s * 0.35, s * 0.8, s * 0.7);
      break;
    case 'splitter': // twin-lobed diamond, visibly "two halves"
      poly(ctx, [0, s, s * 0.9, 0, 0, -s * 0.9, -s * 0.9, 0]);
      ctx.beginPath();
      ctx.moveTo(0, s);
      ctx.lineTo(0, -s * 0.9);
      ctx.stroke();
      break;
    case 'sniper': // tall narrow frame with a barrel aimed down
      poly(ctx, [0, s * 1.2, s * 0.55, 0, s * 0.55, -s * 0.8, -s * 0.55, -s * 0.8, -s * 0.55, 0]);
      ctx.beginPath();
      ctx.moveTo(0, s * 1.2);
      ctx.lineTo(0, s * 1.7);
      ctx.stroke();
      break;
    case 'boss': // layered crown dreadnought
      poly(ctx, [0, s, s * 0.5, s * 0.55, s, s * 0.1, s * 0.75, -s * 0.6, s * 0.3, -s * 0.35, 0, -s * 0.8, -s * 0.3, -s * 0.35, -s * 0.75, -s * 0.6, -s, s * 0.1, -s * 0.5, s * 0.55]);
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'missile': // slim dart with hot tail
      poly(ctx, [0, s * 1.4, s * 0.5, -s, -s * 0.5, -s]);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, 0, -s * 1.4, s, '#ffc857', 0.7);
      ctx.restore();
      break;
    case 'pod': {
      // Friendly capsule: ring + power glyph
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, s + 5, e.time, e.time + Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      if (e.power) {
        ctx.fillStyle = color;
        ctx.font = `700 ${s}px "IBM Plex Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(POWERUP_DEFS[e.power].icon, 0, 1);
      }
      break;
    }
  }
  ctx.restore();

  // White hit-flash core
  if (e.flash > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, e.x, y, s * 1.3, '#ffffff', e.flash * 0.8);
    ctx.restore();
  }
}

function poly(ctx: CanvasRenderingContext2D, pts: number[]): void {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/* ── Word labels ──────────────────────────────────────────────────────── */

export function drawWord(
  ctx: CanvasRenderingContext2D,
  e: Enemy,
  palette: GamePalette,
  isTarget: boolean,
  fontScale: number,
): void {
  const remaining = e.word.slice(e.typed);
  if (!remaining) return;

  const base = e.kind === 'boss' ? 19 : e.kind === 'missile' ? 12 : 15;
  const px = Math.round(base * fontScale);
  ctx.font = `600 ${px}px "IBM Plex Mono", monospace`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const padX = 7;
  const w = ctx.measureText(remaining).width;
  const h = px + 9;
  const cx = e.x;
  const top = e.y - e.size - h - 8;
  const left = cx - w / 2 - padX;

  const role = e.power ? POWERUP_DEFS[e.power].color : isTarget ? palette.target : palette.hostile;

  // Holographic plate behind the text
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(left, top, w + padX * 2, h, 4);
  ctx.fillStyle = isTarget ? 'rgba(6, 10, 26, 0.92)' : 'rgba(6, 8, 22, 0.72)';
  ctx.fill();
  ctx.strokeStyle = colorWithAlpha(role, isTarget ? 0.9 : 0.35);
  ctx.lineWidth = 1;
  ctx.stroke();

  // Remaining word: next letter in accent color, rest neutral
  const midY = top + h / 2 + 1;
  let penX = cx - w / 2;
  const nextCh = remaining[0];
  ctx.fillStyle = role;
  ctx.fillText(nextCh, penX, midY);
  const nextW = ctx.measureText(nextCh).width;
  if (isTarget) {
    // Caret under the next letter — the "you are here" of the word
    ctx.fillRect(penX, top + h - 2.5, nextW, 2);
  }
  penX += nextW;
  if (remaining.length > 1) {
    ctx.fillStyle = isTarget ? '#e8ecff' : '#9aa3c7';
    ctx.fillText(remaining.slice(1), penX, midY);
  }

  // Boss segment pips
  if (e.kind === 'boss' && e.segments.length > 0) {
    ctx.fillStyle = colorWithAlpha(role, 0.8);
    for (let i = 0; i < e.segments.length; i++) {
      ctx.fillRect(cx - e.segments.length * 5 + i * 10, top - 7, 6, 3);
    }
  }
  ctx.restore();
}
