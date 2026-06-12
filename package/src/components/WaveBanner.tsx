import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from '../state/gameStore';
import { useSettings } from '../state/settingsStore';

/** Cinematic inter-wave announcement: sliding rules + letter-spaced title. */
export function WaveBanner() {
  const banner = useGame((s) => s.banner);
  const reduced = useSettings((s) => s.reducedMotion);

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      <AnimatePresence>
        {banner.visible && (
          <motion.div
            key={banner.key}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.35 } }}
            className="flex flex-col items-center"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="mb-4 h-px w-64 bg-ion/70 sm:w-96"
            />
            <motion.h2
              initial={reduced ? { opacity: 0 } : { letterSpacing: '1.4em', opacity: 0, y: 8 }}
              animate={{ letterSpacing: '0.5em', opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className={`neon-text text-center font-display text-3xl font-bold uppercase sm:text-5xl ${
                banner.title.includes('DREADNOUGHT') ? 'text-flare' : 'text-ion'
              }`}
            >
              {banner.title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="mt-3 font-mono text-xs tracking-[0.4em] text-ghost uppercase sm:text-sm"
            >
              {banner.subtitle}
            </motion.p>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="mt-4 h-px w-64 bg-ion/70 sm:w-96"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
