import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ColorblindMode, Difficulty } from '../types';

export interface SettingsState {
  masterVolume: number; // 0..1
  sfxVolume: number;
  musicVolume: number;
  reducedMotion: boolean;
  colorblind: ColorblindMode;
  /** Multiplier applied to in-game word font size (0.85 / 1 / 1.2 / 1.4). */
  fontScale: number;
  difficulty: Difficulty;
  showTargetLine: boolean;

  set: <K extends keyof Omit<SettingsState, 'set'>>(key: K, value: SettingsState[K]) => void;
}

/** One-time migration from the game's original working title. */
export function migrateStorageKey(oldKey: string, newKey: string): void {
  try {
    const old = localStorage.getItem(oldKey);
    if (old && !localStorage.getItem(newKey)) {
      localStorage.setItem(newKey, old);
      localStorage.removeItem(oldKey);
    }
  } catch {
    // storage unavailable (private mode etc.) — persisting is best-effort
  }
}

migrateStorageKey('glyphstorm.settings', 'glyphwars.settings');

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      masterVolume: 0.8,
      sfxVolume: 0.9,
      musicVolume: 0.55,
      reducedMotion: false,
      colorblind: 'off',
      fontScale: 1,
      difficulty: 'pilot',
      showTargetLine: true,
      set: (key, value) => set({ [key]: value } as Partial<SettingsState>),
    }),
    { name: 'glyphwars.settings' },
  ),
);
