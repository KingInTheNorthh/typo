import { animate, motion, useMotionValue } from 'framer-motion';
import { useEffect, useMemo, useRef } from 'react';
import { useGame } from '../../state/gameStore';
import { useSettings } from '../../state/settingsStore';

const GITHUB_URL = 'https://github.com/KingInTheNorthh';

/** px/sec the crawl travels — movie-credits slow. */
const CRAWL_SPEED = 36;

/** The canonical opening-crawl yellow. */
const SW_YELLOW = '#ffe81f';

function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

/** The roll content — shared between the animated crawl and the reduced-motion fallback. */
function CreditsContent() {
  return (
    <div className="space-y-20 text-center" style={{ color: SW_YELLOW }}>
      <div>
        <p className="mb-4 font-display text-xl tracking-[0.3em] sm:text-2xl" style={{ color: '#8fa3ff' }}>
          A long time typing, in a terminal far, far away....
        </p>
        <h2 className="font-display text-6xl font-bold tracking-[0.22em] sm:text-7xl">
          GLYPH<span className="opacity-70">WARS</span>
        </h2>
        <p className="mt-4 font-display text-lg tracking-[0.45em] uppercase opacity-80">by Skywalker</p>
      </div>

      {/* Movie-crawl body: big, bold, justified */}
      <p className="mx-auto max-w-xl text-justify font-display text-3xl leading-[1.45] font-semibold sm:text-4xl sm:leading-[1.45]">
        inspired by space fighting and floating paragraphs, I made this game, for you. I hope you
        enjoy it with every blasted foe and every keystroke. you're the best.
        <span className="mt-8 block text-right">--Skywalker</span>
      </p>

      <div className="space-y-12">
        {(
          [
            ['design · code · everything', 'Skywalker'],
            ['sound & music', 'synthesized live, no samples were harmed'],
            ['typography', 'Chakra Petch · IBM Plex Mono'],
            ['special thanks', 'you, for every keystroke'],
          ] as const
        ).map(([role, name]) => (
          <div key={role}>
            <div className="font-display text-sm tracking-[0.45em] uppercase opacity-60">{role}</div>
            <div className="mt-2 font-display text-2xl font-semibold tracking-[0.12em] sm:text-3xl">{name}</div>
          </div>
        ))}
      </div>

      <div className="pt-6">
        <div className="mb-4 font-display text-sm tracking-[0.45em] uppercase opacity-60">
          check me out on github
        </div>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-3 border px-6 py-3.5 transition-all hover:brightness-125"
          style={{ borderColor: `${SW_YELLOW}55`, color: SW_YELLOW }}
        >
          <GithubMark className="h-8 w-8" />
          <span className="font-mono text-base tracking-wider">github.com/KingInTheNorthh</span>
        </a>
      </div>
    </div>
  );
}

/**
 * End-of-movie credits roll: a Star Wars-style crawl drifting up into space.
 * Reduced-motion mode swaps the crawl for a plain scrollable page.
 */
export function CreditsScreen() {
  const setScreen = useGame((s) => s.setScreen);
  const reduced = useSettings((s) => s.reducedMotion);
  const contentRef = useRef<HTMLDivElement>(null);
  const startY = useRef(typeof window === 'undefined' ? 800 : window.innerHeight).current;
  const y = useMotionValue(startY);

  // Esc returns to the menu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setScreen('menu');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setScreen]);

  // Send the roll up from below the screen toward a far overshoot target,
  // and stop it the moment its *projected* bottom edge (after the rotateX +
  // perspective foreshortening) reaches the resting line. Computing the stop
  // from offsetHeight alone undershoots badly on tall windows, because the
  // tilt compresses on-screen travel the further the text recedes.
  useEffect(() => {
    if (reduced) return;
    const el = contentRef.current;
    if (!el) return;
    const target = -(el.offsetHeight + window.innerHeight * 2); // generous overshoot
    const controls = animate(y, target, {
      duration: (startY - target) / CRAWL_SPEED,
      ease: 'linear',
    });
    let raf = requestAnimationFrame(function check() {
      // getBoundingClientRect is post-transform, i.e. what the eye sees
      if (el.getBoundingClientRect().bottom <= window.innerHeight * 0.6) {
        controls.stop();
      } else {
        raf = requestAnimationFrame(check);
      }
    });
    return () => {
      controls.stop();
      cancelAnimationFrame(raf);
    };
  }, [reduced, startY, y]);

  // A modest fixed starfield — the game canvas isn't mounted here.
  const stars = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() < 0.85 ? 1 : 2,
        opacity: 0.25 + Math.random() * 0.65,
      })),
    [],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 overflow-hidden bg-[radial-gradient(ellipse_at_50%_120%,#10102a_0%,#03030c_60%)]"
    >
      {stars.map((s) => (
        <span
          key={s.id}
          aria-hidden
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
          }}
        />
      ))}

      {reduced ? (
        <div className="absolute inset-0 overflow-y-auto px-4 py-16 scroll-thin">
          <div className="mx-auto w-[min(640px,90vw)]">
            <CreditsContent />
          </div>
        </div>
      ) : (
        <div className="absolute inset-0" style={{ perspective: '420px' }}>
          <div
            className="absolute inset-0 flex justify-center"
            style={{ transform: 'rotateX(18deg)', transformOrigin: '50% 100%' }}
          >
            {/* self-start: without it the flex row stretches this item to the
                container height and the roll content overflows its own box,
                breaking both offsetHeight and the rect-based stop check */}
            <motion.div ref={contentRef} style={{ y }} className="w-[min(640px,86vw)] self-start">
              <CreditsContent />
            </motion.div>
          </div>
          {/* Cinematic fade into deep space at the top */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#03030c] to-transparent" />
        </div>
      )}

      <button
        type="button"
        autoFocus
        onClick={() => setScreen('menu')}
        className="absolute right-5 bottom-5 border border-ghost/30 bg-void/60 px-4 py-2 font-mono text-[11px] tracking-[0.3em] text-ghost uppercase backdrop-blur-sm transition-colors hover:border-ion hover:text-ion"
      >
        back · esc
      </button>
    </motion.div>
  );
}
