import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { Audio } from '../../audio/AudioEngine';
import { useGame } from '../../state/gameStore';
import { useSettings } from '../../state/settingsStore';
import type { ColorblindMode } from '../../types';
import { NeonButton } from '../ui/NeonButton';
import { Panel } from '../ui/Panel';

const CB_MODES: Array<[ColorblindMode, string]> = [
  ['off', 'Off'],
  ['deuteranopia', 'Deuteranopia'],
  ['tritanopia', 'Tritanopia'],
  ['mono', 'High contrast'],
];

const FONT_SCALES: Array<[number, string]> = [
  [0.85, 'S'],
  [1, 'M'],
  [1.2, 'L'],
  [1.4, 'XL'],
];

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 flex justify-between font-mono text-[11px] tracking-widest text-ghost uppercase">
        {label} <span className="text-ion">{Math.round(value * 100)}%</span>
      </span>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-(--color-ion)"
      />
    </label>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between py-1 font-mono text-[11px] tracking-widest text-ghost uppercase"
    >
      {label}
      <span
        className={`inline-block border px-2 py-0.5 text-[10px] font-bold ${
          value ? 'border-mint text-mint' : 'border-ghost/40 text-ghost'
        }`}
      >
        {value ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}

/** Settings panel — reachable from the main menu and the pause menu. */
export function SettingsOverlay() {
  const overlay = useGame((s) => s.overlay);
  const closeSettings = useGame((s) => s.closeSettings);
  const s = useSettings();

  // Keep the audio engine in sync with volume settings.
  useEffect(() => {
    Audio.setVolumes(s.masterVolume, s.sfxVolume, s.musicVolume);
  }, [s.masterVolume, s.sfxVolume, s.musicVolume]);

  return (
    <AnimatePresence>
      {overlay === 'settings' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="absolute inset-0 z-40 flex items-center justify-center bg-void/80 backdrop-blur-sm"
        >
          <Panel title="Settings" className="max-h-[88vh] w-[min(420px,92vw)] overflow-y-auto scroll-thin">
            <div className="space-y-4">
              <Slider label="Master volume" value={s.masterVolume} onChange={(v) => s.set('masterVolume', v)} />
              <Slider label="Effects" value={s.sfxVolume} onChange={(v) => s.set('sfxVolume', v)} />
              <Slider label="Music" value={s.musicVolume} onChange={(v) => s.set('musicVolume', v)} />

              <hr className="border-ion/15" />

              <Toggle label="Reduced motion" value={s.reducedMotion} onChange={(v) => s.set('reducedMotion', v)} />
              <Toggle label="Targeting line" value={s.showTargetLine} onChange={(v) => s.set('showTargetLine', v)} />

              <div>
                <span className="mb-1.5 block font-mono text-[11px] tracking-widest text-ghost uppercase">
                  Colorblind mode
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {CB_MODES.map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => s.set('colorblind', mode)}
                      className={`border py-1.5 font-display text-[11px] tracking-wider uppercase transition-colors ${
                        s.colorblind === mode
                          ? 'border-ion bg-ion/10 text-ion'
                          : 'border-ghost/25 text-ghost hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="mb-1.5 block font-mono text-[11px] tracking-widest text-ghost uppercase">
                  Word size
                </span>
                <div className="flex gap-1.5">
                  {FONT_SCALES.map(([scale, label]) => (
                    <button
                      key={scale}
                      type="button"
                      onClick={() => s.set('fontScale', scale)}
                      className={`flex-1 border py-1.5 font-display text-[11px] font-bold uppercase transition-colors ${
                        s.fontScale === scale
                          ? 'border-ion bg-ion/10 text-ion'
                          : 'border-ghost/25 text-ghost hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <NeonButton onClick={closeSettings}>Done</NeonButton>
            </div>
          </Panel>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
