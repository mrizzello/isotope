import arrayShuffle from 'array-shuffle';
import { Ion } from '../../services/data.models';
import { tierOf } from '../charges/charges.logic';

export const IONS_PER_GAME = 10;
export const TIER_COUNTS = [3, 3, 2, 2];  // ions tirés par palier, du plus simple au plus corsé
export const MAX_TILT = 3;                // inclinaison max des cartes, en degrés

// positions en % de la table ; l'ion est au centre
export const ION_POSITION = { x: 50, y: 50 };
const LEFT = 33;
const RIGHT = 67;
const TOP_HIGH = 10, TOP_LOW = 28;        // moitié haute : position haute / basse
const BOTTOM_HIGH = 72, BOTTOM_LOW = 90;  // moitié basse : position haute / basse

export interface Position {
  x: number;
  y: number;
}

// 4 formes de molécule : dans chaque moitié, une carte à gauche et une à droite,
// l'une en position haute et l'autre en position basse (jamais à la même hauteur, donc pas de chevauchement)
export const LAYOUTS: Position[][] = [false, true].flatMap(topLeftHigh => [false, true].map(bottomLeftHigh => [
  { x: LEFT, y: topLeftHigh ? TOP_HIGH : TOP_LOW },
  { x: RIGHT, y: topLeftHigh ? TOP_LOW : TOP_HIGH },
  { x: LEFT, y: bottomLeftHigh ? BOTTOM_HIGH : BOTTOM_LOW },
  { x: RIGHT, y: bottomLeftHigh ? BOTTOM_LOW : BOTTOM_HIGH }
]));

export interface Proposition extends Position {
  name: string;
  css: string;
  tilt: number;
}

export interface TrivionItem extends Ion {
  tier: number;
  layout: number;
  propositions: Proposition[];
}

// métaux de transition : leur nom porte la charge en chiffres romains, p. ex. « cation fer (III) »
export function isTransitionMetal(ion: Ion): boolean {
  return /\([IVX]+\)/.test(ion.name);
}

// mêmes paliers que Charges, les métaux de transition rejoignant le dernier
export function trivionTier(ion: Ion): number {
  return isTransitionMetal(ion) ? 4 : tierOf(ion);
}

// tire une forme différente de la précédente
export function pickLayout(previous: number = -1): number {
  const choices = LAYOUTS.map((_, i) => i).filter(i => i !== previous);
  return choices[Math.floor(Math.random() * choices.length)];
}

export function buildPropositions(ion: Ion, layout: number = pickLayout()): Proposition[] {
  return arrayShuffle([...ion.wrongNames, ion.name]).map((name, i) => ({
    name,
    css: '',
    tilt: Math.round((Math.random() * 2 - 1) * MAX_TILT * 10) / 10,
    ...LAYOUTS[layout][i]
  }));
}

export function drawGame(cations: Ion[], anions: Ion[]): TrivionItem[] {
  const pool = [...cations, ...anions];
  const draw: TrivionItem[] = [];
  let layout = -1;
  TIER_COUNTS.forEach((count, i) => {
    const tier = i + 1;
    arrayShuffle(pool.filter(ion => trivionTier(ion) === tier))
      .slice(0, count)
      .forEach(ion => {
        layout = pickLayout(layout);
        draw.push({ ...ion, tier, layout, propositions: buildPropositions(ion, layout) });
      });
  });
  return draw;
}
