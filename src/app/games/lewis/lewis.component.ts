import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import arrayShuffle from 'array-shuffle';
import { Subscription } from 'rxjs';

import { DataService } from '../../services/data.service';
import { Lewis } from '../../services/data.models';

import { IntroductionService } from '../../services/introduction.service';
import { IntroductionComponent } from '../../components/introduction/introduction.component';
import { StopwatchService } from '../../services/stopwatch.service';
import { StopwatchComponent } from '../../components/stopwatch/stopwatch.component';
import { ShowResultsService } from '../../services/show-results.service';
import { ShowResultsComponent } from '../../components/show-results/show-results.component';

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
  draw: any;
  score: number = 0;
  current: number = 0;
  maxScore: number = 8;
  romans: any = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
  propositionsRadius = 112;

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
  }

  initGame() {
    this.score = 0;
    this.current = 0;
    this.stopwatchService.resetStopwatch();

    if (this.structures) {
      this.draw = JSON.parse(JSON.stringify(this.structures));
      this.draw = arrayShuffle(this.draw);
      this.draw = this.draw.slice(0, this.maxScore);

      this.draw.forEach((item: any) => {
        item.visible = false;

        let propositions = [];
        for (let step = 1; step <= 8; step++) {
          propositions.push({
            n: step,
            correct: step == item.col,
            translate: [],
            css: ''
          });
        }

        propositions = arrayShuffle(propositions);

        let angle = 0;
        propositions.forEach((proposition, index) => {
          let radians = angle * (Math.PI / 180);
          let translate: any = {};
          translate.x = Math.round(Math.cos(radians) * this.propositionsRadius);
          translate.y = Math.round(Math.sin(radians) * this.propositionsRadius);
          proposition.translate = translate;
          angle += 360 / 8;
        });

        item.propositions = propositions;

      });
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

  selectStructure(proposition: any) {
    if (this.disableClick) {
      return;
    }
    if( proposition.correct ){
      proposition.css = "correct";
      this.draw[this.current].css = 'won';
      this.score++;
      if( this.score == this.maxScore ){
        this.stopwatchService.stopStopwatch();
        this.disableClick = true;
        setTimeout(() => { this.end() }, 500);
      }else{
        this.stopwatchService.stopStopwatch();
        this.disableClick = true;
        setTimeout(() => {
          this.disableClick = false;
          this.draw[this.current].visible = false;
          this.current++;
          this.draw[this.current].visible = true;
          this.stopwatchService.startStopwatch();
        }, 500);
      }
    }else{
      proposition.css = "wrong";
    }
    
  }

  end() {
    this.showGame = false;
    this.showResults = true;
    let display: any = [];
    display.title = 'Lewis';
    display.game = 'lewis';
    display.time = this.stopwatchService.getDisplayString();
    display.comment = 'pour résoudre le puzzle!';
    this.showResultsService.updateDisplay(display);
  }

  getRoman(item: any) {
    return this.romans[item.col];
  }

}
