import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import arrayShuffle from 'array-shuffle';
import { Subscription } from 'rxjs';

import { DataService } from '../../services/data.service';

import { IntroductionService } from '../../services/introduction.service';
import { IntroductionComponent } from '../../components/introduction/introduction.component';
import { StopwatchService } from '../../services/stopwatch.service';
import { StopwatchComponent } from '../../components/stopwatch/stopwatch.component';
import { ShowResultsService } from '../../services/show-results.service';
import { ShowResultsComponent } from '../../components/show-results/show-results.component';

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
  ]
})
export class TrivionComponent implements OnInit, OnDestroy {
  showIntroduction: boolean = true;
  showGame: boolean = false;
  showResults: boolean = false;
  disableClick: boolean = false;
  ions: any;
  draw: any;
  score: number = 0;
  current: number = 0;
  maxScore: number = 8;

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
      icon: 'check_box',
      title: 'Triv<u>ion</u>',
      p: [
        '<b>C\'est plutôt trivial&nbsp;...<br />ou pas&nbsp;!</b>',
        'Un ion et quatre propositions,<br />à vous de trouver la bonne réponse&nbsp;!'
      ]
    });
    this.restartSubscription = this.showResultsService.getRestart().subscribe((data: any) => {
      this.start();
    });
  }

  ngOnInit(): void {
    this.ions = this.dataService.getIons();
  }

  ngOnDestroy(): void {
    this.restartSubscription?.unsubscribe();
    this.startSubscription?.unsubscribe();
  }

  initGame() {
    this.score = 0;
    this.current = 0;
    this.stopwatchService.resetStopwatch();

    this.draw = JSON.parse(JSON.stringify(this.ions));
    this.draw = this.draw.cations.concat(this.draw.anions);
    this.draw = arrayShuffle(this.draw);
    this.draw = this.draw.slice(0, this.maxScore);    

    this.draw.forEach((item: any) => {
      item.selected = false;
      item.css = ['symbol-container'];
      item.visible = false;
      item.propositions = item.wrongNames;
      item.propositions.push(item.name);
      item.propositions = arrayShuffle(item.propositions);
    });

    this.draw = arrayShuffle(this.draw);

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

  selectTile(event: any, proposition: any, item: any) {    
    if (this.disableClick) {
      return;
    }
    const targetElement = event.target as Element;
    const parent = targetElement.parentElement?.parentElement;
    if(proposition == item.name){
      this.score++;
      if( this.score == this.maxScore ){
        this.stopwatchService.stopStopwatch();
        item.css.push('won');
        if( parent ){
          parent.classList.add('good');
        }
        this.disableClick = true;
        setTimeout(() => { this.end() }, 500);
      }else{
        this.stopwatchService.stopStopwatch();
        this.disableClick = true;
        item.css.push('won')
        if( parent ){
          parent.classList.add('good');
        }
        setTimeout(() => {
          this.disableClick = false;
          this.draw[this.current].visible = false;
          this.current++;
          this.draw[this.current].visible = true;
          this.stopwatchService.startStopwatch();
        }, 500);
      }
    }else{
      if( parent ){
        parent.classList.add('bad');
      }
    }
  }

  end() {
    this.showGame = false;
    this.showResults = true;
    let display: any = [];
    display.title = 'Triv<u>ion</u>';
    display.game = 'trivion';
    display.time = this.stopwatchService.getDisplayString();
    display.comment = 'pour résoudre le puzzle!';
    this.showResultsService.updateDisplay(display);
  }

}
