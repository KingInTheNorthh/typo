import type { EnemyKind } from '../types';

/** Static tuning for each enemy archetype. Speeds are px/sec in CSS pixels. */
export interface EnemyDef {
  /** Base descent speed before wave/difficulty multipliers. */
  speed: number;
  /** Horizontal sine-sway amplitude (px) and frequency (Hz). */
  swayAmp: number;
  swayFreq: number;
  /** Hull damage dealt if it reaches the player. */
  damage: number;
  /** Visual radius (px) used for drawing + impact effects. */
  size: number;
  /** Base word tier (bumped up as waves progress). */
  wordTier: number;
  /** Score multiplier on kill. */
  bounty: number;
}

export const ENEMY_DEFS: Record<EnemyKind, EnemyDef> = {
  scout: { speed: 46, swayAmp: 38, swayFreq: 0.55, damage: 8, size: 14, wordTier: 1, bounty: 1 },
  frigate: { speed: 30, swayAmp: 22, swayFreq: 0.32, damage: 12, size: 19, wordTier: 2, bounty: 1.4 },
  tank: { speed: 17, swayAmp: 8, swayFreq: 0.18, damage: 22, size: 26, wordTier: 4, bounty: 2.2 },
  splitter: { speed: 33, swayAmp: 30, swayFreq: 0.45, damage: 10, size: 17, wordTier: 2, bounty: 1.6 },
  sniper: { speed: 38, swayAmp: 14, swayFreq: 0.4, damage: 14, size: 17, wordTier: 3, bounty: 2 },
  boss: { speed: 26, swayAmp: 90, swayFreq: 0.1, damage: 40, size: 52, wordTier: 3, bounty: 10 },
  missile: { speed: 60, swayAmp: 0, swayFreq: 0, damage: 7, size: 8, wordTier: 1, bounty: 0.5 },
  pod: { speed: 24, swayAmp: 16, swayFreq: 0.25, damage: 0, size: 15, wordTier: 1, bounty: 0 },
};

/** First wave at which each hostile kind may appear. */
export const KIND_UNLOCK_WAVE: Partial<Record<EnemyKind, number>> = {
  scout: 1,
  frigate: 2,
  splitter: 3,
  tank: 4,
  sniper: 6,
};

/** Relative spawn weight once unlocked. */
export const KIND_WEIGHTS: Partial<Record<EnemyKind, number>> = {
  scout: 5,
  frigate: 3.4,
  splitter: 2,
  tank: 1.6,
  sniper: 1.4,
};
