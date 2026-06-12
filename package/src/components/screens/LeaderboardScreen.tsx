import { motion } from 'framer-motion';
import { useGame } from '../../state/gameStore';
import { useMeta } from '../../state/metaStore';
import { NeonButton } from '../ui/NeonButton';
import { Panel } from '../ui/Panel';

const fmt = new Intl.NumberFormat('en-US');

export function LeaderboardScreen() {
  const setScreen = useGame((s) => s.setScreen);
  const highscores = useMeta((s) => s.highscores);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex overflow-y-auto bg-[radial-gradient(ellipse_at_50%_-20%,#101a33_0%,#060614_60%)] px-4 py-8"
    >
      <div className="m-auto w-[min(560px,94vw)]">
        <Panel title="Local Leaderboard">
          {highscores.length === 0 ? (
            <p className="py-8 text-center font-mono text-sm text-ghost">
              No flights recorded. Launch and make history.
            </p>
          ) : (
            <table className="w-full font-mono text-sm">
              <thead>
                <tr className="text-left text-[9px] tracking-[0.3em] text-ghost uppercase">
                  <th className="pb-2">#</th>
                  <th className="pb-2 text-right">Score</th>
                  <th className="pb-2 text-right">Wave</th>
                  <th className="pb-2 text-right">WPM</th>
                  <th className="hidden pb-2 text-right sm:table-cell">Acc</th>
                  <th className="pb-2 text-right">Mode</th>
                  <th className="hidden pb-2 text-right sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {highscores.map((run, i) => (
                  <motion.tr
                    key={run.date + i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`border-t border-white/5 ${i === 0 ? 'text-volt' : 'text-white/85'}`}
                  >
                    <td className="py-1.5">{i === 0 ? '★' : i + 1}</td>
                    <td className="py-1.5 text-right font-bold tabular-nums">{fmt.format(run.score)}</td>
                    <td className="py-1.5 text-right tabular-nums">{run.wave}</td>
                    <td className="py-1.5 text-right tabular-nums">{run.wpm}</td>
                    <td className="hidden py-1.5 text-right tabular-nums sm:table-cell">
                      {Math.round(run.accuracy * 100)}%
                    </td>
                    <td className="py-1.5 text-right text-[11px] text-ghost uppercase">{run.mode}</td>
                    <td className="hidden py-1.5 text-right text-[11px] text-ghost sm:table-cell">
                      {run.date.slice(0, 10)}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
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
