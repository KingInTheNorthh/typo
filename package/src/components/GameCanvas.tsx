import { useEffect, useRef } from 'react';
import { Engine } from '../engine/GameEngine';
import { useGame } from '../state/gameStore';

/**
 * Hosts the canvas and hands it to the engine. The engine owns the rAF loop
 * and input; this component only manages mount/unmount and run start.
 */
export function GameCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const mode = useGame((s) => s.mode);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    Engine.attach(canvas);
    Engine.startRun(mode);
    // Dev-only debug handle (used by smoke tests / console poking)
    if (import.meta.env.DEV) {
      (window as unknown as Record<string, unknown>).__GLYPHWARS_ENGINE = Engine;
    }
    return () => Engine.detach();
  }, [mode]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
}
