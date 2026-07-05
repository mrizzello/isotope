import { Component, OnDestroy, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subscription } from 'rxjs';

import { DataService } from '../../services/data.service';
import { HexaIons } from '../../services/data.models';

import { IntroductionService } from '../../services/introduction.service';
import { ShowResultsService } from '../../services/show-results.service';
import { ScoresService } from '../../services/scores.service';

import {
  GRID_RADIUS,
  HEX_SIZE,
  HexCell,
  HexTile,
  PlayerId,
  bestPlacement,
  buildGrid,
  drawRandomIon,
  findMolecule,
  isAcidSalt,
  makeTile,
  moleculePoints
} from './hexaions.logic';

@Component({
    selector: 'app-hexaions',
    templateUrl: './hexaions.component.html',
    styleUrls: ['./hexaions.component.scss'],
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
        ]),
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('300ms ease-in', style({ opacity: 1 }))
            ])
        ])
    ],
    standalone: false
})
export class HexaionsComponent implements OnInit, OnDestroy {
  showIntroduction: boolean = true;
  showGame: boolean = false;
  showResults: boolean = false;
  disableClick: boolean = false;

  ions: HexaIons | null = null;
  cells: HexCell[] = [];
  drawnTile: HexTile | null = null;
  currentPlayer: PlayerId = 'human';
  points: Record<PlayerId, number> = { human: 0, algo: 0 };
  statusText: string = '';
  viewBox: string = '0 0 10 10';
  previewCell: HexCell = buildGrid(0, HEX_SIZE)[0];
  previewViewBox: string = '-34 -34 68 68';
  algoDelay: number = 1000;
  gridRadius: number = GRID_RADIUS;

  private startSubscription: Subscription | undefined;
  private restartSubscription: Subscription | undefined;

  constructor(
    private dataService: DataService,
    private introductionService: IntroductionService,
    private showResultsService: ShowResultsService,
    private scoresService: ScoresService
  ) {
    this.startSubscription = this.introductionService.getStart().subscribe((data: any) => {
      if (typeof data === 'number') {
        this.gridRadius = data;
      }
      this.start();
    });
    this.introductionService.updateDisplay({
      icon: 'hexagon',
      title: 'HexaIons',
      p: [
        '<b>Formez des molécules électriquement neutres&nbsp;!</b>',
        'À tour de rôle, posez l\'ion tiré au sort sur la grille. Quand des ions voisins '
        + 's\'assemblent en une molécule neutre, ils sont capturés et rapportent '
        + 'autant de points que d\'ions assemblés.',
        'La partie se termine quand la grille est pleine. Le plus grand total de points gagne&nbsp;!'
      ],
      action: 'Commencer',
      choices: [
        { label: 'Grille L', value: 2 },
        { label: 'Grille XL', value: 3 }
      ]
    });
    this.restartSubscription = this.showResultsService.getRestart().subscribe((data: any) => {
      this.start();
    });
  }

  ngOnInit(): void {
    const hexaionsData = this.dataService.getHexaions();
    if (hexaionsData) {
      this.ions = hexaionsData;
    }
  }

  ngOnDestroy(): void {
    this.restartSubscription?.unsubscribe();
    this.startSubscription?.unsubscribe();
  }

  initGame() {
    this.cells = buildGrid(this.gridRadius, HEX_SIZE);
    const xs = this.cells.map((c) => c.x);
    const ys = this.cells.map((c) => c.y);
    const margin = HEX_SIZE + 4;
    const minX = Math.min(...xs) - margin;
    const minY = Math.min(...ys) - margin;
    this.viewBox = minX + ' ' + minY + ' '
      + (Math.max(...xs) + margin - minX) + ' ' + (Math.max(...ys) + margin - minY);

    this.points = { human: 0, algo: 0 };
    this.statusText = '';
    this.currentPlayer = 'human';
    this.disableClick = false;
    this.drawnTile = this.ions ? makeTile(drawRandomIon(this.ions)) : null;
  }

  intro() {
    if (!this.disableClick) {
      this.showIntroduction = true;
      this.showGame = false;
      this.showResults = false;
      this.disableClick = false;
    }
  }

  start() {
    this.initGame();
    this.showIntroduction = false;
    this.showGame = true;
    this.showResults = false;
  }

  selectCell(index: number) {
    if (this.disableClick || this.currentPlayer !== 'human' || !this.drawnTile) {
      return;
    }
    if (this.cells[index].tile !== null) {
      return;
    }
    this.place(index, 'human');
    this.nextTurn('algo');
  }

  private place(index: number, player: PlayerId) {
    this.cells[index].tile = this.drawnTile;
    this.drawnTile = null;
    const molecule = findMolecule(this.cells, index);
    if (molecule) {
      const points = moleculePoints(this.cells, molecule);
      const acidSalt = isAcidSalt(this.cells, molecule);
      molecule.forEach((i) => this.cells[i].frozenBy = player);
      this.points[player] += points;
      this.statusText = 'Molécule de ' + molecule.length + ' ions'
        + (acidSalt ? ' (sel acide, bonus +2)' : '') + ' : +' + points
        + (player === 'human' ? ' points pour toi !' : ' points pour le robot.');
    }
  }

  private nextTurn(player: PlayerId) {
    if (this.isGridFull()) {
      this.disableClick = true;
      setTimeout(() => this.end(), 1200);
      return;
    }
    this.currentPlayer = player;
    this.drawnTile = this.ions ? makeTile(drawRandomIon(this.ions)) : null;
    if (player === 'algo') {
      this.disableClick = true;
      setTimeout(() => this.algoPlay(), this.algoDelay);
    } else {
      this.disableClick = false;
    }
  }

  private algoPlay() {
    if (!this.drawnTile) {
      return;
    }
    const placement = bestPlacement(this.cells, this.drawnTile);
    this.place(placement.index, 'algo');
    this.nextTurn('human');
  }

  private isGridFull(): boolean {
    return this.cells.every((cell) => cell.tile !== null);
  }

  end() {
    this.showGame = false;
    this.showResults = true;
    const human = this.points.human;
    const algo = this.points.algo;

    // bilan cumulé des parties, affiché sur la page des scores
    const record = this.scoresService.getItem('hexaionsRecord') || { won: 0, lost: 0, draws: 0 };
    if (human > algo) {
      record.won++;
    } else if (human < algo) {
      record.lost++;
    } else {
      record.draws++;
    }
    this.scoresService.setItem('hexaionsRecord', record);

    let display: any = [];
    display.title = human > algo ? 'Victoire&nbsp;!' : human < algo ? 'Petite défaite…' : 'Égalité&nbsp;!';
    display.bestScoreText = human > algo ? 'Une victoire supplémentaire&nbsp;!' : human < algo ? 'Tu ne pers riend de ton charme&nbsp;!' : '';
    if (human !== algo) {
      display.forceBestScore = true;
    }
    display.game = 'hexaions';
    display.points = human;
    display.scores = [
      { label: 'Robot', value: algo, css: 'algo' },
      { label: 'Joueur', value: human, css: 'human' }
    ];
    this.showResultsService.updateDisplay(display);
  }

}
