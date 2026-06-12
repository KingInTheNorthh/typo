import type { ColorblindMode } from '../types';

/**
 * In-game color roles. Colorblind modes remap the hues that carry meaning
 * (target vs. hostile vs. reward) to pairs that stay distinguishable.
 */
export interface GamePalette {
  target: string; // currently locked enemy + projectiles
  hostile: string; // enemy hulls / danger
  reward: string; // score popups, combo
  powerup: string; // pods, pickups
  warn: string; // errors, damage flashes
  shield: string;
}

export const PALETTES: Record<ColorblindMode, GamePalette> = {
  off: {
    target: '#4df3ff',
    hostile: '#ff5c8a',
    reward: '#ffc857',
    powerup: '#5dffb0',
    warn: '#ff3b3b',
    shield: '#5dffb0',
  },
  // Red-green deficiency → lean on blue vs. orange
  deuteranopia: {
    target: '#3da5ff',
    hostile: '#ffb000',
    reward: '#ffe14d',
    powerup: '#9fd4ff',
    warn: '#ff8c00',
    shield: '#7fb8ff',
  },
  // Blue-yellow deficiency → lean on cyan vs. red/pink
  tritanopia: {
    target: '#00e5d0',
    hostile: '#ff4d6d',
    reward: '#ff9ecb',
    powerup: '#7dffce',
    warn: '#ff2e4d',
    shield: '#7dffce',
  },
  // High-contrast monochrome
  mono: {
    target: '#ffffff',
    hostile: '#8a8fa8',
    reward: '#d7dbef',
    powerup: '#c4c9e0',
    warn: '#ffffff',
    shield: '#d7dbef',
  },
};
