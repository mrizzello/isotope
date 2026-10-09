import { Component, OnDestroy, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subscription } from 'rxjs';

import { DataService } from '../../services/data.service';
import { Ions } from '../../services/data.models';

import { IntroductionService } from '../../services/introduction.service';
import { StopwatchService } from '../../services/stopwatch.service';
import { ShowResultsService } from '../../services/show-results.service';

import {
  ChargesItem, IONS_PER_GAME, PENALTY_MS, Proposition,
  batteryColor, drawGame, formulaSizeClass
} from './charges.logic';

// positions des 4 bulles sur l'arche /‾‾\ (viewBox 360 × 400)
const ARCH = [
  { x: 50, y: 205 },
  { x: 129, y: 139 },
  { x: 231, y: 139 },
  { x: 310, y: 205 }
];
const BUBBLES = 24;
const NEXT_DELAY = 600;     // ms entre la bonne réponse et l'ion suivant
const PENALTY_LIFE = 900;   // ms d'affichage du « +3 s »

interface Penalty {
  id: number;
  x: number;
  y: number;
}

interface BgBubble {
  cx: number;
  cy: number;
  r: number;
  duration: number;
  delay: number;
}

@Component({
    selector: 'app-charges',
    templateUrl: './charges.component.html',
    styleUrls: ['./charges.component.scss'],
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
export class ChargesComponent implements OnInit, OnDestroy {
  showIntroduction: boolean = true;
  showGame: boolean = false;
  showResults: boolean = false;
  disableClick: boolean = false;
  ions: Ions | null = null;
  draw: ChargesItem[] = [];
  score: number = 0;
  current: number = 0;
  maxScore: number = IONS_PER_GAME;
  correct: boolean = false;
  arch = ARCH;
  penaltySeconds = PENALTY_MS / 1000;
  bubbles: BgBubble[] = [];
  penalties: Penalty[] = [];
  private penaltyId = 0;
  private timeouts: ReturnType<typeof setTimeout>[] = [];

  private startSubscription: Subscription | undefined;
  private restartSubscription: Subscription | undefined;

  constructor(
    private dataService: DataService,
    private introductionService: IntroductionService,
    private stopwatchService: StopwatchService,
    private showResultsService: ShowResultsService
  ) {
    this.startSubscription = this.introductionService.getStart().subscribe((data: any) => {
      this.start();
    });
    this.introductionService.updateDisplay({
      icon: 'add_circle_outline',
      title: 'Charges',
      p: [
        '<b>Rechargez votre batterie&nbsp!</b>',
        'Trouvez la charge de 10 ions, du plus simple au plus corsé.',
        'Chaque erreur coûte 3&nbsp;secondes&nbsp;!'
      ]
    });
    this.restartSubscription = this.showResultsService.getRestart().subscribe((data: any) => {
      this.start();
    });
  }

  ngOnInit(): void {
    this.ions = this.dataService.getIons() ?? null;
  }

  ngOnDestroy(): void {
    this.restartSubscription?.unsubscribe();
    this.startSubscription?.unsubscribe();
    this.clearTimeouts();
    this.stopwatchService.stopStopwatch();
  }

  get item(): ChargesItem | undefined {
    return this.draw[this.current];
  }

  get batteryLevel(): number {
    return 100 * this.score / IONS_PER_GAME;
  }

  get batteryColor(): string {
    return batteryColor(this.score);
  }

  formulaSize(item: ChargesItem): string {
    return formulaSizeClass(item.symbol);
  }

  initGame() {
    this.clearTimeouts();
    this.score = 0;
    this.current = 0;
    this.correct = false;
    this.penalties = [];
    this.stopwatchService.stopStopwatch();
    this.stopwatchService.resetStopwatch();
    this.draw = this.ions ? drawGame(this.ions.cations, this.ions.anions) : [];
    this.bubbles = Array.from({ length: BUBBLES }, () => ({
      cx: Math.random() * 360,
      cy: Math.random() * 400,
      r: 8 + Math.random() * 42,
      duration: 6 + Math.random() * 10,
      delay: -Math.random() * 10
    }));
  }

  intro() {
    if (!this.disableClick) {
      this.clearTimeouts();
      this.stopwatchService.stopStopwatch();
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
    this.disableClick = false;
    this.stopwatchService.startStopwatch();
  }

  selectCharge(item: ChargesItem, index: number) {
    const prop: Proposition = item.propositions[index];
    if (this.disableClick || prop.css !== '') {
      return;
    }
    if (prop.charge !== item.charge) {
      prop.css = 'wrong';
      this.stopwatchService.addTime(PENALTY_MS);
      const penalty = { id: this.penaltyId++, ...ARCH[index] };
      this.penalties.push(penalty);
      this.later(() => {
        this.penalties = this.penalties.filter(p => p !== penalty);
      }, PENALTY_LIFE);
      return;
    }
    item.propositions.forEach(p => p.css = p.charge === item.charge ? 'correct' : 'hidden');
    this.correct = true;
    this.score++;
    this.stopwatchService.stopStopwatch();
    this.disableClick = true;
    if (this.score === this.maxScore) {
      this.later(() => this.end(), NEXT_DELAY + 300);
    } else {
      this.later(() => {
        this.disableClick = false;
        this.correct = false;
        this.current++;
        this.stopwatchService.startStopwatch();
      }, NEXT_DELAY);
    }
  }

  end() {
    this.disableClick = false;
    this.showGame = false;
    this.showResults = true;
    let display: any = [];
    display.title = 'Charges';
    display.game = 'charges-v2';
    display.time = this.stopwatchService.getDisplayString();
    display.comment = 'pour résoudre le puzzle!';
    this.showResultsService.updateDisplay(display);
  }

  private later(fn: () => void, ms: number) {
    this.timeouts.push(setTimeout(fn, ms));
  }

  private clearTimeouts() {
    this.timeouts.forEach(t => clearTimeout(t));
    this.timeouts = [];
  }

}
