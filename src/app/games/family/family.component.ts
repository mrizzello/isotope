import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import arrayShuffle from 'array-shuffle';
import { Subscription } from 'rxjs';

import { DataService } from '../../services/data.service';
import { Family } from '../../services/data.models';

import { IntroductionService } from '../../services/introduction.service';
import { IntroductionComponent } from '../../components/introduction/introduction.component';
import { StopwatchService } from '../../services/stopwatch.service';
import { StopwatchComponent } from '../../components/stopwatch/stopwatch.component';
import { ShowResultsService } from '../../services/show-results.service';
import { ShowResultsComponent } from '../../components/show-results/show-results.component';

@Component({
    selector: 'app-family',
    templateUrl: './family.component.html',
    styleUrls: ['./family.component.scss'],
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
export class FamilyComponent implements OnInit, OnDestroy {
  showIntroduction: boolean = true;
  showGame: boolean = false;
  showResults: boolean = false;
  disableClick: boolean = false;
  compounds: Family[] | null = null;
  draw: any;
  score: number = 0;
  current: number = 0;
  maxScore: number = 8;
  propositions: any[] = [
    { type: 'oxyde', css: '' },
    { type: 'hydroxyde', css: '' },
    { type: 'oxacide', css: '' },
    { type: 'hydracide', css: '' },
    { type: 'sel', css: '' },
  ];

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
      icon: 'people',
      title: 'Le jeu des familles',
      p: [
        '<b>Pauvre composé qui a perdu sa famille&hellip;</b>',
        'Trouvez à quelle famille appartient le composé proposé.'
      ]
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
    this.restartSubscription?.unsubscribe();
    this.startSubscription?.unsubscribe();
  }

  initGame() {
    this.score = 0;
    this.current = 0;
    this.stopwatchService.resetStopwatch();

    if (this.compounds) {
      this.draw = JSON.parse(JSON.stringify(this.compounds));
      this.draw = arrayShuffle(this.draw);
      this.draw = this.draw.slice(0, this.maxScore);

      this.draw.forEach((item: any) => {
        item.visible = false;
        item.css = ['symbol-container'];
        item.propositions = JSON.parse(JSON.stringify(this.propositions));
        item.propositions = arrayShuffle(item.propositions);
      });

      this.draw = arrayShuffle(this.draw);
    }
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
    this.disableClick = false;
    this.draw[this.current].visible = true;
    this.stopwatchService.startStopwatch();
  }

  selectTile(proposition: any, item: any) {
    if (this.disableClick) {
      return;
    }
    if (proposition.type == item.type) {
      this.score++;
      if (this.score == this.maxScore) {
        this.stopwatchService.stopStopwatch();
        proposition.css = "good";
        item.css.push('won');
        this.disableClick = true;
        setTimeout(() => { this.end() }, 500);
      } else {
        this.stopwatchService.stopStopwatch();
        this.disableClick = true;
        proposition.css = "good";
        item.css.push('won');
        setTimeout(() => {
          this.disableClick = false;
          this.draw[this.current].visible = false;
          this.current++;
          this.draw[this.current].visible = true;
          this.stopwatchService.startStopwatch();
        }, 500);
      }
    } else {
      proposition.css = "bad";
    }

  }

  end() {
    this.showGame = false;
    this.showResults = true;
    let display: any = [];
    display.title = 'Family';
    display.game = 'family';
    display.time = this.stopwatchService.getDisplayString();
    display.comment = 'pour résoudre le puzzle!';
    this.showResultsService.updateDisplay(display);
  }
}
