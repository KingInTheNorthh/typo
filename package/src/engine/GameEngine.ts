import { Audio } from '../audio/AudioEngine';
import { DIFFICULTY_PRESETS, type DifficultyPreset } from '../config/difficulty';
import { ENEMY_DEFS } from '../config/enemies';
import { PALETTES, type GamePalette } from '../config/palettes';
import { INVENTORY_SIZE, POWERUP_DEFS, POWERUP_ORDER } from '../config/powerups';
import { getSkin } from '../config/skins';
import { pickWord, clampTier } from '../config/words';
import { useGame } from '../state/gameStore';
import { useMeta } from '../state/metaStore';
import { useSettings } from '../state/settingsStore';
import type { GameMode, PowerUpType, RunStats } from '../types';
import type { Enemy, Projectile } from './entities';
import { ParticleSystem } from './particles';
import { drawEnemy, drawShip, drawWord } from './render';
import { dailySeed, mulberry32 } from './rng';
import { colorWithAlpha, drawGlow } from './sprites';
import { Starfield } from './starfield';
import { isBossWave, tierFor, WaveManager } from './waves';

const PROJECTILE_SPEED = 1500;
const LOCKOUT_SECONDS = 0.3;
const SYNC_INTERVAL = 0.09;

/**
 * The authoritative game simulation. Runs its own requestAnimationFrame loop
 * against a canvas, handles raw keyboard input, and pushes throttled HUD
 * snapshots into the Zustand store. React never touches the hot path.
 */
class GameEngineImpl {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private w = 0;
  private h = 0;

  private raf = 0;
  private last = 0;
  private running = false;
  paused = false;

  private mode: GameMode = 'standard';
  private diff: DifficultyPreset = DIFFICULTY_PRESETS.pilot;
  private rng: () => number = Math.random;
  private waveMgr!: WaveManager;

  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private particles = new ParticleSystem();
  private starfield = new Starfield();
  private delayed: Array<{ t: number; fn: () => void }> = [];
  private nextId = 1;
  private targetId: number | null = null;

  // Player
  private shipX = 0;
  private shipY = 0;
  private aimAngle = 0;
  private muzzle = 0;
  private hull = 100;
  private dying = false;
  private dyingTimer = 0;

  // Run stats
  private score = 0;
  private comboKills = 0;
  private maxCombo = 0;
  private kills = 0;
  private correctChars = 0;
  private errorCount = 0;
  private bossKills = 0;
  private perfectWaves = 0;
  private powerupsUsed = new Set<PowerUpType>();
  private elapsed = 0;

  // Effects / feel
  private effects = { overclock: 0, timewarp: 0, multishot: 0, shield: 0 };
  private inventory: PowerUpType[] = [];
  private lockout = 0;
  private podTimer = 12;
  private trauma = 0;
  private flashColor = '#ffffff';
  private flashAlpha = 0;
  private syncTimer = 0;
  private bannerKey = 0;

  /* ── Lifecycle ────────────────────────────────────────────────────── */

  attach(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', this.resize);
    window.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  detach(): void {
    this.stopLoop();
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.canvas = null;
    this.ctx = null;
  }

  startRun(mode: GameMode): void {
    const settings = useSettings.getState();
    this.mode = mode;
    this.diff = DIFFICULTY_PRESETS[settings.difficulty];
    this.rng = mode === 'daily' ? mulberry32(dailySeed().seed) : Math.random;

    this.enemies = [];
    this.projectiles = [];
    this.delayed = [];
    this.particles.clear();
    this.targetId = null;
    this.hull = 100;
    this.dying = false;
    this.score = 0;
    this.comboKills = 0;
    this.maxCombo = 0;
    this.kills = 0;
    this.correctChars = 0;
    this.errorCount = 0;
    this.bossKills = 0;
    this.perfectWaves = 0;
    this.powerupsUsed.clear();
    this.elapsed = 0;
    this.effects = { overclock: 0, timewarp: 0, multishot: 0, shield: 0 };
    this.inventory = [];
    this.lockout = 0;
    this.podTimer = 12;
    this.trauma = 0;
    this.flashAlpha = 0;
    this.paused = false;

    this.waveMgr = new WaveManager(this.rng, this.diff, {
      onAnnounce: (wave, title, subtitle) => this.announce(wave, title, subtitle),
      onWaveCleared: (wave, perfect) => this.onWaveCleared(wave, perfect),
    });
    this.waveMgr.startNextWave();

    Audio.init();
    Audio.startMusic();
    Audio.setIntensity(0.15);

    this.running = true;
    this.last = performance.now();
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(this.loop);
    this.syncStore(true);
  }

  setPaused(paused: boolean): void {
    if (!this.running || this.dying) return;
    this.paused = paused;
    useGame.getState().setOverlay(paused ? 'pause' : 'none');
    if (!paused) this.last = performance.now();
  }

  /** Click/tap path for the HUD inventory slots (keyboard uses 1–3). */
  usePowerupSlot(index: number): void {
    if (!this.running || this.paused || this.dying) return;
    this.activateSlot(index);
  }

  quitToMenu(): void {
    this.stopLoop();
    Audio.stopMusic();
    useGame.getState().setScreen('menu');
  }

  private stopLoop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private resize = (): void => {
    if (!this.canvas || !this.ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = this.canvas.clientWidth;
    this.h = this.canvas.clientHeight;
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.shipX = this.w / 2;
    this.shipY = this.h - 64;
    this.starfield.resize(this.w, this.h);
  };

  private onVisibility = (): void => {
    if (document.hidden && this.running && !this.paused) this.setPaused(true);
  };

  /* ── Input ────────────────────────────────────────────────────────── */

  private onKeyDown = (e: KeyboardEvent): void => {
    if (!this.running) return;
    const game = useGame.getState();

    if (e.key === 'Escape') {
      e.preventDefault();
      if (game.overlay === 'settings') game.closeSettings();
      else this.setPaused(!this.paused);
      return;
    }
    if (this.paused || this.dying || game.overlay !== 'none') return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;

    if (e.key >= '1' && e.key <= String(INVENTORY_SIZE)) {
      e.preventDefault();
      this.activateSlot(Number(e.key) - 1);
      return;
    }
    const ch = e.key.toLowerCase();
    if (/^[a-z]$/.test(ch)) {
      e.preventDefault();
      this.handleChar(ch);
    } else if (e.key === ' ') {
      e.preventDefault(); // don't scroll the page
    }
  };

  private handleChar(ch: string): void {
    if (this.lockout > 0 && this.effects.overclock <= 0) return;

    const target = this.targetId !== null ? this.findEnemy(this.targetId) : null;
    if (target && !target.doomed) {
      if (target.word[target.typed] === ch) this.hitEnemy(target);
      else this.mistake(target);
      return;
    }

    // Acquire a new lock: anything whose next letter matches; prefer the
    // enemy closest to the ship (most dangerous first).
    let candidate: Enemy | null = null;
    for (const e of this.enemies) {
      if (e.doomed || e.word[e.typed] !== ch) continue;
      if (!candidate || e.y > candidate.y) candidate = e;
    }
    if (candidate) {
      this.targetId = candidate.id;
      this.hitEnemy(candidate);
    } else {
      this.mistake(null);
    }
  }

  private get multiplier(): number {
    return Math.min(8, 1 + this.comboKills * 0.15);
  }

  private hitEnemy(e: Enemy): void {
    e.typed += 1;
    this.correctChars += 1;
    const overclock = this.effects.overclock > 0;
    this.score += 10 * this.multiplier * this.diff.scoreMult * (overclock ? 2 : 1);

    let completed = e.typed >= e.word.length;
    let last = completed;
    if (completed && e.kind === 'boss' && e.segments.length > 0) {
      // Segment down — boss survives, next word slides in.
      e.word = e.segments.shift()!;
      e.typed = 0;
      e.fireTimer = Math.max(e.fireTimer, 1.4);
      this.score += 150 * this.multiplier * this.diff.scoreMult;
      this.particles.explosion(e.x, e.y, this.palette.hostile, 1.4);
      this.particles.float(e.x, e.y - e.size - 34, 'SEGMENT DOWN', this.palette.reward, 14);
      this.trauma += 0.22;
      Audio.explosion(0.9);
      completed = false;
      last = false;
    }
    if (completed) {
      e.doomed = true;
      this.targetId = null; // free the lock while the kill shot flies
    }

    this.fireProjectile(e, last);
    if (overclock) {
      // Rapid-fire visual: two extra cosmetic shots with slight delay
      this.delayed.push({ t: 0.03, fn: () => this.fireProjectile(e, false) });
      this.delayed.push({ t: 0.06, fn: () => this.fireProjectile(e, false) });
    }
    if (this.effects.multishot > 0) this.multishotChip(e);

    Audio.laser(this.comboKills);
    this.muzzle = 1;
    this.trauma += 0.018;
  }

  /** Multishot: every keystroke also chips a letter off the nearest other hostile. */
  private multishotChip(primary: Enemy): void {
    let nearest: Enemy | null = null;
    let bestD = Infinity;
    for (const e of this.enemies) {
      if (e === primary || e.doomed || e.kind === 'pod') continue;
      const d = (e.x - primary.x) ** 2 + (e.y - primary.y) ** 2;
      if (d < bestD) {
        bestD = d;
        nearest = e;
      }
    }
    if (!nearest) return;
    nearest.typed += 1;
    const done = nearest.typed >= nearest.word.length && !(nearest.kind === 'boss' && nearest.segments.length > 0);
    if (nearest.kind === 'boss' && nearest.typed >= nearest.word.length && nearest.segments.length > 0) {
      nearest.word = nearest.segments.shift()!;
      nearest.typed = 0;
    }
    if (done) nearest.doomed = true;
    this.fireProjectile(nearest, done);
  }

  private mistake(target: Enemy | null): void {
    this.errorCount += 1;
    this.comboKills = 0;
    this.waveMgr.perfect = false;
    if (this.effects.overclock <= 0) this.lockout = LOCKOUT_SECONDS;
    if (target) target.speed = Math.min(target.speed * 1.07, ENEMY_DEFS[target.kind].speed * 2.4);
    this.flash(this.palette.warn, 0.1);
    this.trauma += 0.05;
    Audio.error();
  }

  /* ── Combat resolution ────────────────────────────────────────────── */

  private fireProjectile(target: Enemy, last: boolean): void {
    const dx = target.x - this.shipX;
    const dy = target.y - (this.shipY - 22);
    const len = Math.hypot(dx, dy) || 1;
    this.aimAngle = Math.atan2(dx, -dy);
    this.projectiles.push({
      x: this.shipX + (this.rng() - 0.5) * 6,
      y: this.shipY - 22,
      targetId: target.id,
      speed: PROJECTILE_SPEED,
      last,
      color: this.palette.target,
      trail: [],
      dead: false,
      dirX: dx / len,
      dirY: dy / len,
    });
  }

  private findEnemy(id: number): Enemy | null {
    for (const e of this.enemies) if (e.id === id) return e;
    return null;
  }

  private destroyEnemy(e: Enemy, opts: { score: boolean } = { score: true }): void {
    const idx = this.enemies.indexOf(e);
    if (idx === -1) return;
    this.enemies.splice(idx, 1);
    if (this.targetId === e.id) this.targetId = null;

    if (e.kind === 'pod') {
      this.collectPod(e);
      return;
    }

    this.kills += 1;
    this.comboKills += 1;
    this.maxCombo = Math.max(this.maxCombo, this.comboKills);

    if (opts.score) {
      const bonus = Math.round(e.word.length * 15 * e.bounty * this.multiplier * this.diff.scoreMult);
      this.score += bonus;
      this.particles.float(e.x, e.y - e.size - 6, `+${bonus}`, this.palette.reward);
      if (this.comboKills > 0 && this.comboKills % 10 === 0) {
        this.particles.float(e.x, e.y - e.size - 26, `COMBO ×${this.multiplier.toFixed(1)}`, this.palette.target, 17);
      }
    }

    const scale = e.size / 15;
    this.particles.explosion(e.x, e.y, e.kind === 'missile' ? '#ffc857' : this.palette.hostile, scale);
    this.trauma += Math.min(0.3, 0.07 + scale * 0.04);
    Audio.explosion(Math.min(1.6, 0.6 + scale * 0.3));

    if (e.kind === 'splitter') this.split(e);
    if (e.kind === 'boss') this.bossDown(e);
  }

  /** Splitters break into two fast scouts with fresh short words. */
  private split(e: Enemy): void {
    for (const dir of [-1, 1]) {
      const child = this.spawnEnemy('scout', { x: e.x + dir * 26, y: e.y + 8 });
      child.speed *= 1.35;
      child.phase = dir * Math.PI * 0.5;
      child.word = this.uniqueWord(1);
    }
  }

  private bossDown(e: Enemy): void {
    this.bossKills += 1;
    this.flash('#ffffff', 0.35);
    this.trauma += 0.5;
    // Chain of secondary explosions for a properly cinematic death
    for (let i = 1; i <= 4; i++) {
      const x = e.x + (this.rng() - 0.5) * e.size * 2;
      const y = e.y + (this.rng() - 0.5) * e.size * 1.5;
      this.delayed.push({
        t: i * 0.14,
        fn: () => {
          this.particles.explosion(x, y, this.palette.hostile, 1.6);
          Audio.explosion(1.2);
          this.trauma += 0.15;
        },
      });
    }
    useGame.getState().sync({ bossActive: false });
  }

  private collectPod(e: Enemy): void {
    if (!e.power) return;
    this.particles.explosion(e.x, e.y, POWERUP_DEFS[e.power].color, 0.8);
    this.particles.float(e.x, e.y - 24, POWERUP_DEFS[e.power].name, POWERUP_DEFS[e.power].color, 14);
    Audio.powerup();
    if (this.inventory.length < INVENTORY_SIZE) this.inventory.push(e.power);
    else this.applyPowerup(e.power);
    this.syncStore(true);
  }

  private activateSlot(index: number): void {
    const type = this.inventory[index];
    if (!type) return;
    this.inventory.splice(index, 1);
    this.applyPowerup(type);
    this.syncStore(true);
  }

  private applyPowerup(type: PowerUpType): void {
    this.powerupsUsed.add(type);
    const def = POWERUP_DEFS[type];
    Audio.powerup();
    switch (type) {
      case 'emp': {
        const radius = this.h * 0.55;
        this.particles.empWave(this.shipX, this.shipY, def.color, radius);
        this.flash(def.color, 0.22);
        this.trauma += 0.4;
        Audio.explosion(1.6);
        for (const e of [...this.enemies]) {
          if (e.kind === 'pod' || e.kind === 'boss') continue;
          if (Math.hypot(e.x - this.shipX, e.y - this.shipY) <= radius) {
            this.destroyEnemy(e, { score: false });
            this.score += 25 * this.diff.scoreMult;
          }
        }
        break;
      }
      case 'overclock':
        this.effects.overclock = def.duration;
        break;
      case 'shield':
        this.effects.shield = 3;
        break;
      case 'timewarp':
        this.effects.timewarp = def.duration;
        this.flash(def.color, 0.15);
        break;
      case 'multishot':
        this.effects.multishot = def.duration;
        break;
    }
  }

  private damagePlayer(amount: number): void {
    if (this.dying) return;
    this.comboKills = 0;
    this.waveMgr.perfect = false;
    if (this.effects.shield > 0) {
      this.effects.shield -= 1;
      this.particles.shockwave(this.shipX, this.shipY - 2, this.palette.shield, 56, 4);
      Audio.impact();
      return;
    }
    this.hull = Math.max(0, this.hull - amount * this.diff.damageMult);
    this.flash(this.palette.warn, 0.3);
    this.trauma += 0.35;
    Audio.hullHit();
    this.syncStore(true);
    if (this.hull <= 0) this.die();
  }

  private die(): void {
    this.dying = true;
    this.dyingTimer = 1.5;
    this.targetId = null;
    this.particles.explosion(this.shipX, this.shipY, '#ffffff', 2.4);
    this.particles.empWave(this.shipX, this.shipY, this.palette.warn, this.h * 0.4);
    this.flash('#ffffff', 0.5);
    this.trauma += 0.6;
    Audio.explosion(2.2);
    Audio.setIntensity(0);
  }

  private finishRun(): void {
    this.stopLoop();
    Audio.stopMusic();
    const minutes = Math.max(this.elapsed / 60, 1 / 60);
    const run: RunStats = {
      score: Math.round(this.score),
      accuracy:
        this.correctChars + this.errorCount === 0
          ? 1
          : this.correctChars / (this.correctChars + this.errorCount),
      wpm: Math.round(this.correctChars / 5 / minutes),
      maxCombo: this.maxCombo,
      kills: this.kills,
      wave: this.waveMgr.wave,
      chars: this.correctChars,
      errors: this.errorCount,
      durationMs: Math.round(this.elapsed * 1000),
      bossKills: this.bossKills,
      powerupsUsed: [...this.powerupsUsed],
      perfectWaves: this.perfectWaves,
      mode: this.mode,
      difficulty: this.diff.id,
      date: new Date().toISOString(),
    };
    const fresh = useMeta.getState().recordRun(run);
    useGame.getState().endGame(run, fresh);
  }

  /* ── Spawning ─────────────────────────────────────────────────────── */

  private announce(wave: number, title: string, subtitle: string): void {
    this.bannerKey += 1;
    useGame.getState().sync({
      wave,
      banner: { visible: true, title, subtitle, key: this.bannerKey },
    });
    if (isBossWave(wave)) Audio.bossAlarm();
    this.delayed.push({
      t: 2.2,
      fn: () => useGame.getState().sync({ banner: { visible: false, title, subtitle, key: this.bannerKey } }),
    });
  }

  private onWaveCleared(wave: number, perfect: boolean): void {
    if (perfect) {
      this.perfectWaves += 1;
      const bonus = Math.round(100 * wave * this.diff.scoreMult);
      this.score += bonus;
      this.particles.float(this.w / 2, this.h * 0.35, `FLAWLESS +${bonus}`, this.palette.reward, 20);
      Audio.powerup();
    }
  }

  /** Pick a word no other live enemy is using; prefer a unique first letter. */
  private uniqueWord(tier: number): string {
    const used = new Set(this.enemies.map((e) => e.word));
    const leads = new Set(this.enemies.map((e) => e.word[e.typed]));
    let fallback = pickWord(tier, this.rng);
    for (let i = 0; i < 14; i++) {
      const word = pickWord(tier, this.rng);
      if (used.has(word)) continue;
      fallback = word;
      if (!leads.has(word[0])) return word;
    }
    return fallback;
  }

  private spawnEnemy(kind: Enemy['kind'], at?: { x: number; y: number }): Enemy {
    const def = ENEMY_DEFS[kind];
    const wave = this.waveMgr.wave;
    const margin = 70;
    const x = at?.x ?? margin + this.rng() * Math.max(1, this.w - margin * 2);
    const speedScale = (1 + (wave - 1) * 0.045) * this.diff.speedMult;

    const e: Enemy = {
      id: this.nextId++,
      kind,
      word: this.uniqueWord(tierFor(kind, wave)),
      typed: 0,
      x,
      baseX: kind === 'boss' ? this.w / 2 : x,
      y: at?.y ?? (kind === 'boss' ? -90 : -36),
      vx: 0,
      vy: 0,
      speed: def.speed * speedScale,
      swayAmp: def.swayAmp,
      swayFreq: def.swayFreq,
      phase: this.rng() * Math.PI * 2,
      size: def.size,
      damage: def.damage,
      bounty: def.bounty,
      state: 'descend',
      holdY:
        kind === 'sniper'
          ? this.h * (0.2 + this.rng() * 0.2)
          : kind === 'boss'
            ? this.h * 0.17
            : Infinity,
      fireTimer: 2.4 + this.rng() * 2,
      flash: 0,
      knock: 0,
      doomed: false,
      time: 0,
      segments: [],
      power: null,
    };

    if (kind === 'boss') {
      const segCount = Math.min(5, 2 + Math.ceil(wave / 5));
      const segTier = clampTier(3 + Math.floor(wave / 10));
      const segs: string[] = [];
      while (segs.length < segCount) {
        const word = pickWord(segTier, this.rng);
        if (!segs.includes(word)) segs.push(word);
      }
      e.word = segs[0];
      e.segments = segs.slice(1);
      useGame.getState().sync({ bossActive: true });
    }

    this.enemies.push(e);
    return e;
  }

  private spawnMissile(fromX: number, fromY: number): void {
    const def = ENEMY_DEFS.missile;
    const speed = def.speed * (1 + this.waveMgr.wave * 0.03) * this.diff.speedMult;
    const dx = this.shipX - fromX;
    const dy = this.shipY - fromY;
    const len = Math.hypot(dx, dy) || 1;
    const e = this.spawnEnemy('missile', { x: fromX, y: fromY });
    e.word = this.uniqueWord(1).slice(0, 3);
    e.vx = (dx / len) * speed;
    e.vy = (dy / len) * speed;
    this.particles.hitSparks(fromX, fromY, this.palette.hostile, 5);
  }

  private spawnPod(): void {
    const type = POWERUP_ORDER[Math.floor(this.rng() * POWERUP_ORDER.length)];
    const e = this.spawnEnemy('pod');
    e.power = type;
    e.word = POWERUP_DEFS[type].word;
  }

  /* ── Main loop ────────────────────────────────────────────────────── */

  private loop = (now: number): void => {
    if (!this.running || !this.ctx) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    if (!this.paused) this.update(dt);
    this.render();
    this.raf = requestAnimationFrame(this.loop);
  };

  private get palette(): GamePalette {
    return PALETTES[useSettings.getState().colorblind];
  }

  private update(dt: number): void {
    const settings = useSettings.getState();
    this.particles.intensity = settings.reducedMotion ? 0.45 : 1;
    this.elapsed += dt;
    this.lockout = Math.max(0, this.lockout - dt);
    this.muzzle = Math.max(0, this.muzzle - dt * 6);
    this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2.2);
    this.trauma = Math.max(0, this.trauma - dt * 1.5);
    for (const k of ['overclock', 'timewarp', 'multishot'] as const) {
      this.effects[k] = Math.max(0, this.effects[k] - dt);
    }

    const warp = this.effects.timewarp > 0 ? 0.35 : 1;
    this.starfield.update(dt, warp * (settings.reducedMotion ? 0.5 : 1));

    // Delayed one-shot callbacks (boss chains, banner hide, …)
    for (let i = this.delayed.length - 1; i >= 0; i--) {
      this.delayed[i].t -= dt;
      if (this.delayed[i].t <= 0) {
        const { fn } = this.delayed[i];
        this.delayed.splice(i, 1);
        fn();
      }
    }

    if (this.dying) {
      this.particles.update(dt);
      this.dyingTimer -= dt;
      if (this.dyingTimer <= 0) this.finishRun();
      return;
    }

    // Wave director
    const hostiles = this.enemies.filter((e) => e.kind !== 'pod').length;
    for (const kind of this.waveMgr.update(dt, hostiles)) this.spawnEnemy(kind);

    // Power-up pods
    const podOnScreen = this.enemies.some((e) => e.kind === 'pod');
    if (this.waveMgr.wave >= 2 && !podOnScreen && this.inventory.length < INVENTORY_SIZE) {
      this.podTimer -= dt;
      if (this.podTimer <= 0) {
        this.podTimer = 15 + this.rng() * 9;
        this.spawnPod();
      }
    }

    this.updateEnemies(dt, warp);
    this.updateProjectiles(dt);
    this.particles.update(dt);

    // Ship aim eases back to neutral when no target
    if (this.targetId === null) this.aimAngle *= Math.max(0, 1 - dt * 4);

    // Music escalates with how crowded + how close the swarm is
    let closest = 0;
    for (const e of this.enemies) {
      if (e.kind !== 'pod') closest = Math.max(closest, e.y / this.h);
    }
    Audio.setIntensity(Math.min(1, hostiles / 9) * 0.55 + closest * 0.45);

    this.syncTimer -= dt;
    if (this.syncTimer <= 0) {
      this.syncTimer = SYNC_INTERVAL;
      this.syncStore();
    }
  }

  private updateEnemies(dt: number, warp: number): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.time += dt;
      e.flash = Math.max(0, e.flash - dt * 4);
      e.knock *= Math.max(0, 1 - dt * 10);
      const speedFactor = warp * (e.doomed ? 0.15 : 1);

      if (e.kind === 'missile') {
        e.x += e.vx * speedFactor * dt;
        e.y += e.vy * speedFactor * dt;
      } else {
        if (e.y < e.holdY) {
          e.y += e.speed * speedFactor * dt;
          if (e.y >= e.holdY) e.state = 'hold';
        } else if (e.state !== 'hold') {
          e.y += e.speed * speedFactor * dt;
        }
        e.x = e.baseX + Math.sin(e.time * e.swayFreq * Math.PI * 2 + e.phase) * e.swayAmp;
        e.x = Math.min(this.w - 46, Math.max(46, e.x));

        // Snipers and bosses fire homing missiles while holding position
        if (e.state === 'hold' && !e.doomed && (e.kind === 'sniper' || e.kind === 'boss')) {
          e.fireTimer -= dt * warp;
          if (e.fireTimer <= 0) {
            if (e.kind === 'sniper') {
              e.fireTimer = 3.6 + this.rng() * 2.4;
              this.spawnMissile(e.x, e.y + e.size);
            } else {
              e.fireTimer = Math.max(2.6, 5.4 - this.waveMgr.wave * 0.05);
              const volley = Math.min(4, 2 + Math.floor(this.waveMgr.wave / 10));
              for (let v = 0; v < volley; v++) {
                const vx = e.x + (v - (volley - 1) / 2) * 36;
                this.delayed.push({ t: v * 0.16, fn: () => this.spawnMissile(vx, e.y + e.size) });
              }
            }
          }
        }
      }

      // Reached the ship?
      if (!e.doomed && e.kind !== 'pod') {
        const hit =
          e.kind === 'missile'
            ? Math.hypot(e.x - this.shipX, e.y - this.shipY) < 34 || e.y > this.shipY + 20
            : e.y > this.shipY - 30;
        if (hit) {
          this.enemies.splice(i, 1);
          if (this.targetId === e.id) this.targetId = null;
          this.particles.explosion(e.x, Math.min(e.y, this.shipY), this.palette.warn, 1);
          this.damagePlayer(e.damage);
          if (e.kind === 'boss') useGame.getState().sync({ bossActive: false });
          continue;
        }
      }
      // Pods drift away harmlessly
      if (e.kind === 'pod' && e.y > this.h + 50) this.enemies.splice(i, 1);
    }
  }

  private updateProjectiles(dt: number): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const target = this.findEnemy(p.targetId);
      if (target) {
        const dx = target.x - p.x;
        const dy = target.y + target.knock - p.y;
        const len = Math.hypot(dx, dy) || 1;
        p.dirX = dx / len;
        p.dirY = dy / len;
        if (len < Math.max(10, target.size * 0.8)) {
          this.impact(p, target);
          this.projectiles.splice(i, 1);
          continue;
        }
      }
      p.trail.unshift({ x: p.x, y: p.y });
      if (p.trail.length > 6) p.trail.pop();
      p.x += p.dirX * p.speed * dt;
      p.y += p.dirY * p.speed * dt;
      if (p.y < -40 || p.x < -40 || p.x > this.w + 40 || p.y > this.h + 40) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  private impact(p: Projectile, target: Enemy): void {
    this.particles.hitSparks(p.x, p.y, p.color, 7);
    target.flash = 1;
    target.knock = -6;
    Audio.impact();
    if (p.last) this.destroyEnemy(target);
  }

  private flash(color: string, alpha: number): void {
    this.flashColor = color;
    this.flashAlpha = Math.max(this.flashAlpha, alpha);
  }

  private syncStore(force = false): void {
    void force;
    const minutes = Math.max(this.elapsed / 60, 1 / 60);
    useGame.getState().sync({
      score: Math.round(this.score),
      combo: this.comboKills,
      multiplier: this.multiplier,
      hull: Math.round(this.hull),
      wave: this.waveMgr.wave,
      wpm: this.elapsed > 4 ? Math.round(this.correctChars / 5 / minutes) : 0,
      accuracy:
        this.correctChars + this.errorCount === 0
          ? 1
          : this.correctChars / (this.correctChars + this.errorCount),
      inventory: [...this.inventory],
      effects: { ...this.effects },
    });
  }

  /* ── Rendering ────────────────────────────────────────────────────── */

  private render(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const settings = useSettings.getState();
    const palette = this.palette;
    const reduced = settings.reducedMotion;

    ctx.save();
    if (!reduced && this.trauma > 0) {
      const mag = this.trauma * this.trauma * 16;
      ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }

    this.starfield.draw(ctx);

    // Time-warp atmosphere
    if (this.effects.timewarp > 0) {
      ctx.fillStyle = 'rgba(110, 80, 255, 0.07)';
      ctx.fillRect(0, 0, this.w, this.h);
    }

    // Targeting line under everything else
    const target = this.targetId !== null ? this.findEnemy(this.targetId) : null;
    if (target && settings.showTargetLine) {
      ctx.save();
      ctx.strokeStyle = colorWithAlpha(palette.target, 0.22);
      ctx.setLineDash([3, 9]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this.shipX, this.shipY - 24);
      ctx.lineTo(target.x, target.y + target.size);
      ctx.stroke();
      ctx.restore();
    }

    // Enemies (target drawn last so its label sits on top)
    for (const e of this.enemies) {
      if (e !== target) {
        drawEnemy(ctx, e, palette, false);
        drawWord(ctx, e, palette, false, settings.fontScale);
      }
    }
    if (target) {
      drawEnemy(ctx, target, palette, true);
      drawWord(ctx, target, palette, true, settings.fontScale);
    }

    // Projectiles: additive bolt + fading trail
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.projectiles) {
      for (let i = 0; i < p.trail.length - 1; i++) {
        ctx.strokeStyle = colorWithAlpha(p.color, 0.5 * (1 - i / p.trail.length));
        ctx.lineWidth = 2.4 * (1 - i / p.trail.length);
        ctx.beginPath();
        ctx.moveTo(p.trail[i].x, p.trail[i].y);
        ctx.lineTo(p.trail[i + 1].x, p.trail[i + 1].y);
        ctx.stroke();
      }
      drawGlow(ctx, p.x, p.y, 9, p.color, 0.95);
      drawGlow(ctx, p.x, p.y, 3.5, '#ffffff', 1);
    }
    ctx.restore();

    this.particles.draw(ctx);

    if (!this.dying) {
      drawShip(
        ctx,
        this.shipX,
        this.shipY,
        this.aimAngle,
        getSkin(useMeta.getState().selectedSkin),
        this.elapsed,
        this.muzzle,
        this.effects.shield,
        palette.shield,
      );
      // Mistake lockout reads as the weapon overheating
      if (this.lockout > 0) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        drawGlow(ctx, this.shipX, this.shipY, 38, palette.warn, this.lockout / LOCKOUT_SECONDS * 0.5);
        ctx.restore();
      }
    }

    // Full-screen impact flash
    if (this.flashAlpha > 0.003) {
      ctx.fillStyle = colorWithAlpha(this.flashColor, Math.min(0.4, this.flashAlpha));
      ctx.fillRect(0, 0, this.w, this.h);
    }
    ctx.restore();
  }
}

export const Engine = new GameEngineImpl();
