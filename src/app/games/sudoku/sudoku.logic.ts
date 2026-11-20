import { Ion } from '../../services/data.models';

// Sudoku ionique : grille 4×4 en 4 boîtes 2×2. Chaque boîte correspond à un
// cation ; chaque ligne, colonne et boîte contient une fois chacun des 4 anions.
// Le joueur dépose des ions dans les cases pour construire la formule.

export const SIZE = 4;
export const CELLS = SIZE * SIZE;
export const GIVENS = 4; // cases données, comme les grilles 1 et 3 du PDF
export const MAX_COUNT = 3; // unités d'un même ion par case

// sous-ensemble restreint de ions.json : toutes les paires donnent un composé
// plausible (charges ≤ 3, donc indices de 1 à 3)
export const SUDOKU_CATIONS: [string, number][] = [
  ['H', 1], ['Na', 1], ['K', 1], ['NH4', 1],
  ['Mg', 2], ['Ca', 2], ['Fe', 2], ['Cu', 2],
  ['Al', 3], ['Fe', 3]
];
export const SUDOKU_ANIONS: [string, number][] = [
  ['F', 1], ['Cl', 1], ['OH', 1], ['NO3', 1], ['SO4', 2], ['PO4', 3]
];

export interface SudokuIon {
  symbol: string; // HTML, avec <sub>
  plain: string; // sans balises
  charge: number; // valeur absolue
  name: string;
}

export interface Puzzle {
  cations: SudokuIon[]; // un par boîte : haut gauche, haut droite, bas gauche, bas droite
  anions: SudokuIon[];
  solution: number[]; // indice de l'anion de chaque case, ligne par ligne
  givens: boolean[];
}

export interface Cell {
  cation: number | null; // indice dans puzzle.cations
  cationCount: number;
  anion: number | null; // indice dans puzzle.anions
  anionCount: number;
}

export type Rng = () => number;

export type DropResult = 'ok' | 'mixed' | 'max';

export type CellStatus = 'empty' | 'valid' | 'invalid';

export function plainSymbol(symbol: string): string {
  return symbol.replace(/<[^>]+>/g, '');
}

export function chargeValue(charge: string): number {
  const digits = charge.replace(/[^0-9]/g, '');
  return digits ? parseInt(digits, 10) : 1;
}

export function toSudokuIon(ion: Ion): SudokuIon {
  return { symbol: ion.symbol, plain: plainSymbol(ion.symbol), charge: chargeValue(ion.charge), name: ion.name };
}

function pick(ions: Ion[], list: [string, number][]): SudokuIon[] {
  return list
    .map(([plain, charge]) => ions.map(toSudokuIon).find((i) => i.plain === plain && i.charge === charge))
    .filter((i): i is SudokuIon => i !== undefined);
}

export function sudokuCations(cations: Ion[]): SudokuIon[] {
  return pick(cations, SUDOKU_CATIONS);
}

export function sudokuAnions(anions: Ion[]): SudokuIon[] {
  return pick(anions, SUDOKU_ANIONS);
}

export function isPolyatomic(ion: SudokuIon): boolean {
  return !/^[A-Z][a-z]?$/.test(ion.plain);
}

export function boxOf(cell: number): number {
  const row = Math.floor(cell / SIZE);
  const col = cell % SIZE;
  return Math.floor(row / 2) * 2 + Math.floor(col / 2);
}

function shuffle<T>(items: T[], rng: Rng): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// les 288 grilles 4×4 valides (valeurs 0 à 3), calculées une fois
let allGrids: number[][] | null = null;

export function solutionGrids(): number[][] {
  if (allGrids) {
    return allGrids;
  }
  const grids: number[][] = [];
  const grid: number[] = Array(CELLS).fill(-1);
  const fits = (cell: number, v: number) => {
    for (let other = 0; other < cell; other++) {
      const sameRow = Math.floor(other / SIZE) === Math.floor(cell / SIZE);
      const sameCol = other % SIZE === cell % SIZE;
      if (grid[other] === v && (sameRow || sameCol || boxOf(other) === boxOf(cell))) {
        return false;
      }
    }
    return true;
  };
  const fill = (cell: number) => {
    if (cell === CELLS) {
      grids.push([...grid]);
      return;
    }
    for (let v = 0; v < SIZE; v++) {
      if (fits(cell, v)) {
        grid[cell] = v;
        fill(cell + 1);
      }
    }
    grid[cell] = -1;
  };
  fill(0);
  allGrids = grids;
  return grids;
}

export function countSolutions(solution: number[], givens: boolean[]): number {
  return solutionGrids().filter((g) => g.every((v, i) => !givens[i] || v === solution[i])).length;
}

export function newPuzzle(cations: SudokuIon[], anions: SudokuIon[], rng: Rng = Math.random): Puzzle {
  const grids = solutionGrids();
  const solution = grids[Math.floor(rng() * grids.length)];
  let givens: boolean[];
  do {
    const chosen = shuffle([...Array(CELLS).keys()], rng).slice(0, GIVENS);
    givens = [...Array(CELLS).keys()].map((i) => chosen.includes(i));
  } while (countSolutions(solution, givens) !== 1);
  return {
    cations: shuffle(cations, rng).slice(0, SIZE),
    anions: shuffle(anions, rng).slice(0, SIZE),
    solution,
    givens
  };
}

export function emptyCell(): Cell {
  return { cation: null, cationCount: 0, anion: null, anionCount: 0 };
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

// indices minimaux qui rendent le composé neutre
export function reducedIndices(cation: SudokuIon, anion: SudokuIon): [number, number] {
  const lcm = cation.charge * anion.charge / gcd(cation.charge, anion.charge);
  return [lcm / cation.charge, lcm / anion.charge];
}

// cellule de la solution, avec les indices réduits
export function solutionCell(puzzle: Puzzle, cell: number): Cell {
  const cation = boxOf(cell);
  const anion = puzzle.solution[cell];
  const [cationCount, anionCount] = reducedIndices(puzzle.cations[cation], puzzle.anions[anion]);
  return { cation, cationCount, anion, anionCount };
}

export function isEmpty(cell: Cell): boolean {
  return cell.cation === null && cell.anion === null;
}

// ajoute une unité d'ion ; refusé si la case contient déjà un autre ion du même signe
export function drop(cell: Cell, kind: 'cation' | 'anion', index: number): { cell: Cell; result: DropResult } {
  const current = kind === 'cation' ? cell.cation : cell.anion;
  const count = kind === 'cation' ? cell.cationCount : cell.anionCount;
  if (current !== null && current !== index) {
    return { cell, result: 'mixed' };
  }
  if (count >= MAX_COUNT) {
    return { cell, result: 'max' };
  }
  const next = kind === 'cation'
    ? { ...cell, cation: index, cationCount: count + 1 }
    : { ...cell, anion: index, anionCount: count + 1 };
  return { cell: next, result: 'ok' };
}

// vert : cation et anion présents, composé neutre et indices simplifiés.
// Ne dit rien de la déduction (le bon anion à cette place).
export function cellStatus(puzzle: Puzzle, cell: Cell): CellStatus {
  if (isEmpty(cell)) {
    return 'empty';
  }
  if (cell.cation === null || cell.anion === null) {
    return 'invalid';
  }
  const [c, a] = reducedIndices(puzzle.cations[cell.cation], puzzle.anions[cell.anion]);
  return cell.cationCount === c && cell.anionCount === a ? 'valid' : 'invalid';
}

function part(ion: SudokuIon, count: number): string {
  if (count <= 1) {
    return ion.symbol;
  }
  const symbol = isPolyatomic(ion) ? '(' + ion.symbol + ')' : ion.symbol;
  return symbol + '<sub>' + count + '</sub>';
}

// composé électriquement neutre : cation et anion présents, charges compensées
export function isNeutral(puzzle: Puzzle, cell: Cell): boolean {
  return cell.cation !== null && cell.anion !== null
    && cell.cationCount * puzzle.cations[cell.cation].charge === cell.anionCount * puzzle.anions[cell.anion].charge;
}

// ion avec sa charge en exposant et son nombre en coefficient : 2OH<sup>–</sup>
function ionPart(ion: SudokuIon, count: number, sign: '+' | '–'): string {
  return (count > 1 ? count : '') + ion.symbol + '<sup>' + chargeLabel(ion, sign) + '</sup>';
}

// ions d'une case non neutre, chacun avec sa charge (vide si absent)
export function ionHtml(puzzle: Puzzle, cell: Cell, kind: 'cation' | 'anion'): string {
  if (kind === 'cation') {
    return cell.cation !== null ? ionPart(puzzle.cations[cell.cation], cell.cationCount, '+') : '';
  }
  return cell.anion !== null ? ionPart(puzzle.anions[cell.anion], cell.anionCount, '–') : '';
}

// tant que le composé n'est pas neutre, on garde les ions et leurs charges
// (Al³⁺ 2OH⁻) ; une fois neutre, on écrit la formule (Al(OH)₃)
export function formulaHtml(puzzle: Puzzle, cell: Cell): string {
  const cation = cell.cation !== null ? puzzle.cations[cell.cation] : null;
  const anion = cell.anion !== null ? puzzle.anions[cell.anion] : null;
  if (!isNeutral(puzzle, cell)) {
    return [ionHtml(puzzle, cell, 'cation'), ionHtml(puzzle, cell, 'anion')]
      .filter((part) => part !== '').join(' ');
  }
  // H⁺ + OH⁻ : l'eau s'écrit H₂O
  if (cation?.plain === 'H' && anion?.plain === 'OH' && cell.cationCount === 1 && cell.anionCount === 1) {
    return 'H<sub>2</sub>O';
  }
  return (cation ? part(cation, cell.cationCount) : '') + (anion ? part(anion, cell.anionCount) : '');
}

export function isCorrect(puzzle: Puzzle, cells: Cell[], index: number): boolean {
  const expected = solutionCell(puzzle, index);
  const cell = cells[index];
  return cell.cation === expected.cation && cell.cationCount === expected.cationCount
    && cell.anion === expected.anion && cell.anionCount === expected.anionCount;
}

// indices des cases fausses (les cases données sont toujours justes)
export function checkGrid(puzzle: Puzzle, cells: Cell[]): number[] {
  return cells.map((_, i) => i).filter((i) => !puzzle.givens[i] && !isCorrect(puzzle, cells, i));
}

export function initialCells(puzzle: Puzzle): Cell[] {
  return [...Array(CELLS).keys()].map((i) => (puzzle.givens[i] ? solutionCell(puzzle, i) : emptyCell()));
}

// « Composés du calcium », « Composés de l'aluminium », « Acides » pour H⁺
export function boxLabel(cation: SudokuIon): string {
  if (cation.plain === 'H') {
    return 'Acides';
  }
  const name = cation.name.replace(/^cation\s+/, '');
  return /^[aeiouyéèh]/i.test(name) ? 'Composés de l\'' + name : 'Composés du ' + name;
}

// charge en exposant : +, 2+, –, 3–
export function chargeLabel(ion: SudokuIon, sign: '+' | '–'): string {
  return (ion.charge > 1 ? ion.charge : '') + sign;
}
