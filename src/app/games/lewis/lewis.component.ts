import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subscription } from 'rxjs';

import { DataService } from '../../services/data.service';
import { Lewis } from '../../services/data.models';

import { IntroductionService } from '../../services/introduction.service';
import { IntroductionComponent } from '../../components/introduction/introduction.component';
import { StopwatchService } from '../../services/stopwatch.service';
import { StopwatchComponent } from '../../components/stopwatch/stopwatch.component';
import { ShowResultsService } from '../../services/show-results.service';
import { ShowResultsComponent } from '../../components/show-results/show-results.component';
import { ELEMENTS_PER_GAME, LewisItem, PENALTY_MS, Proposition, drawGame } from './lewis.logic';

const ROMANS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
const NEXT_DELAY = 700;     // ms entre la bonne réponse et l'élément suivant
const PENALTY_LIFE = 900;   // ms d'affichage du « +3 s »

interface Penalty {
  id: number;
  x: number;
  y: number;
}

@Component({
    selector: 'app-lewis',
    templateUrl: './lewis.component.html',
    styleUrls: ['./lewis.component.scss'],
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
export class LewisComponent implements OnInit, OnDestroy {
  showIntroduction: boolean = true;
  showGame: boolean = false;
  showResults: boolean = false;
  disableClick: boolean = false;
  structures: Lewis[] | null = null;
  draw: LewisItem[] = [];
  score: number = 0;
  current: number = 0;
  maxScore: number = ELEMENTS_PER_GAME;
  correct: boolean = false;
  hovered: Proposition | null = null;
  penaltySeconds = PENALTY_MS / 1000;
  penalties: Penalty[] = [];
  private penaltyId = 0;
  private timeouts: ReturnType<typeof setTimeout>[] = [];

  @ViewChild(IntroductionComponent) private introduction!: IntroductionComponent;
  @ViewChild(StopwatchComponent) private stopwatch!: StopwatchComponent;
  @ViewChild(ShowResultsComponent) private results!: ShowResultsComponent;

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
      icon: 'settings_backup_restore',
      title: 'Structure de Lewis',
      p: [
        '<b>Les structures de Lewis ne sont pas si compliquées&nbsp!</b>',
        'Trouvez la bonne structure à l\'aide des informations fournies.'
      ]
    });
    this.restartSubscription = this.showResultsService.getRestart().subscribe((data: any) => {
      this.start();
    });
  }

  ngOnInit(): void {
    const lewisData = this.dataService.getLewis();
    if (lewisData) {
      this.structures = lewisData;
    }
  }

  ngOnDestroy(): void {
    this.restartSubscription?.unsubscribe();
    this.startSubscription?.unsubscribe();
    this.clearTimeouts();
    this.stopwatchService.stopStopwatch();
  }

  initGame() {
    this.clearTimeouts();
    this.score = 0;
    this.current = 0;
    this.correct = false;
    this.hovered = null;
    this.penalties = [];
    this.stopwatchService.stopStopwatch();
    this.stopwatchService.resetStopwatch();
    this.draw = this.structures ? drawGame(this.structures) : [];
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

  selectStructure(item: LewisItem, prop: Proposition) {
    if (this.disableClick || prop.css !== '') {
      return;
    }
    if (!prop.correct) {
      prop.css = 'wrong';
      this.stopwatchService.addTime(PENALTY_MS);
      const penalty = { id: this.penaltyId++, x: prop.x, y: prop.y };
      this.penalties.push(penalty);
      this.later(() => {
        this.penalties = this.penalties.filter(p => p !== penalty);
      }, PENALTY_LIFE);
      return;
    }
    item.propositions.forEach(p => {
      if (p.css === '') {
        p.css = 'faded';
      }
    });
    prop.css = 'correct';
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
        this.hovered = null;
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
    display.title = 'Lewis';
    display.game = 'lewis';
    display.time = this.stopwatchService.getDisplayString();
    display.comment = 'pour résoudre le puzzle!';
    this.showResultsService.updateDisplay(display);
  }

  // ordre de dessin SVG : la bonne réponse trouvée, sinon la bulle survolée, en dernier (au-dessus des autres)
  layered(item: LewisItem): Proposition[] {
    const top = item.propositions.find(p => p.css === 'correct') ?? this.hovered;
    if (!top || !item.propositions.includes(top)) {
      return item.propositions;
    }
    return [...item.propositions.filter(p => p !== top), top];
  }

  // survol seulement à la souris : au doigt, pas d'effet
  hover(prop: Proposition, event: PointerEvent) {
    if (event.pointerType === 'mouse') {
      this.hovered = prop;
    }
  }

  getRoman(item: LewisItem): string {
    return ROMANS[item.col];
  }

  private later(fn: () => void, ms: number) {
    this.timeouts.push(setTimeout(fn, ms));
  }

  private clearTimeouts() {
    this.timeouts.forEach(t => clearTimeout(t));
    this.timeouts = [];
  }

}
