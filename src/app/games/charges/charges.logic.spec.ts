import { Ion } from '../../services/data.models';
import {
  ALL_CHARGES, IONS_PER_GAME, PROPOSITIONS, TIER_COUNTS,
  batteryColor, buildPropositions, drawGame, filterCations, formulaSizeClass, plainSymbol, tierOf
} from './charges.logic';

const ion = (symbol: string, charge: string, name = symbol): Ion =>
  ({ symbol, charge, name, wrongNames: [], group: '' });

const CATIONS: Ion[] = [
  ion('Na', '+'), ion('K', '+'), ion('Mg', '2+'), ion('Ca', '2+'), ion('Al', '3+'),
  ion('Fe', '2+', 'cation fer (II)'), ion('Cu', '2+', 'cation cuivre (II)'),
  ion('NH<sub>4</sub>', '+'), ion('H<sub>3</sub>O', '+')
];
const ANIONS: Ion[] = [
  ion('Cl', '–'), ion('O', '2–'), ion('N', '3–'),
  ion('SO<sub>4</sub>', '2–'), ion('NO<sub>3</sub>', '–'), ion('PO<sub>4</sub>', '3–'),
  ion('ClO<sub>3</sub>', '–'), ion('NO<sub>2</sub>', '–'), ion('BO<sub>3</sub>', '3–'),
  ion('Cr<sub>2</sub>O<sub>7</sub>', '2–'), ion('CH<sub>3</sub>COO', '–'), ion('S<sub>2</sub>O<sub>3</sub>', '2–')
];

describe('charges.logic', () => {
  it('strips markup from symbols', () => {
    expect(plainSymbol('Cr<sub>2</sub>O<sub>7</sub>')).toBe('Cr2O7');
  });

  it('classifies ions by tier', () => {
    expect(tierOf(ion('Na', '+'))).toBe(1);
    expect(tierOf(ion('Cl', '–'))).toBe(1);
    expect(tierOf(ion('SO<sub>4</sub>', '2–'))).toBe(2);
    expect(tierOf(ion('NH<sub>4</sub>', '+'))).toBe(2);
    expect(tierOf(ion('ClO<sub>3</sub>', '–'))).toBe(3);
    expect(tierOf(ion('Cr<sub>2</sub>O<sub>7</sub>', '2–'))).toBe(4);
  });

  it('excludes transition metals', () => {
    const symbols = filterCations(CATIONS).map(c => c.symbol);
    expect(symbols).not.toContain('Fe');
    expect(symbols).not.toContain('Cu');
    expect(symbols).toContain('Na');
  });

  it('draws 10 distinct ions in increasing tier order', () => {
    for (let n = 0; n < 50; n++) {
      const draw = drawGame(CATIONS, ANIONS);
      expect(draw.length).toBe(IONS_PER_GAME);
      expect(new Set(draw.map(d => d.symbol)).size).toBe(IONS_PER_GAME);
      const expectedTiers = TIER_COUNTS.flatMap((count, i) => Array(count).fill(i + 1));
      expect(draw.map(d => d.tier)).toEqual(expectedTiers);
      expect(draw.some(d => d.symbol === 'Fe' || d.symbol === 'Cu')).toBeFalse();
    }
  });

  it('builds 4 distinct propositions including the right charge', () => {
    for (const charge of ALL_CHARGES) {
      const props = buildPropositions(charge).map(p => p.charge);
      expect(props.length).toBe(PROPOSITIONS);
      expect(new Set(props).size).toBe(PROPOSITIONS);
      expect(props).toContain(charge);
    }
  });

  it('colors the battery from red to green', () => {
    expect(batteryColor(0)).toBe('hsl(0, 70%, 55%)');
    expect(batteryColor(5)).toBe('hsl(60, 70%, 55%)');
    expect(batteryColor(IONS_PER_GAME)).toBe('hsl(120, 70%, 55%)');
  });

  it('shrinks long formulas', () => {
    expect(formulaSizeClass('Na')).toBe('xl');
    expect(formulaSizeClass('SO<sub>4</sub>')).toBe('l');
    expect(formulaSizeClass('CH<sub>3</sub>COO')).toBe('m');
  });
});
