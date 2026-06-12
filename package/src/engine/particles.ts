import { drawGlow } from './sprites';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  drag: number;
  gravity: number;
  /** 'spark' = streak along velocity, 'dot' = additive glow blob */
  shape: 'spark' | 'dot';
}

interface Shockwave {
  x: number;
  y: number;
  r: number;
  maxR: number;
  life: number;
  maxLife: number;
  color: string;
  width: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

/**
 * One pooled system for all transient eye-candy: sparks, explosion debris,
 * expanding shockwave rings and floating score text. Everything additive.
 */
export class ParticleSystem {
  private particles: Particle[] = [];
  private waves: Shockwave[] = [];
  private texts: FloatingText[] = [];
  /** Reduced-motion mode halves counts and shortens lifetimes. */
  intensity = 1;

  clear(): void {
    this.particles.length = 0;
    this.waves.length = 0;
    this.texts.length = 0;
  }

  /** Quick spark burst — fired on every projectile impact. */
  hitSparks(x: number, y: number, color: string, count = 8): void {
    const n = Math.round(count * this.intensity);
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 240;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.18 + Math.random() * 0.25,
        size: 1 + Math.random() * 2,
        color,
        drag: 4,
        gravity: 0,
        shape: 'spark',
      });
    }
  }

  /** Full destruction effect: debris, embers, flash ring. */
  explosion(x: number, y: number, color: string, scale = 1): void {
    const n = Math.round((18 + scale * 14) * this.intensity);
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (40 + Math.random() * 300) * Math.sqrt(scale);
      const ember = Math.random() < 0.4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: ember ? 0.6 + Math.random() * 0.7 : 0.25 + Math.random() * 0.35,
        size: ember ? 2 + Math.random() * 3 * scale : 1 + Math.random() * 2,
        color: ember && Math.random() < 0.5 ? '#ffc857' : color,
        drag: ember ? 1.6 : 3,
        gravity: ember ? 60 : 0,
        shape: ember ? 'dot' : 'spark',
      });
    }
    this.shockwave(x, y, color, 36 + 50 * scale);
  }

  shockwave(x: number, y: number, color: string, maxR: number, width = 3): void {
    this.waves.push({ x, y, r: 4, maxR, life: 0, maxLife: 0.45, color, width });
  }

  /** Big EMP ring — slower and screen-scale. */
  empWave(x: number, y: number, color: string, maxR: number): void {
    this.waves.push({ x, y, r: 10, maxR, life: 0, maxLife: 0.7, color, width: 6 });
  }

  float(x: number, y: number, text: string, color: string, size = 15): void {
    this.texts.push({ x, y, text, color, life: 0, maxLife: 0.9, size });
  }

  update(dt: number): void {
    const ps = this.particles;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        ps[i] = ps[ps.length - 1];
        ps.pop();
        continue;
      }
      const damp = Math.max(0, 1 - p.drag * dt);
      p.vx *= damp;
      p.vy = p.vy * damp + p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const w = this.waves[i];
      w.life += dt;
      const t = w.life / w.maxLife;
      w.r = w.maxR * (1 - Math.pow(1 - Math.min(t, 1), 3)); // ease-out cubic
      if (w.life >= w.maxLife) this.waves.splice(i, 1);
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life += dt;
      t.y -= 38 * dt;
      if (t.life >= t.maxLife) this.texts.splice(i, 1);
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const p of this.particles) {
      const a = 1 - p.life / p.maxLife;
      if (p.shape === 'dot') {
        drawGlow(ctx, p.x, p.y, p.size * 3, p.color, a);
      } else {
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = a;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.025, p.y - p.vy * 0.025);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    for (const w of this.waves) {
      const a = 1 - w.life / w.maxLife;
      ctx.strokeStyle = w.color;
      ctx.globalAlpha = a * 0.9;
      ctx.lineWidth = w.width * a + 0.5;
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // Floating text on normal compositing for legibility
    ctx.save();
    ctx.textAlign = 'center';
    for (const t of this.texts) {
      const k = t.life / t.maxLife;
      ctx.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      ctx.font = `700 ${t.size}px "IBM Plex Mono", monospace`;
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.restore();
  }
}
