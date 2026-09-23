import { Family } from '../../services/data.models';

// les 5 bacs, dans l'ordre d'affichage ; value = champ `type` de family.json
export const BINS: { label: string; value: string }[] = [
  { label: 'Hydracide', value: 'hydracide' },
  { label: 'Sel', value: 'sel' },
  { label: 'Oxyde', value: 'oxyde' },
  { label: 'Hydroxyde', value: 'hydroxyde' },
  { label: 'Oxacide', value: 'oxacide' }
];

export const GAME_DURATION = 60;          // s, mode sprint
export const LANES = 4;                   // couloirs de chute
export const LANE_CLEARANCE = 0.25;       // un couloir est libre quand sa dernière molécule a parcouru 25 % de la chute
export const FAST_ANSWER_DELAY = 3;       // s max entre deux bonnes réponses pour qu'elles comptent comme « rapides »
export const FAST_STREAK_STEP = 5;        // réponses rapides consécutives pour gagner un cran de multiplicateur
export const MAX_MULTIPLIER = 3;
export const POINTS_PER_LEVEL = 10;
export const SPECIAL_CHANCE = 0.1;
export const SPECIAL_SPEED_FACTOR = 1.6;
export const SPECIAL_BONUS = 5;           // bonus plat de la surcharge
export const BIN_DISABLED_DURATION = 1;   // s
export const HINT_DURATION = 0.8;         // s, le bon bac clignote après une erreur
export const GOOD_FLASH_DURATION = 0.3;   // s

// vitesse en fraction de la hauteur de chute par seconde (1 = traverse la zone en 1 s)
const BASE_SPEED = 0.12;
const SPEED_STEP = 0.02;
const MAX_SPEED = 0.35;

// délai entre deux apparitions, en secondes
const BASE_SPAWN_DELAY = 1.8;
const SPAWN_DELAY_STEP = 0.15;
const MIN_SPAWN_DELAY = 0.7;

export interface FallingMolecule {
  id: number;
  compound: Family;
  lane: number;
  y: number;       // 0 = haut de la zone, 1 = touche le sol
  special: boolean;
}

export interface ComboState {
  score: number;
  combo: number;          // bonnes réponses consécutives
  bestCombo: number;
  multiplier: number;
  fastStreak: number;     // bonnes réponses rapides consécutives depuis le dernier cran
  lastCorrectAt: number;  // temps de jeu de la dernière bonne réponse
}

export function initialComboState(): ComboState {
  return { score: 0, combo: 0, bestCombo: 0, multiplier: 1, fastStreak: 0, lastCorrectAt: -Infinity };
}

export function levelFor(score: number): number {
  return Math.floor(score / POINTS_PER_LEVEL);
}

export function fallSpeed(level: number): number {
  return Math.min(MAX_SPEED, BASE_SPEED + level * SPEED_STEP);
}

export function spawnDelay(level: number): number {
  return Math.max(MIN_SPAWN_DELAY, BASE_SPAWN_DELAY - level * SPAWN_DELAY_STEP);
}

// tirage équilibré : d'abord une famille (1 chance sur 5), puis un composé de cette famille,
// sinon les sels (41 composés) écraseraient les hydracides (6 composés)
export function drawCompound(compounds: Family[], exclude: string[] = [], rng: () => number = Math.random): Family {
  const family = BINS[Math.floor(rng() * BINS.length)].value;
  const inFamily = compounds.filter((c) => c.type === family);
  const candidates = inFamily.filter((c) => !exclude.includes(c.formule));
  const pool = candidates.length ? candidates : inFamily.length ? inFamily : compounds;
  return pool[Math.floor(rng() * pool.length)];
}

// couloir libre au hasard, ou -1 si tous sont encore occupés près du haut
export function freeLane(molecules: FallingMolecule[], rng: () => number = Math.random): number {
  const free: number[] = [];
  for (let lane = 0; lane < LANES; lane++) {
    if (!molecules.some((m) => m.lane === lane && m.y < LANE_CLEARANCE)) {
      free.push(lane);
    }
  }
  return free.length ? free[Math.floor(rng() * free.length)] : -1;
}

export function applyCorrect(state: ComboState, now: number, special: boolean): ComboState {
  const next = { ...state };
  next.score += next.multiplier + (special ? SPECIAL_BONUS : 0);
  next.combo++;
  next.bestCombo = Math.max(next.bestCombo, next.combo);
  const fast = now - state.lastCorrectAt <= FAST_ANSWER_DELAY;
  next.fastStreak = fast ? next.fastStreak + 1 : 1;
  if (next.fastStreak >= FAST_STREAK_STEP) {
    next.fastStreak = 0;
    next.multiplier = Math.min(MAX_MULTIPLIER, next.multiplier + 1);
  }
  next.lastCorrectAt = now;
  return next;
}

// mauvais bac : combo et multiplicateur retombent
export function applyWrong(state: ComboState): ComboState {
  return { ...state, combo: 0, multiplier: 1, fastStreak: 0, lastCorrectAt: -Infinity };
}

// molécule tombée au sol : seul le combo est réinitialisé
export function applyMissed(state: ComboState): ComboState {
  return { ...state, combo: 0, fastStreak: 0, lastCorrectAt: -Infinity };
}
