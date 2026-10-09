import arrayShuffle from 'array-shuffle';
import { Ion } from '../../services/data.models';

export const IONS_PER_GAME = 10;
export const TIER_COUNTS = [3, 3, 2, 2];  // ions tirés par palier, du plus simple au plus corsé
export const PENALTY_MS = 3000;           // pénalité de temps par erreur
export const ALL_CHARGES = ['3+', '2+', '+', '–', '2–', '3–'];
export const PROPOSITIONS = 4;

// palier 1 = monoatomiques (déduits du tableau périodique), palier 3 = tous les autres polyatomiques
const TIER_2 = ['NH4', 'H3O', 'NO3', 'SO4', 'CO3', 'PO4', 'CN'];
const TIER_4 = ['Cr2O7', 'CrO4', 'S2O3', 'CH3COO', 'HCOO'];

export interface Proposition {
  charge: string;
  css: string;
}

export interface ChargesItem extends Ion {
  tier: number;
  propositions: Proposition[];
}

export function plainSymbol(symbol: string): string {
  return symbol.replace(/<[^>]+>/g, '');
}

export function tierOf(ion: Ion): number {
  const s = plainSymbol(ion.symbol);
  if (/^[A-Z][a-z]?$/.test(s)) return 1;
  if (TIER_2.includes(s)) return 2;
  if (TIER_4.includes(s)) return 4;
  return 3;
}

// exclut les métaux de transition : leur nom porte la charge en chiffres romains, p. ex. « cation fer (III) »
export function filterCations(cations: Ion[]): Ion[] {
  const regex = /\([A-Z]+\)/i;
  return cations.filter(cation => !regex.test(cation.name));
}

export function buildPropositions(correct: string): Proposition[] {
  const others = arrayShuffle(ALL_CHARGES.filter(c => c !== correct)).slice(0, PROPOSITIONS - 1);
  return arrayShuffle([correct, ...others]).map(charge => ({ charge, css: '' }));
}

export function drawGame(cations: Ion[], anions: Ion[]): ChargesItem[] {
  const pool = [...filterCations(cations), ...anions];
  const draw: ChargesItem[] = [];
  TIER_COUNTS.forEach((count, i) => {
    const tier = i + 1;
    arrayShuffle(pool.filter(ion => tierOf(ion) === tier))
      .slice(0, count)
      .forEach(ion => draw.push({ ...ion, tier, propositions: buildPropositions(ion.charge) }));
  });
  return draw;
}

// couleur de la batterie : rouge (vide) → orange → jaune → vert (pleine)
export function batteryColor(level: number): string {
  const hue = Math.round(120 * Math.min(Math.max(level, 0), IONS_PER_GAME) / IONS_PER_GAME);
  return `hsl(${hue}, 70%, 55%)`;
}

export function formulaSizeClass(symbol: string): string {
  const length = plainSymbol(symbol).length;
  if (length <= 2) return 'xl';
  if (length <= 4) return 'l';
  return 'm';
}
