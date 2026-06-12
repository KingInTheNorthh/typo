import { motion } from 'framer-motion';
import { useGame } from '../../state/gameStore';
import { useMeta } from '../../state/metaStore';
import { NeonButton } from '../ui/NeonButton';
import { Panel } from '../ui/Panel';

const fmt = new Intl.NumberFormat('en-US');

function Cell({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border border-white/8 bg-void/50 px-4 py-3 ${big ? 'col-span-2' : ''}`}
    >
      <div className="font-mono text-[9px] tracking-[0.3em] text-ghost uppercase">{label}</div>
      <div className={`font-mono font-bold text-white tabular-nums ${big ? 'neon-text text-3xl text-ion' : 'text-xl'}`}>
        {value}
      </div>
    </motion.div>
  );
}

/** Lifetime statistics dashboard. */
export function StatsScreen() {
  const setScreen = useGame((s) => s.setScreen);
  const life = useMeta((s) => s.lifetime);

  const totalKeys = life.totalChars + life.totalErrors;
  const accuracy = totalKeys === 0 ? 1 : life.totalChars / totalKeys;
  const hours = Math.floor(life.totalPlayMs / 3_600_000);
  const mins = Math.round((life.totalPlayMs % 3_600_000) / 60_000);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex overflow-y-auto bg-[radial-gradient(ellipse_at_50%_-20%,#0c2030_0%,#060614_60%)] px-4 py-8"
    >
      <div className="m-auto w-[min(520px,94vw)]">
        <Panel title="Pilot Record">
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            <Cell big label="Total score" value={fmt.format(life.totalScore)} />
            <Cell label="Sorties" value={fmt.format(life.gamesPlayed)} />
            <Cell label="Enemies destroyed" value={fmt.format(life.totalKills)} />
            <Cell label="Bosses down" value={fmt.format(life.bossKills)} />
            <Cell label="Characters fired" value={fmt.format(life.totalChars)} />
            <Cell label="Lifetime accuracy" value={`${Math.round(accuracy * 100)}%`} />
            <Cell label="Best WPM" value={String(life.bestWpm)} />
            <Cell label="Best combo" value={`×${life.bestCombo}`} />
            <Cell label="Deepest wave" value={String(life.bestWave)} />
            <Cell label="Time in cockpit" value={hours > 0 ? `${hours}h ${mins}m` : `${mins}m`} />
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
