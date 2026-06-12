import { colorWithAlpha } from './sprites';

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  twinklePhase: number;
  twinkleSpeed: number;
  hue: string;
}

const STAR_COLORS = ['#cfe6ff', '#ffffff', '#ffd9c2', '#c9f7ff', '#e6d8ff'];

/**
 * Three-layer parallax starfield plus a slowly drifting nebula painted once
 * onto an offscreen canvas (cheap to blit every frame).
 */
export class Starfield {
  private stars: Star[] = [];
  private nebula: HTMLCanvasElement | null = null;
  private w = 0;
  private h = 0;
  private drift = 0;
  private time = 0;

  resize(w: number, h: number): void {
    this.w = w;
    this.h = h;
    this.buildStars();
    this.buildNebula();
  }

  private buildStars(): void {
    const count = Math.min(260, Math.floor((this.w * this.h) / 6500));
    this.stars = [];
    for (let i = 0; i < count; i++) {
      const layer = Math.random();
      this.stars.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        size: layer < 0.6 ? 0.8 : layer < 0.9 ? 1.4 : 2.2,
        speed: layer < 0.6 ? 9 : layer < 0.9 ? 22 : 42,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.5 + Math.random() * 2,
        hue: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      });
    }
  }

  /** Paint big soft radial blobs at quarter resolution → upscaled = free blur. */
  private buildNebula(): void {
    const c = document.createElement('canvas');
    const scale = 0.22;
    c.width = Math.max(2, this.w * scale);
    c.height = Math.max(2, this.h * scale);
    const ctx = c.getContext('2d')!;
    const blobs: Array<[string, number]> = [
      ['#1b1040', 0.55],
      ['#0a2740', 0.5],
      ['#2a0f33', 0.45],
      ['#0e3038', 0.4],
      ['#241447', 0.5],
    ];
    for (const [color, alpha] of blobs) {
      const x = Math.random() * c.width;
      const y = Math.random() * c.height * 0.8;
      const r = (0.35 + Math.random() * 0.45) * c.width;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, colorWithAlpha(color, alpha));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, c.width, c.height);
    }
    this.nebula = c;
  }

  update(dt: number, speedScale = 1): void {
    this.time += dt;
    this.drift = (this.drift + dt * 1.2) % (this.h || 1);
    for (const s of this.stars) {
      s.y += s.speed * speedScale * dt;
      if (s.y > this.h + 4) {
        s.y = -4;
        s.x = Math.random() * this.w;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // Deep-space base gradient
    const bg = ctx.createLinearGradient(0, 0, 0, this.h);
    bg.addColorStop(0, '#05050f');
    bg.addColorStop(0.55, '#080819');
    bg.addColorStop(1, '#0c0a22');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.w, this.h);

    if (this.nebula) {
      ctx.save();
      ctx.globalAlpha = 0.9;
      // Two copies scrolling vertically for a slow, seamless drift
      ctx.drawImage(this.nebula, 0, this.drift - this.h, this.w, this.h);
      ctx.drawImage(this.nebula, 0, this.drift, this.w, this.h);
      ctx.restore();
    }

    for (const s of this.stars) {
      const tw = 0.55 + 0.45 * Math.sin(this.time * s.twinkleSpeed + s.twinklePhase);
      ctx.globalAlpha = tw * (s.size > 1.8 ? 0.95 : 0.7);
      ctx.fillStyle = s.hue;
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.globalAlpha = 1;
  }
}
