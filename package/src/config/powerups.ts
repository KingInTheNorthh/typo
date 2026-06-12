import type { PowerUpType } from '../types';

export interface PowerUpDef {
  id: PowerUpType;
  name: string;
  /** Word shown on the collectible pod. */
  word: string;
  /** Single glyph drawn inside the pod + inventory slot. */
  icon: string;
  color: string;
  desc: string;
  /** Effect duration in seconds (0 = instant / charge-based). */
  duration: number;
}

export const POWERUP_DEFS: Record<PowerUpType, PowerUpDef> = {
  emp: {
    id: 'emp',
    name: 'EMP BLAST',
    word: 'emp',
    icon: '◎',
    color: '#4df3ff',
    desc: 'Detonates a shockwave that vaporizes nearby enemies.',
    duration: 0,
  },
  overclock: {
    id: 'overclock',
    name: 'OVERCLOCK',
    word: 'boost',
    icon: '⌁',
    color: '#ffc857',
    desc: 'Rapid-fire mode: triple projectiles, double score, no miss lockout.',
    duration: 8,
  },
  shield: {
    id: 'shield',
    name: 'AEGIS SHIELD',
    word: 'aegis',
    icon: '◇',
    color: '#5dffb0',
    desc: 'Absorbs the next 3 hits to your hull.',
    duration: 0,
  },
  timewarp: {
    id: 'timewarp',
    name: 'TIME WARP',
    word: 'warp',
    icon: '∿',
    color: '#8b5cf6',
    desc: 'Slows all enemies to a crawl for 6 seconds.',
    duration: 6,
  },
  multishot: {
    id: 'multishot',
    name: 'MULTISHOT',
    word: 'fork',
    icon: '⋔',
    color: '#ff5c8a',
    desc: 'Every keystroke also strikes the nearest other enemy.',
    duration: 7,
  },
};

export const POWERUP_ORDER: PowerUpType[] = ['emp', 'overclock', 'shield', 'timewarp', 'multishot'];

/** Max pods the player can bank at once (activated with keys 1–3). */
export const INVENTORY_SIZE = 3;
