import { motion } from 'framer-motion';
import { ACHIEVEMENTS } from '../../config/achievements';
import { useGame } from '../../state/gameStore';
import { useMeta } from '../../state/metaStore';
import { NeonButton } from '../ui/NeonButton';
import { Panel } from '../ui/Panel';

export function AchievementsScreen() {
  const setScreen = useGame((s) => s.setScreen);
  const unlocked = useMeta((s) => s.achievements);
  const count = Object.keys(unlocked).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex overflow-y-auto bg-[radial-gradient(ellipse_at_50%_-20%,#13240f_0%,#060614_60%)] px-4 py-8"
    >
      <div className="m-auto w-[min(560px,94vw)]">
        <Panel title={`Achievements ${count}/${ACHIEVEMENTS.length}`}>
          <div className="max-h-[55vh] space-y-1.5 overflow-y-auto pr-1 scroll-thin">
            {ACHIEVEMENTS.map((a, i) => {
              const date = unlocked[a.id];
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-3 border px-3 py-2.5 ${
                    date ? 'border-mint/30 bg-mint/5' : 'border-white/8 bg-void/40'
                  }`}
                >
                  <span className={`text-xl ${date ? 'text-mint' : 'text-ghost/40'}`}>
                    {date ? '◆' : '◇'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={`font-display text-xs font-bold tracking-[0.2em] ${date ? 'text-mint' : 'text-ghost'}`}>
                      {a.name}
                    </div>
                    <div className="font-mono text-[11px] text-ghost/80">{a.desc}</div>
                  </div>
                  {date && <span className="font-mono text-[10px] text-ghost">{date.slice(0, 10)}</span>}
                </motion.div>
              );
            })}
          </div>
          <div className="mt-5">
            <NeonButton autoFocus variant="ghost" onClick={() => setScreen('menu')}>
              ← Back
            </NeonButton>
          </div>
        </Panel>
      </div>
    </motion.div>
  );
}
