import arrayShuffle from 'array-shuffle';
import { Ion } from '../../services/data.models';
import { tierOf } from '../charges/charges.logic';

export const IONS_PER_GAME = 10;
export const TIER_COUNTS = [3, 3, 2, 2];  // ions tirés par palier, du plus simple au plus corsé
export const MAX_TILT = 3;                // inclinaison max des cartes, en degrés

export interface Proposition {
  name: string;
  css: string;
  tilt: number;
}

export interface TrivionItem extends Ion {
  tier: number;
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

export function buildPropositions(ion: Ion): Proposition[] {
  return arrayShuffle([...ion.wrongNames, ion.name]).map(name => ({
    name,
    css: '',
    tilt: Math.round((Math.random() * 2 - 1) * MAX_TILT * 10) / 10
  }));
}

export function drawGame(cations: Ion[], anions: Ion[]): TrivionItem[] {
  const pool = [...cations, ...anions];
  const draw: TrivionItem[] = [];
  TIER_COUNTS.forEach((count, i) => {
    const tier = i + 1;
    arrayShuffle(pool.filter(ion => trivionTier(ion) === tier))
      .slice(0, count)
      .forEach(ion => draw.push({ ...ion, tier, propositions: buildPropositions(ion) }));
  });
  return draw;
}
