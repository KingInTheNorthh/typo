import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ACHIEVEMENTS } from '../config/achievements';
import { SHIP_SKINS } from '../config/skins';
import { migrateStorageKey } from './settingsStore';
import type { LifetimeStats, PowerUpType, RunStats } from '../types';

migrateStorageKey('glyphstorm.meta', 'glyphwars.meta');

const EMPTY_LIFE: LifetimeStats = {
  gamesPlayed: 0,
  totalScore: 0,
  totalKills: 0,
  totalChars: 0,
  totalErrors: 0,
  totalPlayMs: 0,
  bestWpm: 0,
  bestCombo: 0,
  bestWave: 0,
  bossKills: 0,
  powerupsUsed: [],
};

export interface MetaState {
  highscores: RunStats[]; // top runs, all modes, sorted by score desc
  lifetime: LifetimeStats;
  /** achievement id → ISO date unlocked */
  achievements: Record<string, string>;
  selectedSkin: string;
  bestScore: number;
  /** ISO date (yyyy-mm-dd) of the last completed daily challenge. */
  lastDailyPlayed: string | null;

  /** Folds a finished run into all persistent records. Returns newly unlocked achievement ids. */
  recordRun: (run: RunStats) => string[];
  selectSkin: (id: string) => void;
  isSkinUnlocked: (id: string) => boolean;
}

export const useMeta = create<MetaState>()(
  persist(
    (set, get) => ({
      highscores: [],
      lifetime: EMPTY_LIFE,
      achievements: {},
      selectedSkin: 'aurora',
      bestScore: 0,
      lastDailyPlayed: null,

      recordRun: (run) => {
        const s = get();
        const powerups = [...new Set<PowerUpType>([...s.lifetime.powerupsUsed, ...run.powerupsUsed])];
        const lifetime: LifetimeStats = {
          gamesPlayed: s.lifetime.gamesPlayed + 1,
          totalScore: s.lifetime.totalScore + run.score,
          totalKills: s.lifetime.totalKills + run.kills,
          totalChars: s.lifetime.totalChars + run.chars,
          totalErrors: s.lifetime.totalErrors + run.errors,
          totalPlayMs: s.lifetime.totalPlayMs + run.durationMs,
          bestWpm: Math.max(s.lifetime.bestWpm, run.wpm),
          bestCombo: Math.max(s.lifetime.bestCombo, run.maxCombo),
          bestWave: Math.max(s.lifetime.bestWave, run.wave),
          bossKills: s.lifetime.bossKills + run.bossKills,
          powerupsUsed: powerups,
        };

        const highscores = [...s.highscores, run].sort((a, b) => b.score - a.score).slice(0, 10);

        const achievements = { ...s.achievements };
        const fresh: string[] = [];
        for (const a of ACHIEVEMENTS) {
          if (!achievements[a.id] && a.test(run, lifetime)) {
            achievements[a.id] = run.date;
            fresh.push(a.id);
          }
        }

        set({
          lifetime,
          highscores,
          achievements,
          bestScore: Math.max(s.bestScore, run.score),
          lastDailyPlayed: run.mode === 'daily' ? run.date.slice(0, 10) : s.lastDailyPlayed,
        });
        return fresh;
      },

      selectSkin: (id) => {
        if (get().isSkinUnlocked(id)) set({ selectedSkin: id });
      },

      isSkinUnlocked: (id) => {
        const skin = SHIP_SKINS.find((sk) => sk.id === id);
        if (!skin) return false;
        if (!skin.unlock) return true;
        const s = get();
        return skin.unlock.type === 'score'
          ? s.bestScore >= (skin.unlock.value as number)
          : Boolean(s.achievements[skin.unlock.value as string]);
      },
    }),
    { name: 'glyphwars.meta' },
  ),
);
