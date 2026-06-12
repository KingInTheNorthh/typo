/**
 * Word pools grouped by difficulty tier (1 = trivial, 5 = brutal).
 * All lowercase a–z, no punctuation, so the input system stays simple.
 *
 * Flavour mix: spacefaring nouns + the kind of whimsical working-gerunds a
 * certain AI assistant shows while it thinks (noodling, percolating,
 * bamboozling, …). Tier bounds: 1→3–4, 2→5–6, 3→7–8, 4→9–11, 5→12+ letters.
 */

export const WORD_TIERS: readonly (readonly string[])[] = [
  // Tier 1 — 3–4 letters: scouts, missiles, early waves
  [
    'cat', 'sky', 'run', 'ion', 'arc', 'orb', 'ray', 'zap', 'jet', 'ash',
    'vex', 'hex', 'gun', 'fog', 'rim', 'tau', 'axe', 'lux', 'nyx', 'ohm',
    'pod', 'ram', 'bit', 'bot', 'cog', 'fin', 'gas', 'gem', 'hop', 'ink',
    'key', 'lab', 'map', 'net', 'oil', 'pin', 'rad', 'saw', 'tag', 'war',
    'wax', 'yaw', 'zen', 'zip', 'pew', 'pow', 'hum', 'orc', 'sun', 'tide',
    'nova', 'void', 'star', 'ship', 'warp', 'bolt', 'dusk', 'echo', 'flux',
    'grid', 'hawk', 'iris', 'kite', 'lens', 'mech', 'node', 'onyx', 'apex',
    'beam', 'core', 'dark', 'fire', 'glow', 'haze', 'mist', 'wing', 'zero',
    'jolt', 'zoom', 'bonk', 'zing', 'whiz', 'yeet', 'gear', 'atom', 'buzz',
    'byte', 'chip', 'code', 'data', 'dent', 'dive', 'volt', 'wisp', 'rift',
    'moon', 'mars', 'fizz', 'whir',
  ],
  // Tier 2 — 5–6 letters: frigates, splitters
  [
    'comet', 'plasma', 'photon', 'cosmos', 'nebula', 'vortex', 'binary',
    'cipher', 'signal', 'sensor', 'rocket', 'thrust', 'fusion', 'galaxy',
    'gamma', 'orbit', 'laser', 'drone', 'pulse', 'prism', 'quark', 'radar',
    'solar', 'sonic', 'surge', 'titan', 'alloy', 'armor', 'blast', 'cargo',
    'craft', 'delta', 'ember', 'flare', 'gauge', 'hyper', 'lunar', 'meteor',
    'module', 'oxygen', 'plume', 'rogue', 'shield', 'static', 'stream',
    'turret', 'vector', 'zenith', 'beacon', 'crater', 'anode', 'argon',
    'astro', 'aurora', 'cobalt', 'cosmic', 'crypto', 'decode', 'deploy',
    'dodge', 'drift', 'engine', 'filter', 'gimbal', 'glitch', 'hazard',
    'helium', 'intel', 'kelvin', 'launch', 'magnet', 'matrix', 'medkit',
    'nimbus', 'nozzle', 'outage', 'parsec', 'phaser', 'pixels', 'probe',
    'pylon', 'quartz', 'reboot', 'recoil', 'rumble', 'runway', 'salvo',
    'sentry', 'siege', 'spark', 'sprint', 'stasis', 'strike', 'tactic',
    'tether', 'torque', 'tracer', 'turbo', 'uplink', 'warden', 'widget',
    'zephyr', 'zigzag', 'zircon', 'typing', 'coding', 'musing', 'mixing',
    'gaming', 'zoning', 'vibing', 'cannon', 'klaxon', 'armory', 'gantry',
    'hangar', 'pulsar', 'poking', 'bleeps',
  ],
  // Tier 3 — 7–8 letters: snipers, mid-game
  [
    'monitor', 'quantum', 'gravity', 'horizon', 'neutron', 'particle',
    'asteroid', 'starship', 'override', 'protocol', 'reactor', 'stealth',
    'voyager', 'eclipse', 'impulse', 'inertia', 'machine', 'network',
    'payload', 'polarity', 'thermal', 'turbine', 'velocity', 'warhead',
    'antenna', 'capsule', 'circuit', 'console', 'docking', 'entropy',
    'fission', 'gateway', 'ignition', 'javelin', 'kinetic', 'magnetic',
    'nucleus', 'orbital', 'phantom', 'quasars', 'rampart', 'spectral',
    'tactics', 'vanguard', 'wormhole', 'momentum',
    // working-gerunds
    'noodling', 'brewing', 'scheming', 'plotting', 'spinning', 'whirring',
    'buzzing', 'clacking', 'drifting', 'floating', 'grokking', 'hacking',
    'juggling', 'mulling', 'priming', 'questing', 'smithing', 'zapping',
    'zipping', 'zooming', 'blasting', 'charging', 'cloaking', 'decoding',
    'evading', 'igniting', 'jamming', 'locking', 'orbiting', 'phasing',
    'piloting', 'scanning', 'strafing', 'warping', 'humming',
    // hardware & havoc
    'airlock', 'avionics', 'ballast', 'blaster', 'catalyst', 'chassis',
    'comlink', 'corsair', 'cruiser', 'cryopod', 'deflect', 'dogfight',
    'drifter', 'evasion', 'exhaust', 'fighter', 'flagship', 'frigate',
    'gunship', 'jetpack', 'jettison', 'lockdown', 'maneuver', 'megabyte',
    'missile', 'modular', 'nebulae', 'outpost', 'overload', 'paradox',
    'radiator', 'redshift', 'runtime', 'sabotage', 'scanner', 'shutdown',
    'skirmish', 'starbase', 'stardust', 'starfall', 'strategy', 'terminal',
    'thruster', 'torpedo', 'tractor', 'trooper', 'vaporize', 'warpgate',
    'wingman', 'blockade', 'quadrant', 'holodeck',
  ],
  // Tier 4 — 9–11 letters: tanks, late-game
  [
    'supernova', 'spacecraft', 'atmosphere', 'navigation', 'propulsion',
    'telemetry', 'trajectory', 'dimension', 'frequency', 'generator',
    'hyperdrive', 'ionosphere', 'lightspeed', 'magnetism', 'mainframe',
    'overdrive', 'processor', 'refraction', 'resonance', 'satellite',
    'simulation', 'threshold', 'turbulence', 'wavelength', 'singularity',
    'gravitation', 'calibration', 'hypersonic', 'antimatter', 'cosmonaut',
    'deflector', 'evacuation', 'gyroscope', 'hibernation', 'insurgent',
    'juggernaut', 'leviathan', 'obliterate', 'perihelion',
    // working-gerunds
    'pondering', 'tinkering', 'wrangling', 'launching', 'thrusting',
    'percolating', 'marinating', 'ruminating', 'cogitating', 'finagling',
    'summoning', 'conjuring', 'navigating', 'calibrating', 'simulating',
    'assembling', 'recharging', 'respawning', 'retreating', 'descending',
    'ascending', 'detonating', 'harvesting', 'optimizing', 'overriding',
    'processing', 'rendering', 'uploading', 'validating', 'refactoring',
    'bamboozling',
    // deep-space vocabulary
    'aberration', 'barricade', 'bombardment', 'coordinates', 'countdown',
    'criticality', 'deflection', 'detonation', 'diagnostics', 'escalation',
    'excavation', 'expedition', 'fabricator', 'flightpath', 'formation',
    'fortitude', 'gravimeter', 'hyperspace', 'hyperjump', 'illuminate',
    'insurgency', 'interceptor', 'ionization', 'longitude', 'machinery',
    'magnitude', 'mothership', 'nightfall', 'obfuscate', 'oscillator',
    'perimeter', 'planetfall', 'projectile', 'radiation', 'revolution',
    'shockwave', 'spacedock', 'starfield', 'stargazer', 'stronghold',
    'technician', 'termination', 'wavefront', 'photosphere',
  ],
  // Tier 5 — 12+ letters: bosses, deep endless
  [
    'synchronization', 'architecture', 'transmission', 'acceleration',
    'amplification', 'astrophysics', 'bioluminescent', 'circumnavigate',
    'classification', 'communication', 'configuration', 'constellation',
    'countermeasure', 'crystallization', 'decompression', 'disintegration',
    'electromagnetic', 'extraterrestrial', 'gravitational', 'infrastructure',
    'interstellar', 'magnetosphere', 'microprocessor', 'nanotechnology',
    'photosynthesis', 'quantification', 'reconnaissance', 'superconductor',
    'teleportation', 'terraforming', 'thermodynamics', 'instantaneous',
    // working-gerunds, maximum effort
    'reticulating', 'strategizing', 'whatchamacallit', 'discombobulating',
    'procrastinating', 'philosophizing', 'recalibrating', 'reconfiguring',
    'synthesizing', 'transmogrifying', 'triangulating', 'extrapolating',
    'interpolating', 'materializing', 'orchestrating', 'bootstrapping',
    'parallelizing', 'defragmenting', 'authenticating', 'benchmarking',
    'multithreading', 'hyperventilating',
    // heavy ordnance
    'intergalactic', 'thermonuclear', 'electrostatic', 'bioengineering',
    'cybersecurity', 'experimentation', 'miscalculation', 'nanofabrication',
    'weightlessness', 'interplanetary', 'circumstellar', 'supermassive',
    'spectrometer', 'quintessential',
  ],
] as const;

/** Clamp a tier index into the valid 1..5 range. */
export const clampTier = (tier: number): number => Math.min(5, Math.max(1, Math.round(tier)));

/** Pick a word from a tier using the supplied RNG (0..1). */
export function pickWord(tier: number, rand: () => number): string {
  const pool = WORD_TIERS[clampTier(tier) - 1];
  return pool[Math.floor(rand() * pool.length)];
}
