import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { ACHIEVEMENTS } from '../../config/achievements';
import { useGame } from '../../state/gameStore';
import { useMeta } from '../../state/metaStore';
import { NeonButton } from '../ui/NeonButton';
import { Panel } from '../ui/Panel';

const fmt = new Intl.NumberFormat('en-US');

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="border border-white/8 bg-void/50 px-3 py-2.5">
      <div className="font-mono text-[9px] tracking-[0.3em] text-ghost uppercase">{label}</div>
      <div className={`font-mono text-lg font-bold tabular-nums ${accent ? 'neon-text text-volt' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}

export function GameOverScreen() {
  const run = useGame((s) => s.lastRun);
  const fresh = useGame((s) => s.newAchievements);
  const startGame = useGame((s) => s.startGame);
  const setScreen = useGame((s) => s.setScreen);
  const bestScore = useMeta((s) => s.bestScore);

  // Quick restart with Enter
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && run) startGame(run.mode);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [run, startGame]);

  if (!run) return null;
  const isHighScore = run.score > 0 && run.score >= bestScore;
  const minutes = Math.floor(run.durationMs / 60000);
  const seconds = Math.round((run.durationMs % 60000) / 1000);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex overflow-y-auto bg-[radial-gradient(ellipse_at_50%_30%,#1c0c1f_0%,#060614_65%)] px-4 py-8"
    >
      <div className="m-auto w-[min(460px,94vw)]">
        <motion.h1
          initial={{ letterSpacing: '1em', opacity: 0 }}
          animate={{ letterSpacing: '0.35em', opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="neon-text mb-1 text-center font-display text-4xl font-bold text-flare uppercase sm:text-5xl"
        >
          Signal Lost
        </motion.h1>
        <p className="mb-5 text-center font-mono text-[11px] tracking-[0.4em] text-ghost uppercase">
          {run.mode === 'daily' ? 'daily challenge complete' : `wave ${run.wave} · ${run.difficulty}`}
        </p>

        <Panel className="mb-4">
          <div className="mb-3 text-center">
            {isHighScore && (
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.3 }}
                className="neon-text mb-1 font-display text-xs font-bold tracking-[0.45em] text-volt uppercase"
              >
                ★ New High Score ★
              </motion.div>
            )}
            <div className="neon-text font-mono text-4xl font-bold text-volt tabular-nums">
              {fmt.format(run.score)}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <Stat label="Accuracy" value={`${Math.round(run.accuracy * 100)}%`} />
            <Stat label="WPM" value={String(run.wpm)} accent />
            <Stat label="Best Combo" value={`×${run.maxCombo}`} />
            <Stat label="Destroyed" value={fmt.format(run.kills)} />
            <Stat label="Wave" value={String(run.wave)} />
            <Stat label="Time" value={`${minutes}:${String(seconds).padStart(2, '0')}`} />
          </div>

          {fresh.length > 0 && (
            <div className="mt-4 border-t border-ion/15 pt-3">
              <div className="mb-2 font-mono text-[10px] tracking-[0.3em] text-mint uppercase">
                Achievements unlocked
              </div>
              {fresh.map((id, i) => {
                const a = ACHIEVEMENTS.find((x) => x.id === id);
                if (!a) return null;
                return (
                  <motion.div
                    key={id}
                    initial={{ x: -16, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 + i * 0.12 }}
                    className="flex items-baseline gap-2 py-0.5 font-mono text-sm"
                  >
                    <span className="text-mint">◆ {a.name}</span>
                    <span className="text-[11px] text-ghost">{a.desc}</span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </Panel>

        <div className="space-y-2.5">
          <NeonButton autoFocus onClick={() => startGame(run.mode)}>
            ▸ Fly Again <span className="ml-1 text-[10px] text-ghost">enter</span>
          </NeonButton>
          <NeonButton variant="ghost" onClick={() => setScreen('leaderboard')}>
            Leaderboard
          </NeonButton>
          <NeonButton variant="ghost" onClick={() => setScreen('menu')}>
            Main Menu
          </NeonButton>
        </div>
      </div>
    </motion.div>
  );
}
