import { AnimatePresence, motion } from 'framer-motion';
import { POWERUP_DEFS, INVENTORY_SIZE } from '../config/powerups';
import { Engine } from '../engine/GameEngine';
import { useGame } from '../state/gameStore';
import type { PowerUpType } from '../types';

const fmt = new Intl.NumberFormat('en-US');

/** In-game heads-up display. Pure presentation — all data flows from the engine. */
export function HUD() {
  const score = useGame((s) => s.score);
  const combo = useGame((s) => s.combo);
  const multiplier = useGame((s) => s.multiplier);
  const hull = useGame((s) => s.hull);
  const wave = useGame((s) => s.wave);
  const wpm = useGame((s) => s.wpm);
  const accuracy = useGame((s) => s.accuracy);
  const inventory = useGame((s) => s.inventory);
  const effects = useGame((s) => s.effects);
  const bossActive = useGame((s) => s.bossActive);

  const hullColor = hull > 60 ? 'var(--color-mint)' : hull > 30 ? 'var(--color-volt)' : 'var(--color-flare)';

  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-mono select-none">
      {/* ── Top left: score + combo ── */}
      <div className="absolute top-4 left-5 sm:top-6 sm:left-8">
        <div className="text-[10px] tracking-[0.35em] text-ghost uppercase">Score</div>
        <div className="neon-text text-2xl font-bold text-volt tabular-nums sm:text-3xl">
          {fmt.format(score)}
        </div>
        <AnimatePresence>
          {combo > 1 && (
            <motion.div
              key={combo}
              initial={{ scale: 1.45, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-1 text-sm font-semibold text-ion"
            >
              {combo} CHAIN <span className="text-volt">×{multiplier.toFixed(1)}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Top center: wave ── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center sm:top-6">
        <div className="text-[10px] tracking-[0.35em] text-ghost uppercase">
          {bossActive ? 'Dreadnought' : 'Wave'}
        </div>
        <div className={`text-xl font-bold ${bossActive ? 'neon-text text-flare' : 'text-white'}`}>
          {bossActive ? '⚠' : wave}
        </div>
      </div>

      {/* ── Top right: accuracy + wpm ── */}
      <div className="absolute top-4 right-5 text-right sm:top-6 sm:right-8">
        <div className="flex gap-6">
          <div>
            <div className="text-[10px] tracking-[0.35em] text-ghost uppercase">Acc</div>
            <div className="text-xl font-bold text-white tabular-nums sm:text-2xl">
              {Math.round(accuracy * 100)}
              <span className="text-sm text-ghost">%</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.35em] text-ghost uppercase">WPM</div>
            <div className="neon-text text-xl font-bold text-ion tabular-nums sm:text-2xl">{wpm}</div>
          </div>
        </div>
      </div>

      {/* ── Active effect chips ── */}
      <div className="absolute right-5 bottom-24 flex flex-col items-end gap-1.5 sm:right-8">
        {(Object.entries(effects) as Array<[PowerUpType | 'shield', number]>).map(([key, value]) => {
          if (value <= 0) return null;
          const def = POWERUP_DEFS[key as PowerUpType];
          const isShield = key === 'shield';
          return (
            <motion.div
              key={key}
              initial={{ x: 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-2 border px-2 py-1 text-xs font-semibold"
              style={{ borderColor: `${def.color}66`, color: def.color, background: '#0b0b2299' }}
            >
              <span>{def.icon}</span>
              <span className="tracking-widest">{def.name}</span>
              <span className="tabular-nums">{isShield ? `×${value}` : `${value.toFixed(0)}s`}</span>
            </motion.div>
          );
        })}
      </div>

      {/* ── Bottom: hull + power-up inventory ── */}
      <div className="absolute bottom-4 left-1/2 w-[min(540px,90vw)] -translate-x-1/2 sm:bottom-6">
        <div className="mb-2 flex items-end justify-between">
          <span className="text-[10px] tracking-[0.35em] text-ghost uppercase">
            Hull <span style={{ color: hullColor }}>{hull}%</span>
          </span>
          <div className="pointer-events-auto flex gap-2">
            {Array.from({ length: INVENTORY_SIZE }).map((_, i) => {
              const type = inventory[i];
              const def = type ? POWERUP_DEFS[type] : null;
              return (
                <button
                  key={i}
                  type="button"
                  tabIndex={-1}
                  onClick={() => def && Engine.usePowerupSlot(i)}
                  title={def ? `${def.name} — press ${i + 1}` : `Empty slot ${i + 1}`}
                  className="relative flex h-10 w-10 items-center justify-center border text-lg"
                  style={{
                    borderColor: def ? `${def.color}aa` : '#2a2f5566',
                    color: def?.color ?? '#2a2f55',
                    background: '#0b0b2288',
                    boxShadow: def ? `0 0 14px -4px ${def.color}` : 'none',
                  }}
                >
                  {def?.icon ?? ''}
                  <span className="absolute -top-1.5 -right-1 text-[9px] text-ghost">{i + 1}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="h-2 w-full overflow-hidden border border-white/10 bg-void-2/80">
          <motion.div
            className="h-full"
            animate={{ width: `${hull}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            style={{ background: hullColor, boxShadow: `0 0 12px ${hullColor}` }}
          />
        </div>
      </div>
    </div>
  );
}
