import { motion } from 'framer-motion';
import { DIFFICULTY_PRESETS } from '../../config/difficulty';
import { dailySeed } from '../../engine/rng';
import { useGame } from '../../state/gameStore';
import { useMeta } from '../../state/metaStore';
import { useSettings } from '../../state/settingsStore';
import type { Difficulty } from '../../types';
import { NeonButton } from '../ui/NeonButton';

const fmt = new Intl.NumberFormat('en-US');

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
};

export function MainMenu() {
  const startGame = useGame((s) => s.startGame);
  const setScreen = useGame((s) => s.setScreen);
  const openSettings = useGame((s) => s.openSettings);
  const bestScore = useMeta((s) => s.bestScore);
  const lastDaily = useMeta((s) => s.lastDailyPlayed);
  const difficulty = useSettings((s) => s.difficulty);
  const setSetting = useSettings((s) => s.set);

  const daily = dailySeed();
  const dailyDone = lastDaily === daily.label;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      className="absolute inset-0 z-20 overflow-y-auto bg-[radial-gradient(ellipse_at_50%_120%,#141033_0%,#060614_60%)] scroll-thin"
    >
      {/* min-h-full wrapper: centers when it fits, scrolls without clipping when it doesn't */}
      <div className="flex min-h-full flex-col items-center justify-center px-4 py-6">
        {/* Title block — single restrained tone */}
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-7 text-center"
        >
          <h1
            className="font-display text-4xl font-bold tracking-[0.22em] text-[#e8ecff] sm:text-6xl"
            style={{ textShadow: '0 0 28px rgba(130, 150, 255, 0.22)' }}
          >
            GLYPH<span className="text-ghost">WARS</span>
          </h1>
          <p className="mt-2.5 font-mono text-[11px] tracking-[0.45em] text-ghost uppercase">
            by Skywalker
          </p>
          {bestScore > 0 && (
            <p className="mt-3 font-mono text-sm text-volt">BEST {fmt.format(bestScore)}</p>
          )}
        </motion.div>

        {/* Compact crate layout: primary actions on top, nav in a 2-col grid */}
        <motion.nav
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid w-full max-w-md grid-cols-2 gap-2.5"
        >
          <motion.div variants={item} className="col-span-2">
            <NeonButton autoFocus onClick={() => startGame('standard')}>
              ▸ Launch
            </NeonButton>
          </motion.div>
          <motion.div variants={item} className="col-span-2">
            <NeonButton variant={dailyDone ? 'ghost' : 'primary'} onClick={() => startGame('daily')}>
              Daily Challenge
              <span className="ml-2 text-[10px] text-ghost">
                {daily.label}
                {dailyDone ? ' ✓' : ''}
              </span>
            </NeonButton>
          </motion.div>

          {/* Difficulty selector */}
          <motion.div variants={item} className="col-span-2 flex gap-1.5">
            {(Object.keys(DIFFICULTY_PRESETS) as Difficulty[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSetting('difficulty', d)}
                title={DIFFICULTY_PRESETS[d].desc}
                className={`flex-1 border py-1.5 font-display text-[11px] font-semibold tracking-[0.2em] uppercase transition-colors ${
                  difficulty === d
                    ? 'border-volt bg-volt/10 text-volt'
                    : 'border-ghost/25 text-ghost hover:border-ghost/60 hover:text-white'
                }`}
              >
                {DIFFICULTY_PRESETS[d].name}
              </button>
            ))}
          </motion.div>

          {(
            [
              ['Hangar', 'hangar'],
              ['Leaderboard', 'leaderboard'],
              ['Statistics', 'stats'],
              ['Achievements', 'achievements'],
            ] as const
          ).map(([label, screen]) => (
            <motion.div variants={item} key={screen}>
              <NeonButton variant="ghost" onClick={() => setScreen(screen)}>
                {label}
              </NeonButton>
            </motion.div>
          ))}
          <motion.div variants={item}>
            <NeonButton variant="ghost" onClick={() => openSettings('none')}>
              Settings
            </NeonButton>
          </motion.div>
          <motion.div variants={item}>
            <NeonButton variant="ghost" onClick={() => setScreen('credits')}>
              Credits
            </NeonButton>
          </motion.div>
        </motion.nav>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-7 max-w-sm text-center font-mono text-[11px] leading-relaxed text-ghost/70"
        >
          Type the word above an enemy to lock on and fire. Finish the word to destroy it.
          Collect pods, bank power-ups, press <span className="text-ion">1–3</span> to deploy.
          <span className="text-ion"> ESC</span> pauses.
        </motion.p>
      </div>
    </motion.div>
  );
}
