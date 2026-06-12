import { AnimatePresence, motion } from 'framer-motion';
import { Engine } from '../../engine/GameEngine';
import { useGame } from '../../state/gameStore';
import { NeonButton } from '../ui/NeonButton';
import { Panel } from '../ui/Panel';

export function PauseOverlay() {
  const overlay = useGame((s) => s.overlay);
  const openSettings = useGame((s) => s.openSettings);

  return (
    <AnimatePresence>
      {overlay === 'pause' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="absolute inset-0 z-30 flex items-center justify-center bg-void/75 backdrop-blur-sm"
        >
          <Panel title="Paused" className="w-[min(340px,90vw)]">
            <div className="space-y-2.5">
              <NeonButton autoFocus onClick={() => Engine.setPaused(false)}>
                Resume
              </NeonButton>
              <NeonButton variant="ghost" onClick={() => openSettings('pause')}>
                Settings
              </NeonButton>
              <NeonButton variant="danger" onClick={() => Engine.quitToMenu()}>
                Abandon Run
              </NeonButton>
            </div>
            <p className="mt-4 text-center font-mono text-[10px] tracking-widest text-ghost uppercase">
              esc to resume
            </p>
          </Panel>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
