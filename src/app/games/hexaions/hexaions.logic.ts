import { HexaIon, HexaIons } from '../../services/data.models';

export type PlayerId = 'human' | 'algo';

// Paramètres du jeu (en dur)
// Rayon par défaut, avant le choix de taille sur l'écran d'introduction
// (Grille L = rayon 2 → 19 cases, Grille XL = rayon 3 → 37 cases)
export const GRID_RADIUS = 3;
export const HEX_SIZE = 30; // rayon d'un hexagone en unités SVG
export const MAX_MOLECULE_SIZE = 8; // taille maximale d'une molécule recherchée

export interface SymbolSegment {
  text: string;
  kind: 'normal' | 'sub' | 'sup';
  dy?: number; // décalage vertical relatif au tspan précédent
  fontSize?: number;
}

export interface HexTile {
  ion: HexaIon;
  charge: number; // charge signée, p. ex. "2–" → -2
  species: string; // identifiant d'espèce, p. ex. "Fe|3+"
  segments: SymbolSegment[]; // symbole + charge, prêts pour des <tspan>
  fontSize: number;
}

export interface HexCell {
  q: number;
  r: number;
  x: number;
  y: number;
  corners: string; // points du polygone SVG
  tile: HexTile | null;
  frozenBy: PlayerId | null;
}

// "2+" → 2, "+" → 1, "3–" → -3, "–" → -1
export function parseCharge(charge: string): number {
  const value = parseInt(charge, 10) || 1;
  return charge.includes('+') ? value : -value;
}

// "S<sub>2</sub>O<sub>3</sub>" → segments normal/sub
export function parseSymbol(symbol: string): SymbolSegment[] {
  const segments: SymbolSegment[] = [];
  const regex = /<sub>(.*?)<\/sub>|([^<]+)/g;
  let match;
  while ((match = regex.exec(symbol)) !== null) {
    if (match[1] !== undefined) {
      segments.push({ text: match[1], kind: 'sub' });
    } else {
      segments.push({ text: match[2], kind: 'normal' });
    }
  }
  return segments;
}

export function makeTile(ion: HexaIon): HexTile {
  const segments = parseSymbol(ion.symbol);
  segments.push({ text: ion.charge, kind: 'sup' });
  const length = segments.reduce((sum, s) => sum + s.text.length, 0);
  const fontSize = length <= 3 ? 15 : length <= 6 ? 12 : 9;

  // dy est cumulatif d'un tspan au suivant : chaque segment compense le
  // décalage du précédent pour atteindre sa propre ligne de base.
  let offset = 0;
  segments.forEach((segment) => {
    const target = segment.kind === 'sub' ? fontSize * 0.25
      : segment.kind === 'sup' ? -fontSize * 0.45 : 0;
    segment.dy = target - offset;
    offset = target;
    segment.fontSize = segment.kind === 'normal' ? fontSize : fontSize * 0.7;
  });

  return {
    ion,
    charge: parseCharge(ion.charge),
    species: ion.symbol + '|' + ion.charge,
    segments,
    fontSize
  };
}

// Pondération du tirage par valence : les monovalents sortent plus souvent
// que les divalents, eux-mêmes plus souvent que les trivalents.
const VALENCE_WEIGHTS: Record<number, number> = { 1: 3, 2: 2, 3: 1 };

function weightedPick(pool: HexaIon[]): HexaIon {
  const weights = pool.map((ion) => VALENCE_WEIGHTS[Math.abs(parseCharge(ion.charge))] ?? 1);
  const total = weights.reduce((sum, w) => sum + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r < 0) {
      return pool[i];
    }
  }
  return pool[pool.length - 1];
}

// Tirage en deux temps : cation ou anion à 50/50 strict,
// puis pondération par valence à l'intérieur du côté choisi.
export function drawRandomIon(ions: HexaIons): HexaIon {
  const pool = Math.random() < 0.5 ? ions.cations : ions.anions;
  return weightedPick(pool);
}

function hexCorners(cx: number, cy: number, size: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30); // pointy-top
    const x = cx + size * Math.cos(angle);
    const y = cy + size * Math.sin(angle);
    points.push(x.toFixed(2) + ',' + y.toFixed(2));
  }
  return points.join(' ');
}

// Grille hexagonale en coordonnées axiales, cf. redblobgames.com/grids/hexagons
export function buildGrid(radius: number, size: number): HexCell[] {
  const cells: HexCell[] = [];
  for (let q = -radius; q <= radius; q++) {
    for (let r = Math.max(-radius, -q - radius); r <= Math.min(radius, -q + radius); r++) {
      const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
      const y = size * 1.5 * r;
      cells.push({ q, r, x, y, corners: hexCorners(x, y, size * 0.94), tile: null, frozenBy: null });
    }
  }
  return cells;
}

const DIRECTIONS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

export function neighborIndexes(cells: HexCell[], index: number): number[] {
  const cell = cells[index];
  const neighbors: number[] = [];
  DIRECTIONS.forEach(([dq, dr]) => {
    const found = cells.findIndex((c) => c.q === cell.q + dq && c.r === cell.r + dr);
    if (found !== -1) {
      neighbors.push(found);
    }
  });
  return neighbors;
}

// Liste blanche des sels acides autorisés, exprimés en composition exacte
// d'ions (les clés d'espèce sont `symbol|charge`, cf. makeTile).
const ACID_SALTS: string[][] = [
  // sels de sodium
  ['Na|+', 'Na|+', 'H|+', 'PO<sub>4</sub>|3–'], // Na2HPO4
  ['Na|+', 'H|+', 'H|+', 'PO<sub>4</sub>|3–'], // NaH2PO4
  ['Na|+', 'Na|+', 'H|+', 'PO<sub>3</sub>|3–'], // Na2HPO3
  ['Na|+', 'H|+', 'H|+', 'PO<sub>3</sub>|3–'], // NaH2PO3
  ['Na|+', 'H|+', 'CO<sub>3</sub>|2–'], // NaHCO3
  ['Na|+', 'H|+', 'SO<sub>4</sub>|2–'], // NaHSO4
  ['Na|+', 'H|+', 'SO<sub>3</sub>|2–'], // NaHSO3
  ['Na|+', 'H|+', 'S|2–'], // NaHS
  // sels de potassium
  ['K|+', 'K|+', 'H|+', 'PO<sub>4</sub>|3–'], // K2HPO4
  ['K|+', 'H|+', 'H|+', 'PO<sub>4</sub>|3–'], // KH2PO4
  ['K|+', 'K|+', 'H|+', 'PO<sub>3</sub>|3–'], // K2HPO3
  ['K|+', 'H|+', 'H|+', 'PO<sub>3</sub>|3–'], // KH2PO3
  ['K|+', 'H|+', 'CO<sub>3</sub>|2–'], // KHCO3
  ['K|+', 'H|+', 'SO<sub>4</sub>|2–'], // KHSO4
  ['K|+', 'H|+', 'SO<sub>3</sub>|2–'], // KHSO3
  ['K|+', 'H|+', 'S|2–'], // KHS
  // sels d'ammonium
  ['NH<sub>4</sub>|+', 'NH<sub>4</sub>|+', 'H|+', 'PO<sub>4</sub>|3–'], // (NH4)2HPO4
  ['NH<sub>4</sub>|+', 'H|+', 'H|+', 'PO<sub>4</sub>|3–'], // NH4H2PO4
  ['NH<sub>4</sub>|+', 'NH<sub>4</sub>|+', 'H|+', 'PO<sub>3</sub>|3–'], // (NH4)2HPO3
  ['NH<sub>4</sub>|+', 'H|+', 'H|+', 'PO<sub>3</sub>|3–'], // NH4H2PO3
  ['NH<sub>4</sub>|+', 'H|+', 'CO<sub>3</sub>|2–'], // NH4HCO3
  ['NH<sub>4</sub>|+', 'H|+', 'SO<sub>4</sub>|2–'], // NH4HSO4
  ['NH<sub>4</sub>|+', 'H|+', 'SO<sub>3</sub>|2–'], // NH4HSO3
  ['NH<sub>4</sub>|+', 'H|+', 'S|2–'], // NH4HS
  // phosphates acides de calcium
  ['Ca|2+', 'H|+', 'PO<sub>4</sub>|3–'], // CaHPO4
  ['Ca|2+', 'H|+', 'H|+', 'H|+', 'H|+',
    'PO<sub>4</sub>|3–', 'PO<sub>4</sub>|3–'] // Ca(H2PO4)2
];

const ACID_SALT_SIGNATURES = new Set(
  ACID_SALTS.map((species) => [...species].sort().join(' '))
);

// Former un sel acide rapporte trois points de plus
export const ACID_SALT_BONUS = 3;

export function isAcidSalt(cells: HexCell[], subset: number[]): boolean {
  const signature = subset.map((i) => cells[i].tile!.species).sort().join(' ');
  return ACID_SALT_SIGNATURES.has(signature);
}

// Formule brute de la molécule en HTML, p. ex. "Fe<sub>2</sub>(SO<sub>4</sub>)<sub>3</sub>".
// Cations d'abord (H en dernier parmi eux, cf. NaHCO3), indices en <sub>,
// parenthèses autour des ions polyatomiques répétés.
export function moleculeFormula(cells: HexCell[], molecule: number[]): string {
  const counts = new Map<string, { tile: HexTile; count: number }>();
  molecule.forEach((i) => {
    const tile = cells[i].tile!;
    const entry = counts.get(tile.species);
    if (entry) {
      entry.count++;
    } else {
      counts.set(tile.species, { tile, count: 1 });
    }
  });
  const entries = [...counts.values()].sort((a, b) => {
    if ((a.tile.charge > 0) !== (b.tile.charge > 0)) {
      return a.tile.charge > 0 ? -1 : 1;
    }
    return (a.tile.ion.symbol === 'H' ? 1 : 0) - (b.tile.ion.symbol === 'H' ? 1 : 0);
  });
  return entries.map(({ tile, count }) => {
    const symbol = tile.ion.symbol;
    if (count === 1) {
      return symbol;
    }
    const polyatomic = symbol.replace(/<sub>.*?<\/sub>/g, '').replace(/[^A-Z]/g, '').length > 1;
    return (polyatomic ? '(' + symbol + ')' : symbol) + '<sub>' + count + '</sub>';
  }).join('');
}

export function moleculePoints(cells: HexCell[], molecule: number[]): number {
  let points = molecule.length;
  if (isAcidSalt(cells, molecule)) {
    points += ACID_SALT_BONUS;
  }
  if (molecule.length >= 3) {
    points += 2;
  }
  return points;
}

// Molécule chimiquement sensée : charge totale nulle et une seule espèce
// d'anion + une seule espèce de cation. Seule exception : les sels acides
// de la liste blanche ACID_SALTS, reconnus par leur composition exacte.
function isValidMolecule(cells: HexCell[], subset: number[]): boolean {
  if (subset.length < 2) {
    return false;
  }
  let charge = 0;
  const cationSpecies = new Set<string>();
  const anionSpecies = new Set<string>();
  subset.forEach((i) => {
    const tile = cells[i].tile!;
    charge += tile.charge;
    (tile.charge > 0 ? cationSpecies : anionSpecies).add(tile.species);
  });
  if (charge !== 0) {
    return false;
  }
  if (anionSpecies.size === 1 && cationSpecies.size === 1) {
    return true;
  }
  return isAcidSalt(cells, subset);
}

// Cherche le plus grand sous-ensemble de pions actifs contenant le pion posé
// qui forme une molécule valide. La cohésion d'une molécule ionique vient des
// attractions cation–anion : le sous-ensemble doit être connexe en ne
// traversant que des contacts entre charges opposées (deux ions de même signe
// côte à côte ne sont pas liés). Retourne les index des cases, ou null.
export function findMolecule(cells: HexCell[], placedIndex: number): number[] | null {
  const isActive = (i: number) => cells[i].tile !== null && cells[i].frozenBy === null;
  if (!isActive(placedIndex)) {
    return null;
  }
  const oppositeCharges = (a: number, b: number) =>
    cells[a].tile!.charge * cells[b].tile!.charge < 0;

  let best: number[] | null = null;
  let bestPoints = 0;

  // Énumère chaque sous-ensemble connexe contenant placedIndex exactement une
  // fois : chaque candidat de la frontière est soit inclus, soit interdit pour
  // la suite de la branche. Le sous-ensemble rapportant le plus de points est
  // retenu (bonus des sels acides compris).
  const extend = (subset: number[], frontier: number[], blocked: Set<number>) => {
    if (isValidMolecule(cells, subset)) {
      const points = moleculePoints(cells, subset);
      if (points > bestPoints) {
        best = [...subset];
        bestPoints = points;
      }
    }
    if (subset.length >= MAX_MOLECULE_SIZE) {
      return;
    }
    const localBlocked = new Set(blocked);
    frontier.forEach((candidate, i) => {
      const newFrontier = frontier.slice(i + 1);
      neighborIndexes(cells, candidate).forEach((n) => {
        if (isActive(n) && oppositeCharges(candidate, n) && !subset.includes(n)
          && !localBlocked.has(n) && !frontier.includes(n) && !newFrontier.includes(n)) {
          newFrontier.push(n);
        }
      });
      extend([...subset, candidate], newFrontier, localBlocked);
      localBlocked.add(candidate);
    });
  };

  const startFrontier = neighborIndexes(cells, placedIndex)
    .filter((n) => isActive(n) && oppositeCharges(placedIndex, n));
  extend([placedIndex], startFrontier, new Set<number>());

  return best;
}

// Adversaire glouton : joue la case qui rapporte le plus de points,
// sinon une case vide au hasard.
export function bestPlacement(cells: HexCell[], tile: HexTile): { index: number; points: number } {
  let bestIndexes: number[] = [];
  let bestPoints = 0;
  cells.forEach((cell, i) => {
    if (cell.tile !== null) {
      return;
    }
    cell.tile = tile;
    const molecule = findMolecule(cells, i);
    const points = molecule ? moleculePoints(cells, molecule) : 0;
    cell.tile = null;
    if (points > bestPoints) {
      bestPoints = points;
      bestIndexes = [i];
    } else if (points === bestPoints) {
      bestIndexes.push(i);
    }
  });
  const index = bestIndexes[Math.floor(Math.random() * bestIndexes.length)];
  return { index, points: bestPoints };
}
