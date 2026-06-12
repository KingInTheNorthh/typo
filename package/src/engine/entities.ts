import type { EnemyKind, PowerUpType } from '../types';

/** A typeable thing on screen: hostile ship, missile, boss or power-up pod. */
export interface Enemy {
  id: number;
  kind: EnemyKind;
  word: string;
  /** How many leading characters have been shot off. */
  typed: number;
  x: number;
  y: number;
  /** Anchor for horizontal sine sway. */
  baseX: number;
  /** Straight-line velocity (used by missiles instead of sway/descent). */
  vx: number;
  vy: number;
  speed: number;
  swayAmp: number;
  swayFreq: number;
  phase: number;
  size: number;
  damage: number;
  bounty: number;
  state: 'descend' | 'hold';
  holdY: number;
  fireTimer: number;
  /** Hit-flash intensity, decays to 0. */
  flash: number;
  /** Knockback offset applied on hits, eases back to 0. */
  knock: number;
  /** Word completed — no longer a threat, dies when the last projectile lands. */
  doomed: boolean;
  /** Seconds alive (drives sway). */
  time: number;
  /** Boss only: remaining word segments after the current one. */
  segments: string[];
  /** Pods only: which power-up this capsule carries. */
  power: PowerUpType | null;
}

export interface Projectile {
  x: number;
  y: number;
  targetId: number;
  speed: number;
  /** This shot carries the killing blow for its target. */
  last: boolean;
  color: string;
  /** Recent positions for the motion trail. */
  trail: Array<{ x: number; y: number }>;
  dead: boolean;
  /** Fallback direction if the target despawns mid-flight. */
  dirX: number;
  dirY: number;
}
