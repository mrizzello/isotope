import { Family } from '../../services/data.models';
import {
  BINS,
  FallingMolecule,
  LANES,
  MAX_MULTIPLIER,
  SPECIAL_BONUS,
  applyCorrect,
  applyMissed,
  applyWrong,
  drawCompound,
  fallSpeed,
  freeLane,
  initialComboState,
  levelFor,
  spawnDelay
} from './family-rush.logic';

const compound = (type: string, formule: string): Family => ({ type, formule, general: '', name: '' });

describe('family-rush logic', () => {
  it('should raise the multiplier every 5 consecutive fast answers, capped at x3', () => {
    let state = initialComboState();
    for (let i = 0; i < 20; i++) {
      state = applyCorrect(state, i, false);
      if (i === 3) {
        expect(state.multiplier).toBe(1);
      }
      if (i === 4) {
        expect(state.multiplier).toBe(2);
      }
    }
    expect(state.multiplier).toBe(MAX_MULTIPLIER);
    expect(state.combo).toBe(20);
  });

  it('should score with the multiplier in effect before the answer', () => {
    let state = { ...initialComboState(), multiplier: 2 };
    state = applyCorrect(state, 0, false);
    expect(state.score).toBe(2);
  });

  it('should restart the fast streak after a slow answer', () => {
    let state = initialComboState();
    for (let i = 0; i < 4; i++) {
      state = applyCorrect(state, i, false);
    }
    state = applyCorrect(state, 20, false); // lente
    expect(state.multiplier).toBe(1);
    expect(state.fastStreak).toBe(1);
    expect(state.combo).toBe(5);
  });

  it('should add the flat bonus for a special molecule', () => {
    const state = applyCorrect(initialComboState(), 0, true);
    expect(state.score).toBe(1 + SPECIAL_BONUS);
  });

  it('should reset combo and multiplier on a wrong answer, but only the combo on a miss', () => {
    const state = { ...initialComboState(), score: 12, combo: 7, bestCombo: 7, multiplier: 3 };
    const wrong = applyWrong(state);
    expect([wrong.score, wrong.combo, wrong.multiplier, wrong.bestCombo]).toEqual([12, 0, 1, 7]);
    const missed = applyMissed(state);
    expect([missed.combo, missed.multiplier]).toEqual([0, 3]);
  });

  it('should speed up and densify every 10 points, within bounds', () => {
    expect(levelFor(9)).toBe(0);
    expect(levelFor(14)).toBe(1);
    expect(fallSpeed(1)).toBeGreaterThan(fallSpeed(0));
    expect(spawnDelay(1)).toBeLessThan(spawnDelay(0));
    expect(fallSpeed(1000)).toBe(fallSpeed(500));
    expect(spawnDelay(1000)).toBeGreaterThan(0);
  });

  it('should draw each family evenly and avoid compounds already on screen', () => {
    const compounds = [compound('hydracide', 'HCl'), compound('hydracide', 'HF')];
    BINS.forEach((b, i) => compounds.push(compound(b.value, 'X' + i)));
    // rng 0 → première famille (hydracide), premier candidat hors exclusion
    expect(drawCompound(compounds, ['HCl'], () => 0).formule).toBe('HF');
    const drawn = drawCompound(compounds, [], () => 0.99);
    expect(drawn.type).toBe(BINS[BINS.length - 1].value);
  });

  it('should only offer lanes whose last molecule is far enough', () => {
    const molecules: FallingMolecule[] = [];
    for (let lane = 0; lane < LANES; lane++) {
      molecules.push({ id: lane, compound: compound('sel', 'NaCl'), lane, y: 0.1, special: false });
    }
    expect(freeLane(molecules)).toBe(-1);
    molecules[2].y = 0.5;
    expect(freeLane(molecules)).toBe(2);
  });
});
