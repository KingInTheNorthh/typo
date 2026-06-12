import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Audio } from '../../audio/AudioEngine';

interface NeonButtonProps {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
}

const variants = {
  primary:
    'border-ion/60 text-ion hover:bg-ion/10 hover:border-ion focus-visible:bg-ion/10 shadow-[0_0_18px_-6px_var(--color-ion)]',
  ghost: 'border-ghost/30 text-ghost hover:text-white hover:border-ghost/70 focus-visible:text-white',
  danger:
    'border-flare/50 text-flare hover:bg-flare/10 hover:border-flare focus-visible:bg-flare/10',
};

/** The one button. Neon outline, holographic hover, audible focus. */
export function NeonButton({
  children,
  onClick,
  variant = 'primary',
  disabled,
  autoFocus,
  className = '',
}: NeonButtonProps) {
  return (
    <motion.button
      type="button"
      autoFocus={autoFocus}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      onFocus={() => Audio.uiMove()}
      onMouseEnter={() => Audio.uiMove()}
      onClick={() => {
        Audio.init();
        Audio.uiSelect();
        onClick();
      }}
      className={`block w-full border bg-void-2/40 px-6 py-3 font-display text-sm font-semibold tracking-[0.25em] uppercase backdrop-blur-sm transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-30 ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
}
