import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface PanelProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

/** Holographic glass panel with corner brackets — the menu chrome. */
export function Panel({ children, title, className = '' }: PanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={`relative border border-ion/20 bg-void-2/70 p-6 backdrop-blur-md ${className}`}
    >
      {/* Corner brackets */}
      <span aria-hidden className="absolute -top-px -left-px h-4 w-4 border-t-2 border-l-2 border-ion" />
      <span aria-hidden className="absolute -top-px -right-px h-4 w-4 border-t-2 border-r-2 border-ion" />
      <span aria-hidden className="absolute -bottom-px -left-px h-4 w-4 border-b-2 border-l-2 border-ion" />
      <span aria-hidden className="absolute -right-px -bottom-px h-4 w-4 border-r-2 border-b-2 border-ion" />
      {title && (
        <h2 className="neon-text mb-5 text-center font-display text-lg font-bold tracking-[0.4em] text-ion uppercase">
          {title}
        </h2>
      )}
      {children}
    </motion.div>
  );
}
