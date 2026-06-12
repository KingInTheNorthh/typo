import type { ShipSkin } from '../types';

export const SHIP_SKINS: ShipSkin[] = [
  {
    id: 'aurora',
    name: 'AURORA',
    desc: 'Standard-issue interceptor. Reliable ion trim.',
    hullColor: '#dfe7ff',
    trimColor: '#4df3ff',
    engineColor: '#4df3ff',
    unlock: null,
  },
  {
    id: 'ember',
    name: 'EMBER',
    desc: 'Salvaged from the Crimson Fleet. Runs hot.',
    hullColor: '#ffd9c2',
    trimColor: '#ff5c8a',
    engineColor: '#ff8a4d',
    unlock: { type: 'score', value: 25_000 },
  },
  {
    id: 'verdant',
    name: 'VERDANT',
    desc: 'Bioluminescent alloy hull. Awarded for flawless flying.',
    hullColor: '#d8ffe9',
    trimColor: '#5dffb0',
    engineColor: '#5dffb0',
    unlock: { type: 'achievement', value: 'perfect-wave' },
  },
  {
    id: 'phantom',
    name: 'PHANTOM',
    desc: 'Spectral stealth frame. Earned in the deep sectors.',
    hullColor: '#cfc3ff',
    trimColor: '#8b5cf6',
    engineColor: '#b18cff',
    unlock: { type: 'achievement', value: 'wave-10' },
  },
  {
    id: 'solaris',
    name: 'SOLARIS',
    desc: 'Gold-plated boss-killer. For titans only.',
    hullColor: '#fff2cf',
    trimColor: '#ffc857',
    engineColor: '#ffc857',
    unlock: { type: 'achievement', value: 'boss-slayer' },
  },
];

export const getSkin = (id: string): ShipSkin =>
  SHIP_SKINS.find((s) => s.id === id) ?? SHIP_SKINS[0];
