import type { Difficulty } from '../types';

export interface DifficultyPreset {
  id: Difficulty;
  name: string;
  desc: string;
  /** Multiplies enemy descent speed. */
  speedMult: number;
  /** Multiplies spawn rate (higher = more enemies). */
  spawnMult: number;
  /** Multiplies damage taken. */
  damageMult: number;
  /** Multiplies final score. */
  scoreMult: number;
}

export const DIFFICULTY_PRESETS: Record<Difficulty, DifficultyPreset> = {
  cadet: {
    id: 'cadet',
    name: 'CADET',
    desc: 'Slower enemies, gentler swarms. Learn the ropes.',
    speedMult: 0.78,
    spawnMult: 0.8,
    damageMult: 0.7,
    scoreMult: 0.75,
  },
  pilot: {
    id: 'pilot',
    name: 'PILOT',
    desc: 'The intended experience. Balanced pressure.',
    speedMult: 1,
    spawnMult: 1,
    damageMult: 1,
    scoreMult: 1,
  },
  ace: {
    id: 'ace',
    name: 'ACE',
    desc: 'Fast, dense, unforgiving. For keyboard veterans.',
    speedMult: 1.22,
    spawnMult: 1.25,
    damageMult: 1.3,
    scoreMult: 1.35,
  },
};
