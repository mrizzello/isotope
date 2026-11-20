import { Component, OnDestroy } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subscription } from 'rxjs';

import { DataService } from '../../services/data.service';
import { IntroductionService } from '../../services/introduction.service';
import { ShowResultsService } from '../../services/show-results.service';

import {
  CELLS,
  Cell,
  CellStatus,
  MAX_COUNT,
  Puzzle,
  SudokuIon,
  boxLabel,
  boxOf,
  cellStatus,
  chargeLabel,
  checkGrid,
  drop,
  emptyCell,
  formulaHtml,
  ionHtml,
  initialCells,
  isEmpty,
  isNeutral,
  newPuzzle,
  sudokuAnions,
  sudokuCations
} from './sudoku.logic';

export type Tool = { kind: 'cation' | 'anion'; index: number } | { kind: 'erase' };

@Component({
    selector: 'app-sudoku',
    templateUrl: './sudoku.component.html',
    styleUrls: ['./sudoku.component.scss'],
    animations: [
        trigger('slideInFromLeft', [
            transition(':enter', [
                style({ transform: 'translateX(-100%)' }),
                animate('300ms ease-out', style({ transform: 'translateX(0)' }))
            ])
        ]),
        trigger('slideInFromRight', [
            transition(':enter', [
                style({ transform: 'translateX(100%)' }),
                animate('300ms ease-out', style({ transform: 'translateX(0)' }))
            ])
        ])
    ],
    standalone: false
})
export class SudokuComponent implements OnDestroy {
  showIntroduction: boolean = true;
  showGame: boolean = false;
  showResults: boolean = false;

  cations: SudokuIon[] = [];
  anions: SudokuIon[] = [];
  puzzle: Puzzle | null = null;
  cells: Cell[] = [];
  wrong = new Set<number>(); // cases marquées fausses par la dernière vérification
  tool: Tool | null = null;
  message = '';
  checks = 0;

  readonly indexes = [...Array(CELLS).keys()];

  private startSubscription: Subscription;
  private restartSubscription: Subscription;

  constructor(
    private dataService: DataService,
    private introductionService: IntroductionService,
    private showResultsService: ShowResultsService
  ) {
    const ions = this.dataService.getIons();
    if (ions) {
      this.cations = sudokuCations(ions.cations);
      this.anions = sudokuAnions(ions.anions);
    }
    this.startSubscription = this.introductionService.getStart().subscribe(() => this.start());
    this.introductionService.updateDisplay({
      icon: 'grid_on',
      title: 'Sudoku ionique',
      p: [
        '<b>Chaque ligne, colonne et boîte 2×2 contient une fois chacun des 4 anions.</b>',
        'Chaque boîte regroupe les composés d\'un même cation.',
        'Touchez un ion en bas de l\'écran, puis touchez une case&nbsp;: chaque toucher ajoute une unité '
        + 'de cet ion.'
      ],
      action: 'Commencer'
    });
    this.restartSubscription = this.showResultsService.getRestart().subscribe(() => this.start());
  }

  ngOnDestroy(): void {
    this.startSubscription?.unsubscribe();
    this.restartSubscription?.unsubscribe();
  }

  intro() {
    this.showIntroduction = true;
    this.showGame = false;
    this.showResults = false;
  }

  start() {
    this.puzzle = newPuzzle(this.cations, this.anions);
    this.cells = initialCells(this.puzzle);
    this.wrong.clear();
    this.tool = null;
    this.message = 'Touchez un ion, puis une case.';
    this.checks = 0;
    this.showIntroduction = false;
    this.showGame = true;
    this.showResults = false;
  }

  // ---- affichage ----

  label(box: number): string {
    return this.puzzle ? boxLabel(this.puzzle.cations[box]) : '';
  }

  box(cell: number): number {
    return boxOf(cell);
  }

  // case non neutre : cation en haut à gauche, anion en bas à droite
  ionPart(cell: number, kind: 'cation' | 'anion'): string {
    return this.puzzle ? ionHtml(this.puzzle, this.cells[cell], kind) : '';
  }

  formula(cell: number): string {
    return this.puzzle ? formulaHtml(this.puzzle, this.cells[cell]) : '';
  }

  // case en cours de construction, non neutre : ions et charges séparés
  ionic(cell: number): boolean {
    return !!this.puzzle && !isEmpty(this.cells[cell]) && !isNeutral(this.puzzle, this.cells[cell]);
  }

  status(cell: number): CellStatus {
    return this.puzzle ? cellStatus(this.puzzle, this.cells[cell]) : 'empty';
  }

  charge(ion: SudokuIon, sign: '+' | '–'): string {
    return chargeLabel(ion, sign);
  }

  isSelected(kind: 'cation' | 'anion' | 'erase', index = -1): boolean {
    if (!this.tool || this.tool.kind !== kind) {
      return false;
    }
    return this.tool.kind === 'erase' || this.tool.index === index;
  }

  get filled(): boolean {
    return !!this.puzzle && this.cells.every((cell) => !isEmpty(cell));
  }

  // ---- actions ----

  selectIon(kind: 'cation' | 'anion', index: number) {
    this.tool = this.isSelected(kind, index) ? null : { kind, index };
    this.message = this.tool ? 'Touchez une case pour y ajouter cet ion.' : '';
  }

  selectErase() {
    this.tool = this.isSelected('erase') ? null : { kind: 'erase' };
    this.message = this.tool ? 'Touchez une case pour la vider.' : '';
  }

  touchCell(index: number) {
    if (!this.puzzle || this.puzzle.givens[index]) {
      return;
    }
    if (!this.tool) {
      this.message = 'Touchez d\'abord un ion en bas de l\'écran.';
      return;
    }
    if (this.tool.kind === 'erase') {
      this.setCell(index, emptyCell());
      return;
    }
    const { cell, result } = drop(this.cells[index], this.tool.kind, this.tool.index);
    if (result === 'mixed') {
      this.message = 'Cette case contient déjà un autre ' + this.tool.kind + '. Effacez-la d\'abord.';
    } else if (result === 'max') {
      this.message = 'Pas plus de ' + MAX_COUNT + ' unités du même ion par case.';
    } else {
      this.setCell(index, cell);
    }
  }

  private setCell(index: number, cell: Cell) {
    this.cells = this.cells.map((c, i) => (i === index ? cell : c));
    this.wrong.delete(index);
    this.message = '';
  }

  check() {
    if (!this.puzzle || !this.filled) {
      return;
    }
    this.checks++;
    const wrong = checkGrid(this.puzzle, this.cells);
    this.wrong = new Set(wrong);
    if (wrong.length === 0) {
      this.end();
      return;
    }
    this.message = wrong.length === 1 ? '1 case est fausse.' : wrong.length + ' cases sont fausses.';
  }

  end() {
    this.showGame = false;
    this.showResults = true;
    let display: any = [];
    display.title = 'Grille résolue&nbsp;!';
    display.comment = this.checks === 1 ? 'Du premier coup' : this.checks + ' vérifications';
    display.game = 'sudoku';
    display.noScore = true; // pas d'enregistrement sur la page des scores
    this.showResultsService.updateDisplay(display);
  }

}
