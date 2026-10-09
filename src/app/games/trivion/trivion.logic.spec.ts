import { Ion } from '../../services/data.models';
import { IONS_PER_GAME, MAX_TILT, TIER_COUNTS, buildPropositions, drawGame, isTransitionMetal, trivionTier } from './trivion.logic';

const ion = (symbol: string, name: string, wrongNames = [`faux ${name} 1`, `faux ${name} 2`, `faux ${name} 3`]): Ion =>
  ({ symbol, charge: '', name, wrongNames, group: '' });

const CATIONS: Ion[] = [
  ion('Na', 'cation sodium'), ion('K', 'cation potassium'), ion('Mg', 'cation magnésium'),
  ion('Fe', 'cation fer (II)'), ion('Fe', 'cation fer (III)'), ion('Cu', 'cation cuivre (I)'),
  ion('NH<sub>4</sub>', 'ammonium'), ion('H<sub>3</sub>O', 'hydronium')
];
const ANIONS: Ion[] = [
  ion('Cl', 'chlorure'), ion('O', 'oxyde'),
  ion('SO<sub>4</sub>', 'sulfate'), ion('NO<sub>3</sub>', 'nitrate'),
  ion('ClO<sub>3</sub>', 'chlorate'), ion('NO<sub>2</sub>', 'nitrite'),
  ion('Cr<sub>2</sub>O<sub>7</sub>', 'dichromate')
];

describe('trivion.logic', () => {
  it('puts transition metals in the last tier', () => {
    expect(isTransitionMetal(ion('Fe', 'cation fer (III)'))).toBeTrue();
    expect(isTransitionMetal(ion('Na', 'cation sodium'))).toBeFalse();
    expect(trivionTier(ion('Fe', 'cation fer (III)'))).toBe(4);
    expect(trivionTier(ion('Na', 'cation sodium'))).toBe(1);
    expect(trivionTier(ion('SO<sub>4</sub>', 'sulfate'))).toBe(2);
    expect(trivionTier(ion('ClO<sub>3</sub>', 'chlorate'))).toBe(3);
    expect(trivionTier(ion('Cr<sub>2</sub>O<sub>7</sub>', 'dichromate'))).toBe(4);
  });

  it('draws 10 distinct ions in increasing tier order', () => {
    for (let n = 0; n < 50; n++) {
      const draw = drawGame(CATIONS, ANIONS);
      expect(draw.length).toBe(IONS_PER_GAME);
      expect(new Set(draw.map(d => d.name)).size).toBe(IONS_PER_GAME);
      const expectedTiers = TIER_COUNTS.flatMap((count, i) => Array(count).fill(i + 1));
      expect(draw.map(d => d.tier)).toEqual(expectedTiers);
    }
  });

  it('builds 4 distinct propositions including the right name', () => {
    const sulfate = ion('SO<sub>4</sub>', 'sulfate', ['sulfure', 'sulfite', 'thiosulfate']);
    const props = buildPropositions(sulfate);
    expect(props.length).toBe(4);
    expect(new Set(props.map(p => p.name)).size).toBe(4);
    expect(props.map(p => p.name)).toContain('sulfate');
    props.forEach(p => expect(Math.abs(p.tilt)).toBeLessThanOrEqual(MAX_TILT));
    expect(sulfate.wrongNames.length).toBe(3);  // pas de mutation des données
  });
});
