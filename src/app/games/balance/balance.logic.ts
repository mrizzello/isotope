// Moteur de règles du jeu Balance.
// Fonctions pures, sans aucun import : le fichier est aussi exécuté
// directement par Node dans scripts/simulate-balance.ts.

// ▲ triangle bleu, ● rond rouge, ■ carré vert (ordre canonique T < C < S)
export type Atom = 'T' | 'C' | 'S';
export const ATOMS: Atom[] = ['T', 'C', 'S'];

// Une molécule est la chaîne canonique (triée) de ses atomes, p. ex. 'TTC'
export type Molecule = string;
export type PlayerId = 'human' | 'algo';
export type Level = 1 | 2 | 3;
export type Difficulty = 'A' | 'B' | 'C';
export type Rng = () => number;

export interface Equation {
  reactants: Molecule[];
  products: Molecule[];
  solution: number[]; // plus petits coefficients entiers ≥ 1, réactifs puis produits
  difficulty: Difficulty;
}

export interface Action {
  type: 'pose' | 'jeter';
  handIndex: number;
}

export interface RoundState {
  equation: Equation;
  coefs: number[];
  hands: Record<PlayerId, Molecule[]>;
  current: PlayerId;
  winner: PlayerId | null;
  turns: number;
  proportionEquation: number; // part des molécules de l'équation dans la pioche
}

export const HAND_SIZE = 1;

// Pondération de la pioche par niveau du robot
export const DRAW_CONFIG: Record<Level, { proportionEquation: number }> = {
  1: { proportionEquation: 0.8 },
  2: { proportionEquation: 0.8 },
  3: { proportionEquation: 0.8 }
};

export function canonical(atoms: string): Molecule {
  return atoms.split('')
    .sort((a, b) => ATOMS.indexOf(a as Atom) - ATOMS.indexOf(b as Atom))
    .join('');
}

export function substances(eq: { reactants: Molecule[]; products: Molecule[] }): Molecule[] {
  return [...eq.reactants, ...eq.products];
}

function countAtom(molecule: Molecule, atom: Atom): number {
  return molecule.split('').filter((a) => a === atom).length;
}

function atomsOf(molecules: Molecule[]): Atom[] {
  return ATOMS.filter((atom) => molecules.some((m) => m.includes(atom)));
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

// Résout le système « atomes côté réactifs = atomes côté produits » en entiers.
// Retourne null si l'espace des solutions n'est pas de
// dimension 1 ou s'il n'existe pas de solution strictement positive.
export function solve(reactants: Molecule[], products: Molecule[]): number[] | null {
  const all = [...reactants, ...products];
  const n = all.length;
  const rows = atomsOf(all).map((atom) =>
    all.map((m, j) => (j < reactants.length ? 1 : -1) * countAtom(m, atom)));

  // élimination de Gauss-Jordan en entiers
  const pivots: number[] = []; // colonne du pivot de chaque ligne réduite
  let r = 0;
  for (let c = 0; c < n && r < rows.length; c++) {
    const p = rows.findIndex((row, i) => i >= r && row[c] !== 0);
    if (p < 0) {
      continue;
    }
    [rows[r], rows[p]] = [rows[p], rows[r]];
    for (let i = 0; i < rows.length; i++) {
      if (i !== r && rows[i][c] !== 0) {
        const factor = rows[i][c];
        const pivot = rows[r][c];
        rows[i] = rows[i].map((v, j) => v * pivot - rows[r][j] * factor);
        const g = rows[i].reduce((acc, v) => gcd(acc, v), 0);
        if (g > 1) {
          rows[i] = rows[i].map((v) => v / g);
        }
      }
    }
    pivots.push(c);
    r++;
  }
  if (pivots.length !== n - 1) {
    return null;
  }

  // une seule variable libre f : x_c = -a_rf · x_f / a_rc pour chaque pivot
  const free = [...Array(n).keys()].find((c) => !pivots.includes(c)) as number;
  const scale = pivots.reduce((acc, c, i) => lcm(acc, rows[i][c]), 1);
  const x = new Array(n).fill(0);
  x[free] = scale;
  pivots.forEach((c, i) => {
    x[c] = -rows[i][free] * scale / rows[i][c];
  });
  const g = x.reduce((acc, v) => gcd(acc, v), 0);
  const sign = x[free] < 0 ? -1 : 1;
  const solution = x.map((v) => sign * v / g);
  return solution.every((v) => v >= 1) ? solution : null;
}

// Critères de validité d'une équation
export function isValidEquation(reactants: Molecule[], products: Molecule[]): boolean {
  const all = [...reactants, ...products];
  if (all.length < 3 || new Set(all).size !== all.length) {
    return false;
  }
  const left = atomsOf(reactants);
  const right = atomsOf(products);
  if (left.length !== right.length || left.some((atom) => !right.includes(atom))) {
    return false;
  }
  const solution = solve(reactants, products);
  return solution !== null && solution.some((v) => v !== 1);
}

function defineEquation(reactants: string[], products: string[], difficulty: Difficulty): Equation {
  const r = reactants.map(canonical);
  const p = products.map(canonical);
  if (!isValidEquation(r, p)) {
    throw new Error('Équation invalide : ' + r.join(' + ') + ' → ' + p.join(' + '));
  }
  return { reactants: r, products: p, solution: solve(r, p) as number[], difficulty };
}

// Banque d'équations, solutions calculées
export const EQUATION_BANK: Equation[] = [
  defineEquation(['TT', 'CC'], ['TC'], 'A'),
  defineEquation(['TT', 'CC'], ['TTC'], 'A'),
  defineEquation(['T', 'CCC'], ['TC'], 'A'),
  defineEquation(['TTT', 'CC'], ['TC'], 'B'),
  defineEquation(['TCC', 'SS'], ['TS', 'CS'], 'B'),
  defineEquation(['TTT', 'SS'], ['TTS'], 'B'),
  defineEquation(['TC', 'SS'], ['TS', 'CCS'], 'B'),
  defineEquation(['STTTT', 'CC'], ['SCC', 'TTC'], 'C'),
  defineEquation(['SSTTTTTT', 'CC'], ['SCC', 'TTC'], 'C')
];

function randomItem<T>(items: T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)];
}

// Tire `count` équations différentes au hasard dans la banque
export function pickEquations(count: number, rng: Rng = Math.random, bank: Equation[] = EQUATION_BANK): Equation[] {
  const pool = [...bank];
  const picked: Equation[] = [];
  while (picked.length < count && pool.length > 0) {
    picked.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return picked;
}

export function substanceIndex(eq: Equation, molecule: Molecule): number {
  return substances(eq).indexOf(molecule);
}

// Leurre : une seule modification (ajout, retrait ou remplacement d'un atome)
// appliquée à une substance de l'équation
export function makeDecoy(eq: Equation, rng: Rng = Math.random): Molecule {
  const all = substances(eq);
  const types = atomsOf(all);
  for (;;) {
    const base = randomItem(all, rng);
    const ops: string[] = ['ajout'];
    if (base.length >= 2) {
      ops.push('retrait');
    }
    if (types.length >= 2) {
      ops.push('remplacement');
    }
    const op = randomItem(ops, rng);
    const atoms = base.split('');
    const position = Math.floor(rng() * atoms.length);
    if (op === 'ajout') {
      atoms.push(randomItem(types, rng));
    } else if (op === 'retrait') {
      atoms.splice(position, 1);
    } else {
      atoms[position] = randomItem(types.filter((t) => t !== atoms[position]), rng);
    }
    const decoy = canonical(atoms.join(''));
    if (decoy.length > 0 && !all.includes(decoy)) {
      return decoy;
    }
  }
}

// Pioche infinie : chaque tirage est indépendant
export function drawMolecule(eq: Equation, proportionEquation: number, rng: Rng = Math.random): Molecule {
  return rng() < proportionEquation ? randomItem(substances(eq), rng) : makeDecoy(eq, rng);
}

export function newRound(eq: Equation, first: PlayerId, proportionEquation: number, rng: Rng = Math.random): RoundState {
  const hand = () => [...Array(HAND_SIZE)].map(() => drawMolecule(eq, proportionEquation, rng));
  return {
    equation: eq,
    coefs: eq.solution.map(() => 0),
    hands: { human: hand(), algo: hand() },
    current: first,
    winner: null,
    turns: 0,
    proportionEquation
  };
}

export function opponent(player: PlayerId): PlayerId {
  return player === 'human' ? 'algo' : 'human';
}

export function isWinning(eq: Equation, coefs: number[]): boolean {
  return coefs.every((c, i) => c === eq.solution[i]);
}

// D = Σ |cᵢ − sᵢ|
export function distance(eq: Equation, coefs: number[]): number {
  return coefs.reduce((sum, c, i) => sum + Math.abs(c - eq.solution[i]), 0);
}

// Une molécule peut être posée si elle est identique à une substance dont le
// coefficient n'a pas encore atteint la solution (pas de retrait possible,
// donc pas de dépassement : la pose en trop est refusée)
export function canPose(eq: Equation, coefs: number[], molecule: Molecule): boolean {
  const substance = substanceIndex(eq, molecule);
  return substance >= 0 && coefs[substance] < eq.solution[substance];
}

// Actions légales du joueur courant ; les molécules identiques de la main
// ne donnent qu'une seule action
export function legalActions(state: RoundState): Action[] {
  const actions: Action[] = [];
  const hand = state.hands[state.current];
  hand.forEach((molecule, handIndex) => {
    if (hand.indexOf(molecule) !== handIndex) {
      return;
    }
    if (canPose(state.equation, state.coefs, molecule)) {
      actions.push({ type: 'pose', handIndex });
    }
    actions.push({ type: 'jeter', handIndex });
  });
  return actions;
}

// Effet d'une action sur la table seule (sans tirage)
function tableAfter(state: RoundState, action: Action): number[] {
  const coefs = [...state.coefs];
  if (action.type === 'pose') {
    coefs[substanceIndex(state.equation, state.hands[state.current][action.handIndex])]++;
  }
  return coefs;
}

export function apply(state: RoundState, action: Action, rng: Rng = Math.random): RoundState {
  const player = state.current;
  const coefs = tableAfter(state, action);
  // la molécule quitte la main et est aussitôt remplacée au même endroit
  const hand = [...state.hands[player]];
  hand[action.handIndex] = drawMolecule(state.equation, state.proportionEquation, rng);
  const winner = action.type === 'pose' && isWinning(state.equation, coefs) ? player : null;
  return {
    ...state,
    coefs,
    hands: { ...state.hands, [player]: hand },
    current: winner ? player : opponent(player),
    winner,
    turns: state.turns + 1
  };
}

const PRIORITY: Record<Action['type'], number> = { pose: 0, jeter: 1 };

// Garde les meilleures actions selon `score` (plus petit = meilleur)
function best(actions: Action[], score: (a: Action) => number): Action[] {
  const min = Math.min(...actions.map(score));
  return actions.filter((a) => score(a) === min);
}

function winsNow(state: RoundState, action: Action): boolean {
  return action.type === 'pose' && isWinning(state.equation, tableAfter(state, action));
}

// Niveau 2 : glouton sur la distance D
function greedy(state: RoundState, actions: Action[], rng: Rng): Action {
  const winning = actions.filter((a) => winsNow(state, a));
  if (winning.length > 0) {
    return randomItem(winning, rng);
  }
  const eq = state.equation;
  const d = distance(eq, state.coefs);
  const after = (a: Action) => distance(eq, tableAfter(state, a));
  const closest = best(actions, after);
  if (after(closest[0]) < d) {
    return randomItem(best(closest, (a) => PRIORITY[a.type]), rng);
  }
  // aucune action ne rapproche de la solution : on jette d'abord un leurre,
  // sinon une molécule dont la substance est déjà à sa solution ou au-delà
  const hand = state.hands[state.current];
  const discards = actions.filter((a) => a.type === 'jeter');
  const decoys = discards.filter((a) => substanceIndex(eq, hand[a.handIndex]) < 0);
  if (decoys.length > 0) {
    return randomItem(decoys, rng);
  }
  const surplus = discards.filter((a) => {
    const s = substanceIndex(eq, hand[a.handIndex]);
    return state.coefs[s] >= eq.solution[s];
  });
  if (surplus.length > 0) {
    return randomItem(surplus, rng);
  }
  if (discards.length > 0) {
    return randomItem(discards, rng);
  }
  return randomItem(best(closest, (a) => PRIORITY[a.type]), rng);
}

// L'adversaire aurait-il un coup gagnant au tour suivant, avec sa main visible ?
export function opponentCanWin(state: RoundState, action: Action): boolean {
  const eq = state.equation;
  const coefs = tableAfter(state, action);
  return state.hands[opponent(state.current)].some((molecule) => {
    const s = substanceIndex(eq, molecule);
    return s >= 0 && isWinning(eq, coefs.map((c, i) => (i === s ? c + 1 : c)));
  });
}

export function chooseAction(state: RoundState, level: Level, rng: Rng = Math.random): Action {
  const actions = legalActions(state);
  if (level === 1) {
    return randomItem(actions, rng);
  }
  if (level === 2) {
    return greedy(state, actions, rng);
  }
  const winning = actions.filter((a) => winsNow(state, a));
  if (winning.length > 0) {
    return randomItem(winning, rng);
  }
  const safe = actions.filter((a) => !opponentCanWin(state, a));
  return greedy(state, safe.length > 0 ? safe : actions, rng);
}
