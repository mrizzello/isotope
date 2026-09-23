import { Component, OnDestroy, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subscription } from 'rxjs';

import { DataService } from '../../services/data.service';
import { Family } from '../../services/data.models';

import { IntroductionService } from '../../services/introduction.service';
import { ShowResultsService } from '../../services/show-results.service';

import {
  BINS,
  BIN_DISABLED_DURATION,
  ComboState,
  FallingMolecule,
  GAME_DURATION,
  GOOD_FLASH_DURATION,
  HINT_DURATION,
  LANES,
  SPECIAL_CHANCE,
  SPECIAL_SPEED_FACTOR,
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

// effet visuel éphémère, retiré de la liste à la fin de son animation CSS
interface Effect {
  id: number;
  kind: 'good' | 'bad' | 'missed' | 'burst' | 'points' | 'flash';
  left: number;   // en % de la largeur de la zone
  y: number;      // position de chute figée (0..1)
  html: string;
  special: boolean;
  dx: number;     // direction d'éjection (burst), en rem
  dy: number;
}

interface Bin {
  label: string;
  value: string;
  disabledUntil: number;  // temps de jeu, en secondes
  hintUntil: number;
  goodUntil: number;
  disabled: boolean;
  hint: boolean;
  good: boolean;
}

@Component({
    selector: 'app-family-rush',
    templateUrl: './family-rush.component.html',
    styleUrls: ['./family-rush.component.scss'],
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
export class FamilyRushComponent implements OnInit, OnDestroy {
  showIntroduction: boolean = true;
  showGame: boolean = false;
  showResults: boolean = false;
  gameOver: boolean = false;

  compounds: Family[] = [];
  bins: Bin[] = [];
  molecules: FallingMolecule[] = [];
  effects: Effect[] = [];
  selectedId: number | null = null;
  state: ComboState = initialComboState();
  remaining: number = GAME_DURATION;
  laneWidth: number = 100 / LANES;

  private elapsed: number = 0;       // temps de jeu écoulé, en secondes
  private nextSpawnAt: number = 0;
  private nextId: number = 0;
  private nextEffectId: number = 0;
  private answers: number = 0;
  private correctAnswers: number = 0;
  private frameId: number | null = null;
  private lastFrame: number | null = null;

  private startSubscription: Subscription | undefined;
  private restartSubscription: Subscription | undefined;

  constructor(
    private dataService: DataService,
    private introductionService: IntroductionService,
    private showResultsService: ShowResultsService
  ) {
    this.startSubscription = this.introductionService.getStart().subscribe((data: any) => {
      this.start();
    });
    this.introductionService.updateDisplay({
      icon: 'bolt',
      title: 'Family Rush',
      p: [
        '<b>Les composés tombent du ciel&nbsp;: triez-les avant qu\'ils ne touchent le sol&nbsp;!</b>',
        'Cliquez sur un composé, puis sur le bac de sa famille. Vous avez 60&nbsp;secondes.'
      ],
      action: 'Commencer'
    });
    this.restartSubscription = this.showResultsService.getRestart().subscribe((data: any) => {
      this.start();
    });
  }

  ngOnInit(): void {
    const familyData = this.dataService.getFamily();
    if (familyData) {
      this.compounds = familyData;
    }
  }

  ngOnDestroy(): void {
    this.stopLoop();
    this.restartSubscription?.unsubscribe();
    this.startSubscription?.unsubscribe();
  }

  get seconds(): number {
    return Math.ceil(this.remaining);
  }

  initGame() {
    this.bins = BINS.map((bin) => ({
      ...bin,
      disabledUntil: 0, hintUntil: 0, goodUntil: 0,
      disabled: false, hint: false, good: false
    }));
    this.molecules = [];
    this.effects = [];
    this.selectedId = null;
    this.state = initialComboState();
    this.remaining = GAME_DURATION;
    this.elapsed = 0;
    this.nextSpawnAt = 0;
    this.answers = 0;
    this.correctAnswers = 0;
    this.gameOver = false;
  }

  intro() {
    this.stopLoop();
    this.showIntroduction = true;
    this.showGame = false;
    this.showResults = false;
  }

  start() {
    this.initGame();
    this.showIntroduction = false;
    this.showGame = true;
    this.showResults = false;
    this.startLoop();
  }

  private startLoop() {
    this.stopLoop();
    this.lastFrame = null;
    this.frameId = requestAnimationFrame((t) => this.frame(t));
  }

  private stopLoop() {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  private frame(timestamp: number) {
    // dt borné : un onglet en arrière-plan fige le jeu au lieu de le faire sauter en avant
    const dt = this.lastFrame === null ? 0 : Math.min(0.1, (timestamp - this.lastFrame) / 1000);
    this.lastFrame = timestamp;
    this.elapsed += dt;
    this.remaining = Math.max(0, GAME_DURATION - this.elapsed);

    this.moveMolecules(dt);
    this.spawnMolecules();
    this.refreshBins();

    if (this.remaining <= 0) {
      this.finish();
      return;
    }
    this.frameId = requestAnimationFrame((t) => this.frame(t));
  }

  private moveMolecules(dt: number) {
    const speed = fallSpeed(levelFor(this.state.score));
    this.molecules.forEach((m) => {
      m.y += dt * speed * (m.special ? SPECIAL_SPEED_FACTOR : 1);
    });
    const fallen = this.molecules.filter((m) => m.y >= 1);
    if (fallen.length) {
      this.molecules = this.molecules.filter((m) => m.y < 1);
      fallen.forEach((m) => this.addMoleculeEffect(m, 'missed'));
      if (fallen.some((m) => m.id === this.selectedId)) {
        this.selectedId = null;
      }
      this.state = applyMissed(this.state);
    }
  }

  private spawnMolecules() {
    if (this.elapsed < this.nextSpawnAt || !this.compounds.length) {
      return;
    }
    const lane = freeLane(this.molecules);
    if (lane < 0) {
      return; // on réessaie à la frame suivante
    }
    const onScreen = this.molecules.map((m) => m.compound.formule);
    this.molecules.push({
      id: this.nextId++,
      compound: drawCompound(this.compounds, onScreen),
      lane,
      y: 0,
      // une seule surcharge à la fois
      special: !this.molecules.some((m) => m.special) && Math.random() < SPECIAL_CHANCE
    });
    this.nextSpawnAt = this.elapsed + spawnDelay(levelFor(this.state.score));
  }

  private refreshBins() {
    this.bins.forEach((bin) => {
      bin.disabled = this.elapsed < bin.disabledUntil;
      bin.hint = this.elapsed < bin.hintUntil;
      bin.good = this.elapsed < bin.goodUntil;
    });
  }

  selectMolecule(molecule: FallingMolecule) {
    if (this.gameOver) {
      return;
    }
    this.selectedId = this.selectedId === molecule.id ? null : molecule.id;
  }

  selectBin(bin: Bin) {
    if (this.gameOver || bin.disabled || this.selectedId === null) {
      return;
    }
    const molecule = this.molecules.find((m) => m.id === this.selectedId);
    this.selectedId = null;
    if (!molecule) {
      return;
    }
    this.answers++;
    if (molecule.compound.type === bin.value) {
      this.correctAnswers++;
      const before = this.state.score;
      this.state = applyCorrect(this.state, this.elapsed, molecule.special);
      bin.goodUntil = this.elapsed + GOOD_FLASH_DURATION;
      this.addPointsEffect(this.bins.indexOf(bin), this.state.score - before);
      this.addMoleculeEffect(molecule, 'good');
      if (molecule.special) {
        // la surcharge détruit toutes les molécules à l'écran
        this.molecules.filter((m) => m !== molecule).forEach((m) => this.addMoleculeEffect(m, 'burst'));
        this.addEffect({ kind: 'flash' });
        this.molecules = [];
      } else {
        this.molecules = this.molecules.filter((m) => m !== molecule);
      }
    } else {
      this.addMoleculeEffect(molecule, 'bad');
      this.state = applyWrong(this.state);
      bin.disabledUntil = this.elapsed + BIN_DISABLED_DURATION;
      const rightBin = this.bins.find((b) => b.value === molecule.compound.type);
      if (rightBin) {
        rightBin.hintUntil = this.elapsed + HINT_DURATION;
      }
      this.molecules = this.molecules.filter((m) => m !== molecule);
    }
    this.refreshBins();
  }

  moleculeLeft(lane: number): number {
    return (lane + 0.5) * this.laneWidth;
  }

  // top d'un élément de 3rem de haut dont la chute va de 0 (haut) à 1 (sol)
  moleculeTop(y: number): string {
    return 'calc(' + y * 100 + '% - ' + y * 3 + 'rem)';
  }

  removeEffect(effect: Effect) {
    this.effects = this.effects.filter((e) => e !== effect);
  }

  private addEffect(effect: Partial<Effect>) {
    this.effects.push({
      id: this.nextEffectId++, kind: 'flash', left: 50, y: 0, html: '', special: false, dx: 0, dy: 0,
      ...effect
    });
  }

  private addMoleculeEffect(molecule: FallingMolecule, kind: 'good' | 'bad' | 'missed' | 'burst') {
    const angle = Math.random() * 2 * Math.PI;
    this.addEffect({
      kind,
      left: this.moleculeLeft(molecule.lane),
      y: Math.min(1, molecule.y),
      html: molecule.compound.formule,
      special: molecule.special,
      dx: Math.cos(angle) * 8,
      dy: Math.sin(angle) * 8 - 4 // légèrement vers le haut
    });
  }

  // « +n » qui s'élève depuis le bac, dont le centre est à (i + 0,5) / 5 de la largeur
  private addPointsEffect(binIndex: number, gain: number) {
    this.addEffect({ kind: 'points', left: (binIndex + 0.5) * 100 / this.bins.length, y: 1, html: '+' + gain });
  }

  private finish() {
    this.stopLoop();
    this.gameOver = true;
    this.selectedId = null;
  }

  end() {
    this.showGame = false;
    this.showResults = true;
    const accuracy = this.answers ? Math.round(100 * this.correctAnswers / this.answers) : 0;
    let display: any = [];
    display.title = 'Family Rush';
    display.game = 'family-rush';
    display.points = this.state.score;
    display.scores = [
      { label: 'Score', value: this.state.score, css: 'human' },
      { label: 'Précision', value: accuracy + '%', css: 'algo' },
      { label: 'Combo max', value: this.state.bestCombo, css: 'algo' }
    ];
    this.showResultsService.updateDisplay(display);
  }
}
