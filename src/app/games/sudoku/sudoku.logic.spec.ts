import { Ion } from '../../services/data.models';
import {
  CELLS, GIVENS, MAX_COUNT, Puzzle, SUDOKU_ANIONS, SUDOKU_CATIONS, SudokuIon,
  boxLabel, boxOf, cellStatus, checkGrid, countSolutions, drop, emptyCell, formulaHtml,
  initialCells, newPuzzle, reducedIndices, solutionCell, solutionGrids, sudokuAnions, sudokuCations
} from './sudoku.logic';

const ion = (symbol: string, charge: string, name = 'cation ' + symbol): Ion =>
  ({ symbol, charge, name, wrongNames: [], group: '' });

const CATIONS: Ion[] = [
  ion('H', '+', 'cation hydrogène'), ion('Li', '+'), ion('Na', '+', 'cation sodium'), ion('K', '+'),
  ion('Mg', '2+'), ion('Ca', '2+', 'cation calcium'), ion('Al', '3+', 'cation aluminium'),
  ion('Fe', '2+', 'cation fer (II)'), ion('Fe', '3+', 'cation fer (III)'),
  ion('Cu', '+', 'cation cuivre (I)'), ion('Cu', '2+', 'cation cuivre (II)'),
  ion('Mn', '7+'), ion('H<sub>3</sub>O', '+', 'hydronium'), ion('NH<sub>4</sub>', '+', 'ammonium')
];
const ANIONS: Ion[] = [
  ion('O', '2–', 'oxyde'), ion('F', '–', 'fluorure'), ion('S', '2–', 'sulfure'), ion('Cl', '–', 'chlorure'),
  ion('NO<sub>3</sub>', '–', 'nitrate'), ion('SO<sub>4</sub>', '2–', 'sulfate'),
  ion('CO<sub>3</sub>', '2–', 'carbonate'), ion('PO<sub>4</sub>', '3–', 'phosphate'),
  ion('OH', '–', 'hydroxyde')
];

const cations = sudokuCations(CATIONS);
const anions = sudokuAnions(ANIONS);
const find = (list: SudokuIon[], plain: string, charge: number) =>
  list.find((i) => i.plain === plain && i.charge === charge)!;

// grille fixe : Ca, Na, Al, H et SO4, Cl, OH, NO3 (grille 1 du PDF)
function pdfPuzzle(): Puzzle {
  return {
    cations: [find(cations, 'Ca', 2), find(cations, 'Na', 1), find(cations, 'Al', 3), find(cations, 'H', 1)],
    anions: [find(anions, 'SO4', 2), find(anions, 'Cl', 1), find(anions, 'OH', 1), find(anions, 'NO3', 1)],
    // SO4=0 Cl=1 OH=2 NO3=3
    solution: [0, 3, 2, 1, 2, 1, 3, 0, 1, 2, 0, 3, 3, 0, 1, 2],
    givens: [true, false, false, true, false, false, false, false, false, true, false, true,
      false, false, false, false]
  };
}

describe('sudoku.logic', () => {
  it('keeps only the restricted subset of ions', () => {
    expect(cations.length).toBe(SUDOKU_CATIONS.length);
    expect(anions.length).toBe(SUDOKU_ANIONS.length);
    expect(cations.map((c) => c.plain + c.charge)).not.toContain('Cu1');
    expect(cations.map((c) => c.plain)).not.toContain('H3O');
    expect(anions.map((a) => a.plain)).not.toContain('CO3');
  });

  it('enumerates the 288 valid 4×4 grids', () => {
    const grids = solutionGrids();
    expect(grids.length).toBe(288);
    for (const g of grids.slice(0, 20)) {
      for (let r = 0; r < 4; r++) {
        expect(new Set(g.slice(r * 4, r * 4 + 4)).size).toBe(4);
        expect(new Set([0, 1, 2, 3].map((c) => g[c * 4 + r])).size).toBe(4);
        expect(new Set(g.filter((_, i) => boxOf(i) === r)).size).toBe(4);
      }
    }
  });

  it('generates puzzles with a unique solution and 4 givens', () => {
    for (let n = 0; n < 50; n++) {
      const p = newPuzzle(cations, anions);
      expect(p.givens.filter(Boolean).length).toBe(GIVENS);
      expect(countSolutions(p.solution, p.givens)).toBe(1);
      expect(new Set(p.cations).size).toBe(4);
      expect(new Set(p.anions).size).toBe(4);
    }
  });

  it('accepts the PDF grid 1 givens as a unique puzzle', () => {
    const p = pdfPuzzle();
    expect(countSolutions(p.solution, p.givens)).toBe(1);
  });

  it('computes reduced indices for every pair of the subset', () => {
    for (const c of cations) {
      for (const a of anions) {
        const [x, y] = reducedIndices(c, a);
        expect(x * c.charge).toBe(y * a.charge);
        expect(x).toBeLessThanOrEqual(MAX_COUNT);
        expect(y).toBeLessThanOrEqual(MAX_COUNT);
      }
    }
    expect(reducedIndices(find(cations, 'Mg', 2), find(anions, 'SO4', 2))).toEqual([1, 1]);
  });

  it('renders formulas with parentheses and H2O', () => {
    const p: Puzzle = {
      ...pdfPuzzle(),
      cations: [find(cations, 'Al', 3), find(cations, 'NH4', 1), find(cations, 'H', 1), find(cations, 'Ca', 2)],
      anions: [find(anions, 'SO4', 2), find(anions, 'PO4', 3), find(anions, 'OH', 1), find(anions, 'Cl', 1)]
    };
    const f = (cation: number, anion: number) => {
      const [cationCount, anionCount] = reducedIndices(p.cations[cation], p.anions[anion]);
      return formulaHtml(p, { cation, cationCount, anion, anionCount });
    };
    expect(f(0, 0)).toBe('Al<sub>2</sub>(SO<sub>4</sub>)<sub>3</sub>');
    expect(f(1, 1)).toBe('(NH<sub>4</sub>)<sub>3</sub>PO<sub>4</sub>');
    expect(f(2, 2)).toBe('H<sub>2</sub>O');
    expect(f(3, 2)).toBe('Ca(OH)<sub>2</sub>');
    expect(f(3, 3)).toBe('CaCl<sub>2</sub>');
    // non neutre : ions avec charges et coefficients
    expect(formulaHtml(p, { cation: 0, cationCount: 1, anion: null, anionCount: 0 })).toBe('Al<sup>3+</sup>');
    expect(formulaHtml(p, { cation: 0, cationCount: 1, anion: 2, anionCount: 2 }))
      .toBe('Al<sup>3+</sup> 2OH<sup>–</sup>');
    expect(formulaHtml(p, { cation: null, cationCount: 0, anion: 0, anionCount: 2 }))
      .toBe('2SO<sub>4</sub><sup>2–</sup>');
    // neutre mais non simplifié : formule
    expect(formulaHtml(p, { cation: 3, cationCount: 2, anion: 0, anionCount: 2 }))
      .toBe('Ca<sub>2</sub>(SO<sub>4</sub>)<sub>2</sub>');
  });

  it('adds units, refuses a second species and caps at 3', () => {
    let cell = emptyCell();
    cell = drop(cell, 'cation', 0).cell;
    cell = drop(cell, 'anion', 2).cell;
    cell = drop(cell, 'anion', 2).cell;
    expect(cell).toEqual({ cation: 0, cationCount: 1, anion: 2, anionCount: 2 });
    expect(drop(cell, 'anion', 1).result).toBe('mixed');
    expect(drop(cell, 'cation', 3).result).toBe('mixed');
    cell = drop(cell, 'anion', 2).cell;
    expect(cell.anionCount).toBe(3);
    expect(drop(cell, 'anion', 2).result).toBe('max');
  });

  it('colours a cell green only when neutral and simplified', () => {
    const p = pdfPuzzle(); // Ca = 0, SO4 = 0, OH = 2
    expect(cellStatus(p, emptyCell())).toBe('empty');
    expect(cellStatus(p, { cation: 0, cationCount: 1, anion: null, anionCount: 0 })).toBe('invalid');
    expect(cellStatus(p, { cation: 0, cationCount: 1, anion: 2, anionCount: 2 })).toBe('valid');
    expect(cellStatus(p, { cation: 0, cationCount: 1, anion: 2, anionCount: 1 })).toBe('invalid');
    expect(cellStatus(p, { cation: 0, cationCount: 1, anion: 0, anionCount: 1 })).toBe('valid');
    expect(cellStatus(p, { cation: 0, cationCount: 2, anion: 0, anionCount: 2 })).toBe('invalid');
  });

  it('checks the grid and reports wrong cells', () => {
    const p = pdfPuzzle();
    const cells = [...Array(CELLS).keys()].map((i) => solutionCell(p, i));
    expect(checkGrid(p, cells)).toEqual([]);
    // mauvais anion avec des indices justes en case 1 (Ca(NO3)2 → CaCl2)
    cells[1] = { cation: 0, cationCount: 1, anion: 1, anionCount: 2 };
    // mauvais cation en case 2 (boîte Na)
    cells[2] = { ...cells[2], cation: 0 };
    expect(checkGrid(p, cells)).toEqual([1, 2]);
    expect(initialCells(p).filter((c) => c.cation !== null).length).toBe(4);
  });

  it('builds box labels', () => {
    expect(boxLabel(find(cations, 'Ca', 2))).toBe('Composés du calcium');
    expect(boxLabel(find(cations, 'Al', 3))).toBe('Composés de l\'aluminium');
    expect(boxLabel(find(cations, 'NH4', 1))).toBe('Composés de l\'ammonium');
    expect(boxLabel(find(cations, 'Fe', 3))).toBe('Composés du fer (III)');
    expect(boxLabel(find(cations, 'H', 1))).toBe('Acides');
  });
});
