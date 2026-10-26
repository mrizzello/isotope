import {
  EQUATION_BANK,
  RoundState,
  apply,
  canonical,
  chooseAction,
  isValidEquation,
  isWinning,
  legalActions,
  makeDecoy,
  opponentCanWin,
  pickEquations,
  solve,
  substances
} from './balance.logic';

// [▲▲] + [●●] → [▲●], solution 1, 1, 2
const EQ = EQUATION_BANK[0];

function state(coefs: number[], human: string[], algo: string[] = ['TT', 'CC', 'TC']): RoundState {
  return {
    equation: EQ,
    coefs,
    hands: { human, algo },
    current: 'human',
    winner: null,
    turns: 0,
    proportionEquation: 0.7
  };
}

describe('balance.logic', () => {
  describe('equations', () => {
    it('finds the documented solution of every bank equation', () => {
      const expected = [[1, 1, 2], [2, 1, 2], [3, 1, 3], [2, 3, 6], [2, 3, 2, 4], [1, 2, 1, 2], [2, 7, 4, 6]];
      EQUATION_BANK.forEach((eq, i) => {
        expect(solve(eq.reactants, eq.products)).toEqual(expected[i]);
      });
    });

    it('displays molecules in canonical order', () => {
      expect(canonical('CT')).toBe('TC');
      expect(canonical('CSTT')).toBe('TTCS');
    });

    it('rejects invalid equations', () => {
      expect(isValidEquation(['T', 'C'], ['TC'])).toBeFalse(); // déjà équilibrée
      expect(isValidEquation(['TT'], ['T'])).toBeFalse(); // moins de 3 substances
      expect(isValidEquation(['TT', 'CC'], ['TS'])).toBeFalse(); // atomes absents d'un côté
    });

    it('picks distinct equations for a match', () => {
      const picked = pickEquations(3);
      expect(new Set(picked).size).toBe(3);
    });
  });

  describe('decoys', () => {
    it('never generates a molecule of the equation', () => {
      EQUATION_BANK.forEach((eq) => {
        for (let i = 0; i < 1000; i++) {
          const decoy = makeDecoy(eq);
          expect(decoy.length).toBeGreaterThan(0);
          expect(substances(eq)).not.toContain(decoy);
        }
      });
    });
  });

  describe('rules', () => {
    it('refuses to pose a decoy', () => {
      const actions = legalActions(state([0, 0, 0], ['TTT', 'CC', 'TC']));
      expect(actions).not.toContain({ type: 'pose', handIndex: 0 });
      expect(actions).toContain({ type: 'jeter', handIndex: 0 });
    });

    it('poses [▲▲] on [▲▲] and refills the hand', () => {
      const next = apply(state([0, 0, 0], ['TT', 'CC', 'TC']), { type: 'pose', handIndex: 0 });
      expect(next.coefs).toEqual([1, 0, 0]);
      expect(next.hands.human.length).toBe(3);
      expect(next.current).toBe('algo');
    });

    it('refuses a pose beyond the solution', () => {
      // [▲▲] est déjà à sa solution (1) : seul le jet reste possible
      const actions = legalActions(state([1, 0, 0], ['TT', 'TT', 'TT']));
      expect(actions).toEqual([{ type: 'jeter', handIndex: 0 }]);
    });

    it('wins with 1, 1, 2 but not with 2, 2, 4', () => {
      const win = apply(state([1, 1, 1], ['TC', 'CC', 'TT']), { type: 'pose', handIndex: 0 });
      expect(win.winner).toBe('human');
      expect(isWinning(EQ, [2, 2, 4])).toBeFalse();
    });

    it('cannot win by throwing a molecule', () => {
      const next = apply(state([1, 1, 2], ['TTT', 'CC', 'TT']), { type: 'jeter', handIndex: 0 });
      expect(next.winner).toBeNull();
    });
  });

  describe('algorithm', () => {
    it('level 2 plays an available winning move', () => {
      const s = state([1, 1, 1], ['CC', 'TC', 'TTT']);
      expect(chooseAction(s, 2)).toEqual({ type: 'pose', handIndex: 1 });
    });

    it('level 2 throws a decoy when nothing can be posed', () => {
      // [▲▲] et [●●] déjà à leur solution : aucune pose possible
      const blocked = state([1, 1, 0], ['TT', 'TTT', 'CC']);
      expect(chooseAction(blocked, 2)).toEqual({ type: 'jeter', handIndex: 1 });
    });

    it('level 3 avoids leaving a win to the opponent', () => {
      // 1, 1, 0 : poser [▲●] laisse 1, 1, 1 et le robot a [▲●] en main
      // (un jet laisse 1, 1, 0 : le robot ne peut pas gagner en une pose)
      const s = state([1, 1, 0], ['TC', 'TTT', 'CCS'], ['TC', 'TTT', 'TTT']);
      expect(opponentCanWin(s, { type: 'pose', handIndex: 0 })).toBeTrue();
      for (let i = 0; i < 20; i++) {
        expect(chooseAction(s, 3)).not.toEqual({ type: 'pose', handIndex: 0 });
      }
    });
  });
});
