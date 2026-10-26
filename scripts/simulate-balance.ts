// Simulation du jeu Balance :
// l'algorithme joue contre lui-même pour chaque paire de niveaux et chaque
// équation de la banque.
//
// Usage : npm run simulate:balance [-- N]   (N manches par combinaison, 10 000 par défaut)

import type { Level, PlayerId } from '../src/app/games/balance/balance.logic.ts';
import {
  DRAW_CONFIG,
  EQUATION_BANK,
  apply,
  chooseAction,
  newRound
} from '../src/app/games/balance/balance.logic.ts';

const N = Number(process.argv[2]) || 10000;
const MAX_TOURS = 1000; // garde-fou de la simulation : au-delà, manche « non terminée »
const LONG_ROUND = 100; // seuil d'une manche « très longue »
const LEVELS: Level[] = [1, 2, 3];

// générateur pseudo-aléatoire reproductible (mulberry32)
function mulberry32(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(42);

interface Stats {
  rounds: number;
  totalTurns: number;
  maxTurns: number;
  long: number;
  unfinished: number;
  firstWins: number;
  winsA: number; // victoires du niveau A (joueur « human » de la simulation)
  winsB: number;
}

function simulate(levelA: Level, levelB: Level, eqIndex: number): Stats {
  const eq = EQUATION_BANK[eqIndex];
  const levels: Record<PlayerId, Level> = { human: levelA, algo: levelB };
  // la pioche suit le niveau du « robot » (joueur B)
  const proportion = DRAW_CONFIG[levelB].proportionEquation;
  const stats: Stats = { rounds: N, totalTurns: 0, maxTurns: 0, long: 0, unfinished: 0, firstWins: 0, winsA: 0, winsB: 0 };
  for (let i = 0; i < N; i++) {
    const first: PlayerId = rng() < 0.5 ? 'human' : 'algo';
    let state = newRound(eq, first, proportion, rng);
    while (!state.winner && state.turns < MAX_TOURS) {
      state = apply(state, chooseAction(state, levels[state.current], rng), rng);
    }
    stats.totalTurns += state.turns;
    stats.maxTurns = Math.max(stats.maxTurns, state.turns);
    if (state.turns > LONG_ROUND) {
      stats.long++;
    }
    if (!state.winner) {
      stats.unfinished++;
      continue;
    }
    if (state.winner === first) {
      stats.firstWins++;
    }
    if (state.winner === 'human') {
      stats.winsA++;
    } else {
      stats.winsB++;
    }
  }
  return stats;
}

function pct(part: number, total: number): string {
  return total > 0 ? (100 * part / total).toFixed(1) + ' %' : '–';
}

function label(eqIndex: number): string {
  const eq = EQUATION_BANK[eqIndex];
  return eq.difficulty + ' ' + eq.reactants.join('+') + '→' + eq.products.join('+');
}

console.log('Simulation Balance : ' + N + ' manches par combinaison (niveaux × équations)\n');

const rows: Record<string, string | number>[] = [];
const summary: Record<string, Stats> = {};
for (const a of LEVELS) {
  for (const b of LEVELS) {
    const total: Stats = { rounds: 0, totalTurns: 0, maxTurns: 0, long: 0, unfinished: 0, firstWins: 0, winsA: 0, winsB: 0 };
    EQUATION_BANK.forEach((_, e) => {
      const s = simulate(a, b, e);
      rows.push({
        'niveaux': 'N' + a + ' vs N' + b,
        'équation': label(e),
        'tours moy.': (s.totalTurns / s.rounds).toFixed(1),
        'tours max': s.maxTurns,
        '> 100 tours': pct(s.long, s.rounds),
        'non finies': s.unfinished,
        '1er joueur gagne': pct(s.firstWins, s.rounds - s.unfinished),
        '1er niveau cité gagne': pct(s.winsA, s.rounds - s.unfinished)
      });
      (Object.keys(total) as (keyof Stats)[]).forEach((k) => {
        total[k] = k === 'maxTurns' ? Math.max(total[k], s[k]) : total[k] + s[k];
      });
    });
    summary['N' + a + ' vs N' + b] = total;
  }
}

console.table(rows);

console.log('\nSynthèse par paire de niveaux (toutes équations)\n');
console.table(Object.entries(summary).map(([pair, s]) => ({
  'niveaux': pair,
  'tours moy.': (s.totalTurns / s.rounds).toFixed(1),
  'tours max': s.maxTurns,
  '> 100 tours': pct(s.long, s.rounds),
  'non finies': s.unfinished,
  '1er joueur gagne': pct(s.firstWins, s.rounds - s.unfinished),
  '1er niveau cité gagne': pct(s.winsA, s.rounds - s.unfinished)
})));
