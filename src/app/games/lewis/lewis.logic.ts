import arrayShuffle from 'array-shuffle';
import { Lewis } from '../../services/data.models';

export const ELEMENTS_PER_GAME = 8;
export const TIER_COUNTS = [3, 3, 2];  // éléments tirés par palier, du plus simple au plus corsé
export const PENALTY_MS = 3000;        // pénalité de temps par erreur
export const PROPOSITIONS = 8;         // structures de 1 à 8 électrons de valence
export const RING_RADIUS = 118;        // distance des propositions au centre (viewBox 310 × 310)

export interface Proposition {
  n: number;
  correct: boolean;
  x: number;
  y: number;
  css: string;
}

export interface LewisItem extends Lewis {
  tier: number;
  propositions: Proposition[];
}

// palier 1 = groupes I–III (électrons seuls), 2 = IV–V, 3 = VI–VIII (plusieurs doublets)
export function tierOf(element: Lewis): number {
  if (element.col <= 3) return 1;
  if (element.col <= 5) return 2;
  return 3;
}

// les 8 structures mélangées, réparties sur le cercle autour de l'élément
export function buildPropositions(col: number): Proposition[] {
  const values = arrayShuffle(Array.from({ length: PROPOSITIONS }, (_, i) => i + 1));
  return values.map((n, i) => {
    const radians = i * 2 * Math.PI / PROPOSITIONS;
    return {
      n,
      correct: n === col,
      x: Math.round(Math.cos(radians) * RING_RADIUS),
      y: Math.round(Math.sin(radians) * RING_RADIUS),
      css: ''
    };
  });
}

export function drawGame(structures: Lewis[]): LewisItem[] {
  const draw: LewisItem[] = [];
  TIER_COUNTS.forEach((count, i) => {
    const tier = i + 1;
    arrayShuffle(structures.filter(el => tierOf(el) === tier))
      .slice(0, count)
      .forEach(el => draw.push({ ...el, tier, propositions: buildPropositions(el.col) }));
  });
  return draw;
}
