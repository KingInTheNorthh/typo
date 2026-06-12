/** Shared domain types for GLYPHWARS. */

export type Screen =
  | 'menu'
  | 'game'
  | 'gameover'
  | 'leaderboard'
  | 'stats'
  | 'hangar'
  | 'achievements'
  | 'credits';

export type Overlay = 'none' | 'pause' | 'settings';

export type GameMode = 'standard' | 'daily';

export type Difficulty = 'cadet' | 'pilot' | 'ace';

export type EnemyKind =
  | 'scout'
  | 'frigate'
  | 'tank'
  | 'splitter'
  | 'sniper'
  | 'boss'
  | 'missile' // typeable enemy projectile fired by snipers / bosses
  | 'pod'; // typeable power-up capsule

export type PowerUpType = 'emp' | 'overclock' | 'shield' | 'timewarp' | 'multishot';

export type ColorblindMode = 'off' | 'deuteranopia' | 'tritanopia' | 'mono';

export interface Vec2 {
  x: number;
  y: number;
}

/** Live timers for active power-up effects (seconds remaining / charges). */
export interface ActiveEffects {
  overclock: number;
  timewarp: number;
  multishot: number;
  shield: number; // remaining hit charges
}

/** Summary of a single finished run — recorded to the local leaderboard. */
export interface RunStats {
  score: number;
  accuracy: number; // 0..1
  wpm: number;
  maxCombo: number;
  kills: number;
  wave: number;
  chars: number;
  errors: number;
  durationMs: number;
  bossKills: number;
  powerupsUsed: PowerUpType[];
  perfectWaves: number;
  mode: GameMode;
  difficulty: Difficulty;
  date: string; // ISO
}

/** Lifetime aggregates across all runs — feeds the stats dashboard. */
export interface LifetimeStats {
  gamesPlayed: number;
  totalScore: number;
  totalKills: number;
  totalChars: number;
  totalErrors: number;
  totalPlayMs: number;
  bestWpm: number;
  bestCombo: number;
  bestWave: number;
  bossKills: number;
  powerupsUsed: PowerUpType[];
}

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  /** Returns true if unlocked given the run that just ended + lifetime totals. */
  test: (run: RunStats, life: LifetimeStats) => boolean;
}

export interface ShipSkin {
  id: string;
  name: string;
  desc: string;
  hullColor: string;
  trimColor: string;
  engineColor: string;
  /** null = unlocked from the start */
  unlock: { type: 'score' | 'achievement'; value: number | string } | null;
}

export interface WaveBannerState {
  visible: boolean;
  title: string;
  subtitle: string;
  /** bump to retrigger the animation */
  key: number;
}
