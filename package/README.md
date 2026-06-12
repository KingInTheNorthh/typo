# GLYPHWARS

A neon typing shooter for the browser. Enemy ships descend with words above them —
type the word to lock on, every keystroke fires an energy bolt, finish the word to
destroy the ship. Inspired by Z-Type; styled like a synthwave fever dream.

![stack](https://img.shields.io/badge/stack-React%2019%20%C2%B7%20TypeScript%20%C2%B7%20Vite%20%C2%B7%20Canvas%20%C2%B7%20Zustand%20%C2%B7%20Framer%20Motion%20%C2%B7%20Tailwind%204-4df3ff)

## Quick start

```bash
npm install
npm run dev      # → http://localhost:5173
npm run build    # type-checks + production bundle in dist/
npm run preview  # serve the production build
```

No assets to download — all graphics are procedural canvas vectors and every
sound (including the escalating soundtrack) is synthesized live with the Web
Audio API.

## How to play

| Input | Action |
| --- | --- |
| `a–z` | First letter locks the nearest matching enemy; further letters keep firing |
| `1` `2` `3` | Deploy a banked power-up |
| `Esc` | Pause / resume |
| `Enter` | Quick restart on the game-over screen |

Mistakes break your combo, briefly overheat your weapon, and make the targeted
enemy angrier (faster). Pods drift down with short words — type them to bank
**EMP**, **Overclock**, **Aegis Shield**, **Time Warp** or **Multishot**.

Every 5th wave is a boss with multiple word segments and missile volleys.
Wave 10 opens the procedurally scaled **endless sector**. The **Daily
Challenge** uses a date-seeded RNG so everyone fights the same run.

## Architecture

```
src/
├── config/          # Pure data: word tiers, enemy tuning, power-ups,
│                    # achievements, skins, difficulty presets, palettes
├── state/           # Zustand stores
│   ├── gameStore    # UI snapshot of the live run (engine → React, throttled)
│   ├── settingsStore# Persisted options (audio, accessibility, difficulty)
│   └── metaStore    # Persisted leaderboard, lifetime stats, unlocks
├── engine/          # The simulation — no React in here
│   ├── GameEngine   # rAF loop, input, combat, power-ups, rendering
│   ├── waves        # Wave director: announce → spawn → clear → next
│   ├── entities     # Enemy / projectile data shapes
│   ├── render       # Vector ship art + word labels
│   ├── particles    # Sparks, explosions, shockwaves, floating text
│   ├── starfield    # Parallax stars + offscreen-rendered nebula
│   ├── sprites      # Cached radial-gradient glow sprites (the "bloom")
│   └── rng          # mulberry32 + daily-challenge seeding
├── audio/           # Web Audio synth: SFX + generative intensity-driven music
└── components/      # React: HUD, wave banner, menus, overlays
```

**Design notes**

- The engine owns the 60 fps hot path; React only re-renders from ~11 Hz
  store snapshots, so the HUD never causes frame drops.
- Glow/bloom is done with pre-rendered radial-gradient sprites composited in
  `lighter` (additive) mode — `shadowBlur` is never used in the frame loop.
- Sniper shots and boss volleys are themselves typeable missiles, so every
  threat on screen is answered the same way: type at it.
- Accessibility: colorblind palettes (deuteranopia / tritanopia / mono),
  reduced-motion mode (kills screen shake, halves particles, disables the
  scanline overlay), 4 word-size steps, and full keyboard-only navigation.

## Deploying to Vercel

The app lives in the `package/` subdirectory of the repo, so the only
non-default setting is the root directory.

**Via the dashboard:** import `KingInTheNorthh/typo` at
[vercel.com/new](https://vercel.com/new), set **Root Directory** to
`package`, and deploy — the Vite preset handles the rest
(`npm run build` → `dist/`).

**Via the CLI:**

```bash
npm i -g vercel
cd package
vercel        # preview deploy
vercel --prod # production
```

`vercel.json` adds an SPA rewrite and immutable caching for hashed assets.
There are no environment variables, databases or APIs — it's a fully static
build; scores and settings persist in the player's localStorage.

## Tuning

All balance lives in `src/config/` — word pools per tier, per-enemy speed and
damage, spawn weights and unlock waves, difficulty presets. The wave curve
(spawn interval, concurrency cap, queue size) is in `src/engine/waves.ts`.
