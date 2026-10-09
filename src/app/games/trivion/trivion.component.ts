import { Component, OnDestroy, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subscription } from 'rxjs';

import { DataService } from '../../services/data.service';
import { Ions } from '../../services/data.models';

import { IntroductionService } from '../../services/introduction.service';
import { StopwatchService } from '../../services/stopwatch.service';
import { ShowResultsService } from '../../services/show-results.service';

import { IONS_PER_GAME, ION_POSITION, Proposition, TrivionItem, drawGame } from './trivion.logic';

const NEXT_DELAY = 700;   // ms entre la bonne réponse et l'ion suivant

@Component({
    selector: 'app-trivion',
    templateUrl: './trivion.component.html',
    styleUrls: ['./trivion.component.scss'],
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
export class TrivionComponent implements OnInit, OnDestroy {
  showIntroduction: boolean = true;
  showGame: boolean = false;
  showResults: boolean = false;
  disableClick: boolean = false;
  ions: Ions | null = null;
  draw: TrivionItem[] = [];
  score: number = 0;
  current: number = 0;
  maxScore: number = IONS_PER_GAME;
  correct: boolean = false;
  ion = ION_POSITION;
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
      icon: 'check_box',
      title: 'Triv<u>ion</u>',
      p: [
        '<b>C\'est plutôt trivial&nbsp;...<br />ou pas&nbsp;!</b>',
        'Un ion, quatre noms&nbsp;: trouvez le bon<br />pour 10 ions, du plus simple au plus corsé&nbsp;!'
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

  initGame() {
    this.clearTimeouts();
    this.score = 0;
    this.current = 0;
    this.correct = false;
    this.stopwatchService.stopStopwatch();
    this.stopwatchService.resetStopwatch();
    this.draw = this.ions ? drawGame(this.ions.cations, this.ions.anions) : [];
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

  selectName(item: TrivionItem, index: number) {
    const prop: Proposition = item.propositions[index];
    if (this.disableClick || prop.css !== '') {
      return;
    }
    if (prop.name !== item.name) {
      prop.css = 'wrong';
      return;
    }
    item.propositions.forEach(p => p.css = p.name === item.name ? 'correct' : 'hidden');
    this.correct = true;
    this.score++;
    this.stopwatchService.stopStopwatch();
    this.disableClick = true;
    if (this.score === this.maxScore) {
      this.later(() => this.end(), NEXT_DELAY);
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
    display.title = 'Triv<u>ion</u>';
    display.game = 'trivion-v2';
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
