import { motion } from 'framer-motion';
import { ACHIEVEMENTS } from '../../config/achievements';
import { SHIP_SKINS } from '../../config/skins';
import { useGame } from '../../state/gameStore';
import { useMeta } from '../../state/metaStore';
import type { ShipSkin } from '../../types';
import { NeonButton } from '../ui/NeonButton';
import { Panel } from '../ui/Panel';

const fmt = new Intl.NumberFormat('en-US');

/** Inline SVG rendition of the ship in a skin's colors. */
function ShipPreview({ skin, dimmed }: { skin: ShipSkin; dimmed: boolean }) {
  return (
    <svg viewBox="-24 -26 48 46" className="h-16 w-16" style={{ opacity: dimmed ? 0.3 : 1 }}>
      <path
        d="M0,-22 L7,-2 L20,12 L13,14 L5,8 L0,11 L-5,8 L-13,14 L-20,12 L-7,-2 Z"
        fill="rgba(10,12,30,0.9)"
        stroke={skin.trimColor}
        strokeWidth="1.6"
      />
      <path d="M0,-14 L2.5,-4 L-2.5,-4 Z" fill={skin.hullColor} />
      <circle cx="0" cy="16" r="4" fill={skin.engineColor} opacity="0.8" />
    </svg>
  );
}

function unlockLabel(skin: ShipSkin): string {
  if (!skin.unlock) return '';
  if (skin.unlock.type === 'score') return `Reach ${fmt.format(skin.unlock.value as number)} score`;
  const a = ACHIEVEMENTS.find((x) => x.id === skin.unlock!.value);
  return a ? `Unlock “${a.name}”` : 'Locked';
}

/** Ship skin selection. Locked frames show their unlock condition. */
export function HangarScreen() {
  const setScreen = useGame((s) => s.setScreen);
  const selected = useMeta((s) => s.selectedSkin);
  const selectSkin = useMeta((s) => s.selectSkin);
  const isUnlocked = useMeta((s) => s.isSkinUnlocked);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex overflow-y-auto bg-[radial-gradient(ellipse_at_50%_120%,#1a1430_0%,#060614_60%)] px-4 py-8"
    >
      <div className="m-auto w-[min(620px,94vw)]">
        <Panel title="Hangar">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {SHIP_SKINS.map((skin, i) => {
              const unlocked = isUnlocked(skin.id);
              const active = selected === skin.id;
              return (
                <motion.button
                  key={skin.id}
                  type="button"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  whileHover={unlocked ? { scale: 1.03 } : undefined}
                  onClick={() => unlocked && selectSkin(skin.id)}
                  disabled={!unlocked}
                  className={`flex flex-col items-center border px-3 py-4 transition-colors ${
                    active
                      ? 'border-ion bg-ion/10'
                      : unlocked
                        ? 'border-ghost/25 hover:border-ghost/60'
                        : 'cursor-not-allowed border-ghost/15'
                  }`}
                >
                  <ShipPreview skin={skin} dimmed={!unlocked} />
                  <div
                    className="mt-2 font-display text-xs font-bold tracking-[0.25em]"
                    style={{ color: unlocked ? skin.trimColor : '#5a5f7d' }}
                  >
                    {unlocked ? skin.name : '🔒 ' + skin.name}
                  </div>
                  <div className="mt-1 min-h-8 text-center font-mono text-[10px] leading-snug text-ghost">
                    {unlocked ? skin.desc : unlockLabel(skin)}
                  </div>
                  {active && (
                    <div className="mt-1 font-mono text-[9px] tracking-[0.3em] text-ion uppercase">equipped</div>
                  )}
                </motion.button>
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
