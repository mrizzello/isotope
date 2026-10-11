import { Lewis } from '../../services/data.models';
import {
  ELEMENTS_PER_GAME, PROPOSITIONS, RING_RADIUS, TIER_COUNTS,
  buildPropositions, drawGame, tierOf
} from './lewis.logic';

const el = (symbol: string, col: number): Lewis => ({ number: '0', symbol, name: symbol, col });

const ELEMENTS: Lewis[] = [
  el('H', 1), el('Li', 1), el('Na', 1), el('Mg', 2), el('B', 3), el('Al', 3),
  el('C', 4), el('Si', 4), el('N', 5), el('P', 5),
  el('O', 6), el('S', 6), el('F', 7), el('Cl', 7), el('Ne', 8)
];

describe('lewis.logic', () => {
  it('classifies elements by group tier', () => {
    expect(tierOf(el('Na', 1))).toBe(1);
    expect(tierOf(el('Al', 3))).toBe(1);
    expect(tierOf(el('C', 4))).toBe(2);
    expect(tierOf(el('N', 5))).toBe(2);
    expect(tierOf(el('O', 6))).toBe(3);
    expect(tierOf(el('Ne', 8))).toBe(3);
  });

  it('builds 8 propositions on the ring, one of them correct', () => {
    const props = buildPropositions(6);
    expect(props.length).toBe(PROPOSITIONS);
    expect(props.map(p => p.n).sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(props.filter(p => p.correct).map(p => p.n)).toEqual([6]);
    props.forEach(p => expect(Math.hypot(p.x, p.y)).toBeCloseTo(RING_RADIUS, -1));
  });

  it('draws 8 elements in tier order 3/3/2', () => {
    const draw = drawGame(ELEMENTS);
    expect(draw.length).toBe(ELEMENTS_PER_GAME);
    const tiers = draw.map(item => item.tier);
    expect(tiers).toEqual(TIER_COUNTS.flatMap((count, i) => Array(count).fill(i + 1)));
    draw.forEach(item => expect(tierOf(item)).toBe(item.tier));
    expect(new Set(draw.map(item => item.symbol)).size).toBe(ELEMENTS_PER_GAME);
  });
});
