import { create } from 'zustand';
import type {
  ActiveEffects,
  GameMode,
  Overlay,
  PowerUpType,
  RunStats,
  Screen,
  WaveBannerState,
} from '../types';

/**
 * UI-facing game state. The canvas engine owns the authoritative simulation
 * and pushes snapshots here (throttled) for the React HUD to render.
 */
export interface GameState {
  screen: Screen;
  overlay: Overlay;
  /** Where the settings overlay should return to when closed. */
  settingsReturn: Overlay;
  mode: GameMode;

  // Live HUD values
  score: number;
  combo: number;
  multiplier: number;
  hull: number;
  maxHull: number;
  wave: number;
  wpm: number;
  accuracy: number;
  inventory: PowerUpType[];
  effects: ActiveEffects;
  banner: WaveBannerState;
  bossActive: boolean;

  /** Stats of the run that just ended + freshly unlocked achievements. */
  lastRun: RunStats | null;
  newAchievements: string[];

  setScreen: (screen: Screen) => void;
  setOverlay: (overlay: Overlay) => void;
  openSettings: (from: Overlay) => void;
  closeSettings: () => void;
  startGame: (mode: GameMode) => void;
  endGame: (run: RunStats, newAchievements: string[]) => void;
  /** Bulk snapshot setter used by the engine. */
  sync: (partial: Partial<GameState>) => void;
}

const initialHud = {
  score: 0,
  combo: 0,
  multiplier: 1,
  hull: 100,
  maxHull: 100,
  wave: 0,
  wpm: 0,
  accuracy: 1,
  inventory: [] as PowerUpType[],
  effects: { overclock: 0, timewarp: 0, multishot: 0, shield: 0 },
  banner: { visible: false, title: '', subtitle: '', key: 0 },
  bossActive: false,
};

export const useGame = create<GameState>()((set) => ({
  screen: 'menu',
  overlay: 'none',
  settingsReturn: 'none',
  mode: 'standard',
  ...initialHud,
  lastRun: null,
  newAchievements: [],

  setScreen: (screen) => set({ screen, overlay: 'none' }),
  setOverlay: (overlay) => set({ overlay }),
  openSettings: (from) => set({ overlay: 'settings', settingsReturn: from }),
  closeSettings: () => set((s) => ({ overlay: s.settingsReturn, settingsReturn: 'none' })),
  startGame: (mode) => set({ ...initialHud, mode, screen: 'game', overlay: 'none', lastRun: null, newAchievements: [] }),
  endGame: (run, newAchievements) => set({ screen: 'gameover', overlay: 'none', lastRun: run, newAchievements }),
  sync: (partial) => set(partial),
}));
