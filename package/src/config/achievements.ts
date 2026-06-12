import type { AchievementDef } from '../types';

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-blood',
    name: 'FIRST BLOOD',
    desc: 'Destroy your first enemy.',
    test: (_r, life) => life.totalKills >= 1,
  },
  {
    id: 'combo-10',
    name: 'CHAIN REACTION',
    desc: 'Reach a 10× kill combo in one run.',
    test: (r) => r.maxCombo >= 10,
  },
  {
    id: 'combo-25',
    name: 'UNBROKEN',
    desc: 'Reach a 25× kill combo in one run.',
    test: (r) => r.maxCombo >= 25,
  },
  {
    id: 'wpm-60',
    name: 'TRIGGER FINGERS',
    desc: 'Finish a run of 60+ seconds at 60+ WPM.',
    test: (r) => r.wpm >= 60 && r.durationMs >= 60_000,
  },
  {
    id: 'wpm-90',
    name: 'LIGHTSPEED',
    desc: 'Finish a run of 60+ seconds at 90+ WPM.',
    test: (r) => r.wpm >= 90 && r.durationMs >= 60_000,
  },
  {
    id: 'wave-5',
    name: 'SECTOR FIVE',
    desc: 'Reach wave 5.',
    test: (r) => r.wave >= 5,
  },
  {
    id: 'wave-10',
    name: 'DEEP SPACE',
    desc: 'Reach wave 10 and enter the endless sector.',
    test: (r) => r.wave >= 10,
  },
  {
    id: 'boss-slayer',
    name: 'TITANFALL',
    desc: 'Destroy a boss dreadnought.',
    test: (r) => r.bossKills >= 1,
  },
  {
    id: 'perfect-wave',
    name: 'FLAWLESS',
    desc: 'Clear a full wave with zero typing mistakes.',
    test: (r) => r.perfectWaves >= 1,
  },
  {
    id: 'sharpshooter',
    name: 'SHARPSHOOTER',
    desc: 'Finish a run with 97%+ accuracy (500+ characters).',
    test: (r) => r.accuracy >= 0.97 && r.chars >= 500,
  },
  {
    id: 'arsenal',
    name: 'FULL ARSENAL',
    desc: 'Use all five power-up types (lifetime).',
    test: (_r, life) => life.powerupsUsed.length >= 5,
  },
  {
    id: 'kills-1000',
    name: 'EXTERMINATOR',
    desc: 'Destroy 1,000 enemies (lifetime).',
    test: (_r, life) => life.totalKills >= 1000,
  },
];
