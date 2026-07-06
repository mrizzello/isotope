import { HexaIon } from '../../services/data.models';
import {
  buildGrid,
  drawRandomIon,
  findMolecule,
  fontScale,
  makeTile,
  moleculeFormula,
  moleculePoints,
  parseCharge,
  parseSymbol,
  GRID_RADIUS,
  HEX_SIZE,
  HexCell
} from './hexaions.logic';

function ion(symbol: string, charge: string): HexaIon {
  return { symbol, charge };
}

const NA = ion('Na', '+');
const K = ion('K', '+');
const LI = ion('Li', '+');
const NH4 = ion('NH<sub>4</sub>', '+');
const CA = ion('Ca', '2+');
const H = ion('H', '+');
const CU1 = ion('Cu', '+');
const CU2 = ion('Cu', '2+');
const IO = ion('IO', '–');
const MG = ion('Mg', '2+');
const BA = ion('Ba', '2+');
const FE3 = ion('Fe', '3+');
const CL = ion('Cl', '–');
const OH = ion('OH', '–');
const O = ion('O', '2–');
const S = ion('S', '2–');
const CO3 = ion('CO<sub>3</sub>', '2–');
const SO4 = ion('SO<sub>4</sub>', '2–');
const SO3 = ion('SO<sub>3</sub>', '2–');
const PO4 = ion('PO<sub>4</sub>', '3–');
const PO3 = ion('PO<sub>3</sub>', '3–');

// Place des ions sur des cases adjacentes en chaîne autour du centre,
// retourne l'index de la dernière case remplie.
function placeChain(cells: HexCell[], ions: HexaIon[]): number {
  const center = cells.findIndex((c) => c.q === 0 && c.r === 0);
  // parcours en spirale : centre puis voisins directs puis couronne suivante
  const dist = (i: number) => Math.max(
    Math.abs(cells[i].q), Math.abs(cells[i].r), Math.abs(cells[i].q + cells[i].r)
  );
  const order = [...cells.keys()].sort((a, b) => dist(a) - dist(b));
  const chain = [center, ...order.filter((i) => i !== center)];
  let last = center;
  ions.forEach((item: HexaIon, i: number) => {
    cells[chain[i]].tile = makeTile(item);
    last = chain[i];
  });
  return last;
}

// Place des ions à des coordonnées axiales explicites,
// retourne l'index de la dernière case remplie.
function placeAt(cells: HexCell[], placements: [number, number, HexaIon][]): number {
  let last = -1;
  placements.forEach(([q, r, item]) => {
    last = cells.findIndex((c) => c.q === q && c.r === r);
    cells[last].tile = makeTile(item);
  });
  return last;
}

describe('hexaions.logic', () => {

  describe('parseCharge', () => {
    it('parses signed charges', () => {
      expect(parseCharge('+')).toBe(1);
      expect(parseCharge('2+')).toBe(2);
      expect(parseCharge('–')).toBe(-1);
      expect(parseCharge('3–')).toBe(-3);
    });
  });

  describe('parseSymbol', () => {
    it('splits sub segments', () => {
      expect(parseSymbol('SO<sub>4</sub>')).toEqual([
        { text: 'SO', kind: 'normal' },
        { text: '4', kind: 'sub' }
      ]);
    });
  });

  describe('fontScale', () => {
    it('grows with the grid radius, from 1 for Grille M', () => {
      expect(fontScale(2)).toBe(1);
      expect(fontScale(3)).toBeCloseTo(1.15);
      expect(fontScale(4)).toBeCloseTo(1.3);
    });
  });

  describe('makeTile', () => {
    it('scales the font size and keeps offsets proportional', () => {
      const plain = makeTile(SO4);
      const scaled = makeTile(SO4, 1.3);
      expect(scaled.fontSize).toBeCloseTo(plain.fontSize * 1.3);
      scaled.segments.forEach((seg, i) => {
        expect(seg.fontSize).toBeCloseTo(plain.segments[i].fontSize! * 1.3);
        expect(seg.dy).toBeCloseTo(plain.segments[i].dy! * 1.3);
      });
    });
  });

  describe('buildGrid', () => {
    it('builds 19 cells for radius 2 (Grille L)', () => {
      expect(buildGrid(2, HEX_SIZE).length).toBe(19);
    });

    it('builds 37 cells for radius 3 (Grille XL)', () => {
      expect(buildGrid(3, HEX_SIZE).length).toBe(37);
    });
  });

  describe('drawRandomIon', () => {
    it('draws cations/anions evenly and weights mono > di > tri', () => {
      const ions = {
        cations: [ion('X', '+'), ion('Y', '2+'), ion('Z', '3+')],
        anions: [ion('A', '–'), ion('B', '2–'), ion('C', '3–')]
      };
      const counts: Record<string, number> = {};
      let cations = 0;
      const n = 12000;
      for (let i = 0; i < n; i++) {
        const drawn = drawRandomIon(ions);
        counts[drawn.symbol] = (counts[drawn.symbol] || 0) + 1;
        if (drawn.charge.includes('+')) {
          cations++;
        }
      }
      // équilibre cations/anions (50/50 strict, tolérance statistique)
      expect(cations / n).toBeGreaterThan(0.45);
      expect(cations / n).toBeLessThan(0.55);
      // pondération par valence des deux côtés
      expect(counts['X']).toBeGreaterThan(counts['Y']);
      expect(counts['Y']).toBeGreaterThan(counts['Z']);
      expect(counts['A']).toBeGreaterThan(counts['B']);
      expect(counts['B']).toBeGreaterThan(counts['C']);
    });
  });

  describe('moleculeFormula', () => {
    let cells: HexCell[];

    beforeEach(() => {
      cells = buildGrid(GRID_RADIUS, HEX_SIZE);
    });

    it('writes the cation first (NaCl)', () => {
      const placed = placeChain(cells, [CL, NA]);
      const molecule = findMolecule(cells, placed)!;
      expect(moleculeFormula(cells, molecule)).toBe('NaCl');
    });

    it('adds indices as <sub> (Fe2O3)', () => {
      const placed = placeChain(cells, [FE3, O, FE3, O, O]);
      const molecule = findMolecule(cells, placed)!;
      expect(moleculeFormula(cells, molecule)).toBe('Fe<sub>2</sub>O<sub>3</sub>');
    });

    it('wraps repeated polyatomic ions in parentheses (Ba(OH)2)', () => {
      const placed = placeChain(cells, [OH, BA, OH]);
      const molecule = findMolecule(cells, placed)!;
      expect(moleculeFormula(cells, molecule)).toBe('Ba(OH)<sub>2</sub>');
    });

    it('keeps inner subscripts and parenthesizes (Mg3(PO4)2)', () => {
      const placed = placeAt(cells, [
        [0, 0, PO4], [1, 0, MG], [0, 1, MG], [-1, 0, MG], [-1, 1, PO4]
      ]);
      const molecule = findMolecule(cells, placed)!;
      expect(moleculeFormula(cells, molecule))
        .toBe('Mg<sub>3</sub>(PO<sub>4</sub>)<sub>2</sub>');
    });

    it('puts H after the other cations in acid salts (Na2HPO4)', () => {
      const placed = placeAt(cells, [[0, 0, PO4], [1, 0, NA], [0, 1, NA], [-1, 0, H]]);
      const molecule = findMolecule(cells, placed)!;
      expect(moleculeFormula(cells, molecule)).toBe('Na<sub>2</sub>HPO<sub>4</sub>');
    });

    it('parenthesizes repeated NH4 and puts H last ((NH4)2HPO4)', () => {
      const placed = placeAt(cells, [[0, 0, PO4], [1, 0, NH4], [0, 1, NH4], [-1, 0, H]]);
      const molecule = findMolecule(cells, placed)!;
      expect(moleculeFormula(cells, molecule))
        .toBe('(NH<sub>4</sub>)<sub>2</sub>HPO<sub>4</sub>');
    });

    it('indexes repeated H in acid salts (NaH2PO4)', () => {
      const placed = placeAt(cells, [[0, 0, PO4], [1, 0, NA], [0, 1, H], [-1, 0, H]]);
      const molecule = findMolecule(cells, placed)!;
      expect(moleculeFormula(cells, molecule)).toBe('NaH<sub>2</sub>PO<sub>4</sub>');
    });
  });

  describe('findMolecule', () => {
    let cells: HexCell[];

    beforeEach(() => {
      cells = buildGrid(GRID_RADIUS, HEX_SIZE);
    });

    it('forms NaCl (2 points)', () => {
      const placed = placeChain(cells, [NA, CL]);
      expect(findMolecule(cells, placed)?.length).toBe(2);
    });

    it('forms Ba(OH)2 (3 points)', () => {
      const placed = placeChain(cells, [OH, BA, OH]);
      expect(findMolecule(cells, placed)?.length).toBe(3);
    });

    it('forms MgO (2 points)', () => {
      const placed = placeChain(cells, [MG, O]);
      expect(findMolecule(cells, placed)?.length).toBe(2);
    });

    it('forms Fe2O3 (5 points)', () => {
      const placed = placeChain(cells, [FE3, O, FE3, O, O]);
      expect(findMolecule(cells, placed)?.length).toBe(5);
    });

    it('forms NaHCO3 (3 points, sel acide de la liste blanche)', () => {
      const placed = placeChain(cells, [NA, CO3, H]);
      expect(findMolecule(cells, placed)?.length).toBe(3);
    });

    it('forms NaHSO4 (3 points, sel acide de la liste blanche)', () => {
      const placed = placeAt(cells, [[0, 0, SO4], [1, 0, NA], [0, 1, H]]);
      expect(findMolecule(cells, placed)?.length).toBe(3);
    });

    it('forms Na2HPO4 (4 points, sel acide de la liste blanche)', () => {
      const placed = placeAt(cells, [[0, 0, PO4], [1, 0, NA], [0, 1, NA], [-1, 0, H]]);
      expect(findMolecule(cells, placed)?.length).toBe(4);
    });

    it('forms NaH2PO4 (4 points, sel acide de la liste blanche)', () => {
      const placed = placeAt(cells, [[0, 0, PO4], [1, 0, NA], [0, 1, H], [-1, 0, H]]);
      expect(findMolecule(cells, placed)?.length).toBe(4);
    });

    it('forms NaHSO3, Na2HPO3 et NaH2PO3 (sels acides de la liste blanche)', () => {
      let placed = placeAt(cells, [[0, 0, SO3], [1, 0, NA], [0, 1, H]]);
      expect(findMolecule(cells, placed)?.length).toBe(3);

      cells.forEach((c) => { c.tile = null; });
      placed = placeAt(cells, [[0, 0, PO3], [1, 0, NA], [0, 1, NA], [-1, 0, H]]);
      expect(findMolecule(cells, placed)?.length).toBe(4);

      cells.forEach((c) => { c.tile = null; });
      placed = placeAt(cells, [[0, 0, PO3], [1, 0, NA], [0, 1, H], [-1, 0, H]]);
      expect(findMolecule(cells, placed)?.length).toBe(4);
    });

    it('forms the K+ analogues (KHCO3, KH2PO4)', () => {
      let placed = placeAt(cells, [[0, 0, CO3], [1, 0, K], [0, 1, H]]);
      expect(findMolecule(cells, placed)?.length).toBe(3);

      cells.forEach((c) => { c.tile = null; });
      placed = placeAt(cells, [[0, 0, PO4], [1, 0, K], [0, 1, H], [-1, 0, H]]);
      expect(findMolecule(cells, placed)?.length).toBe(4);
    });

    it('forms the NH4+ analogues (NH4HSO4, (NH4)2HPO4)', () => {
      let placed = placeAt(cells, [[0, 0, SO4], [1, 0, NH4], [0, 1, H]]);
      expect(findMolecule(cells, placed)?.length).toBe(3);

      cells.forEach((c) => { c.tile = null; });
      placed = placeAt(cells, [[0, 0, PO4], [1, 0, NH4], [0, 1, NH4], [-1, 0, H]]);
      expect(findMolecule(cells, placed)?.length).toBe(4);
    });

    it('forms the hydrogen sulfides (NaHS)', () => {
      const placed = placeAt(cells, [[0, 0, S], [1, 0, NA], [0, 1, H]]);
      expect(findMolecule(cells, placed)?.length).toBe(3);
    });

    it('forms the calcium acid phosphates (CaHPO4, Ca(H2PO4)2)', () => {
      let placed = placeAt(cells, [[0, 0, PO4], [1, 0, CA], [0, 1, H]]);
      expect(findMolecule(cells, placed)?.length).toBe(3);

      cells.forEach((c) => { c.tile = null; });
      placed = placeAt(cells, [
        [0, 0, PO4], [2, 0, PO4], [-1, 0, H], [0, -1, H], [2, -1, H], [2, 1, H], [1, 0, CA]
      ]);
      expect(findMolecule(cells, placed)?.length).toBe(7);
    });

    it('rejects LiHCO3 (sel acide hors liste blanche)', () => {
      const placed = placeAt(cells, [[0, 0, CO3], [1, 0, LI], [0, 1, H]]);
      expect(findMolecule(cells, placed)).toBeNull();
    });

    it('awards bonus points for acid salts and molecules with 3+ ions', () => {
      // sel acide (3 ions) : 3 ions + 3 (sel acide) + 2 (3+ ions) = 8 points
      let placed = placeAt(cells, [[0, 0, CO3], [1, 0, NA], [0, 1, H]]);
      let molecule = findMolecule(cells, placed)!;
      expect(moleculePoints(cells, molecule)).toBe(8); // NaHCO3 : 8

      // sel acide (4 ions) : 4 ions + 3 (sel acide) + 2 (3+ ions) = 9 points
      cells.forEach((c) => { c.tile = null; });
      placed = placeAt(cells, [[0, 0, PO4], [1, 0, NA], [0, 1, NA], [-1, 0, H]]);
      molecule = findMolecule(cells, placed)!;
      expect(moleculePoints(cells, molecule)).toBe(9); // Na2HPO4 : 9

      // molécule ordinaire (2 ions) : pas de bonus = 2 points
      cells.forEach((c) => { c.tile = null; });
      placed = placeAt(cells, [[0, 0, NA], [1, 0, CL]]);
      molecule = findMolecule(cells, placed)!;
      expect(moleculePoints(cells, molecule)).toBe(2); // NaCl : 2

      // molécule ordinaire (3 ions) : 3 ions + 2 (3+ ions) = 5 points
      cells.forEach((c) => { c.tile = null; });
      placed = placeAt(cells, [[0, 0, BA], [1, 0, OH], [0, 1, OH]]);
      molecule = findMolecule(cells, placed)!;
      expect(moleculePoints(cells, molecule)).toBe(5); // Ba(OH)2 : 5
    });

    it('rejects CuHBO3 (bug rapporté : BO3^3- + Cu2+ + H+)', () => {
      const BO3 = ion('BO<sub>3</sub>', '3–');
      const CU2b = ion('Cu', '2+');
      const placed = placeAt(cells, [[0, 0, BO3], [1, 0, CU2b], [0, 1, H]]);
      expect(findMolecule(cells, placed)).toBeNull();
    });

    it('rejects a single ion', () => {
      const placed = placeChain(cells, [NA]);
      expect(findMolecule(cells, placed)).toBeNull();
    });

    it('rejects a non-neutral group', () => {
      const placed = placeChain(cells, [MG, CL]);
      expect(findMolecule(cells, placed)).toBeNull();
    });

    it('rejects two mixed cation species (NaCuS)', () => {
      const placed = placeChain(cells, [NA, S, CU1]);
      expect(findMolecule(cells, placed)).toBeNull();
    });

    it('rejects Na+ K+ S2-', () => {
      const placed = placeChain(cells, [NA, S, K]);
      expect(findMolecule(cells, placed)).toBeNull();
    });

    it('picks the neutral subset, ignoring extra tiles (NaCl + Na)', () => {
      const placed = placeChain(cells, [NA, NA, CL]);
      const molecule = findMolecule(cells, placed);
      expect(molecule?.length).toBe(2);
    });

    it('rejects an anion linked only through another anion (IO–IO–Cu chain)', () => {
      // bug rapporté : Cu2+ validé avec deux IO– dont un seul adjacent au cation
      const placed = placeAt(cells, [[0, 0, CU2], [1, 0, IO], [2, 0, IO]]);
      expect(findMolecule(cells, placed)).toBeNull();
      // même verdict quand c'est le cation qui vient d'être posé
      cells.forEach((c) => { c.tile = null; });
      const placedCation = placeAt(cells, [[1, 0, IO], [2, 0, IO], [0, 0, CU2]]);
      expect(findMolecule(cells, placedCation)).toBeNull();
    });

    it('accepts Cu(IO)2 when both anions touch the cation', () => {
      const placed = placeAt(cells, [[0, 0, CU2], [1, 0, IO], [0, 1, IO]]);
      expect(findMolecule(cells, placed)?.length).toBe(3);
    });

    it('accepts an alternating cation–anion chain (OH–Ba–OH)', () => {
      const placed = placeAt(cells, [[-1, 0, OH], [0, 0, BA], [1, 0, OH]]);
      expect(findMolecule(cells, placed)?.length).toBe(3);
    });

    it('ignores frozen tiles', () => {
      const placed = placeChain(cells, [NA, CL]);
      cells.forEach((c) => {
        if (c.tile) {
          c.frozenBy = 'human';
        }
      });
      cells[placed].frozenBy = null;
      expect(findMolecule(cells, placed)).toBeNull();
    });
  });

});
