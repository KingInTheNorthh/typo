import { ENEMY_DEFS, KIND_UNLOCK_WAVE, KIND_WEIGHTS } from '../config/enemies';
import type { DifficultyPreset } from '../config/difficulty';
import { clampTier } from '../config/words';
import type { EnemyKind } from '../types';

/** Waves 1–9 are the authored campaign; wave 10+ is the endless sector. */
export const ENDLESS_START = 10;
export const BOSS_EVERY = 5;

export const isBossWave = (wave: number): boolean => wave % BOSS_EVERY === 0;

/** Word tier for a spawn, scaling up as waves progress. */
export function tierFor(kind: EnemyKind, wave: number): number {
  return clampTier(ENEMY_DEFS[kind].wordTier + Math.floor((wave - 1) / 4));
}

export interface WaveEvents {
  onAnnounce: (wave: number, title: string, subtitle: string) => void;
  onWaveCleared: (wave: number, perfect: boolean) => void;
}

/**
 * Drives the wave lifecycle: announce → spawn queue → wait for field clear →
 * next wave. The engine polls `update()` each frame for spawn orders.
 */
export class WaveManager {
  wave = 0;
  state: 'idle' | 'announce' | 'active' | 'clearing' = 'idle';
  /** No mistakes or hull damage so far this wave. */
  perfect = true;

  private queue: EnemyKind[] = [];
  private spawnTimer = 0;
  private announceTimer = 0;

  constructor(
    private rng: () => number,
    private diff: DifficultyPreset,
    private events: WaveEvents,
  ) {}

  /** Enemies allowed on screen simultaneously. */
  get maxConcurrent(): number {
    return Math.min(10, Math.round((3 + this.wave * 0.7) * this.diff.spawnMult));
  }

  private get spawnInterval(): number {
    return Math.max(0.55, 2.05 - this.wave * 0.085) / this.diff.spawnMult;
  }

  startNextWave(): void {
    this.wave += 1;
    this.perfect = true;
    this.queue = this.buildQueue(this.wave);
    this.spawnTimer = 0.4;
    this.announceTimer = 2.3;
    this.state = 'announce';

    const title = isBossWave(this.wave) ? 'DREADNOUGHT DETECTED' : `WAVE ${this.wave}`;
    const subtitle = isBossWave(this.wave)
      ? 'destroy all word segments'
      : this.wave === ENDLESS_START
        ? 'ENDLESS SECTOR — survive'
        : this.flavor(this.wave);
    this.events.onAnnounce(this.wave, title, subtitle);
  }

  private flavor(wave: number): string {
    const lines = [
      'hostiles inbound',
      'incoming signatures',
      'enemy formation detected',
      'pressure rising',
      'they keep coming',
      'hold the line',
    ];
    return lines[wave % lines.length];
  }

  private buildQueue(wave: number): EnemyKind[] {
    if (isBossWave(wave)) return ['boss'];

    const count = Math.min(30, Math.round((4 + wave * 2.2) * this.diff.spawnMult));
    const unlocked = (Object.keys(KIND_WEIGHTS) as EnemyKind[]).filter(
      (k) => (KIND_UNLOCK_WAVE[k] ?? 99) <= wave,
    );
    const queue: EnemyKind[] = [];
    for (let i = 0; i < count; i++) {
      queue.push(this.weightedPick(unlocked));
    }
    return queue;
  }

  private weightedPick(kinds: EnemyKind[]): EnemyKind {
    let total = 0;
    for (const k of kinds) total += KIND_WEIGHTS[k] ?? 0;
    let roll = this.rng() * total;
    for (const k of kinds) {
      roll -= KIND_WEIGHTS[k] ?? 0;
      if (roll <= 0) return k;
    }
    return 'scout';
  }

  /** Returns the kinds that should spawn this frame. */
  update(dt: number, aliveHostiles: number): EnemyKind[] {
    switch (this.state) {
      case 'idle':
        return [];
      case 'announce':
        this.announceTimer -= dt;
        if (this.announceTimer <= 0) this.state = 'active';
        return [];
      case 'active': {
        if (this.queue.length === 0) {
          this.state = 'clearing';
          return [];
        }
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0 && aliveHostiles < this.maxConcurrent) {
          this.spawnTimer = this.spawnInterval * (0.7 + this.rng() * 0.6);
          return [this.queue.shift()!];
        }
        return [];
      }
      case 'clearing':
        if (aliveHostiles === 0) {
          this.events.onWaveCleared(this.wave, this.perfect);
          this.startNextWave();
        }
        return [];
    }
  }
}
