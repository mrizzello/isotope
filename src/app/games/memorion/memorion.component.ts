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
  selector: 'app-memorion',
  templateUrl: './memorion.component.html',
  styleUrls: ['./memorion.component.scss'],
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
export class MemorionComponent implements OnInit, OnDestroy{

  showIntroduction: boolean = true;
  showGame: boolean = false;
  showResults: boolean = false;
  disableClick: boolean = false;
  ions: any;
  cations: any;
  anions: any;
  draw: any;
  selection: any;
  score: number = 0;
  maxScore: number = 6;
  cssWon: string = '';

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
      icon: 'psychology_alt',
      title: 'Memor<u>ion</u>',
      p: [
        'Révélez une carte pour dévoilez un ion',
        'puis recommencez pour trouver son nom&hellip;',
        '<b>ou l\'inverse.</b>'
      ]
    });
    this.restartSubscription = this.showResultsService.getRestart().subscribe((data: any) => {
      this.start();
    });
  }

  ngOnInit(): void {
    this.ions = this.dataService.getIons();
    this.selection = [];
  }

  ngOnDestroy(): void {
    this.restartSubscription?.unsubscribe();
    this.startSubscription?.unsubscribe();
  }

  initGame() {
    this.score = 0;
    this.stopwatchService.resetStopwatch();
    this.cssWon = '';

    this.cations = this.ions.cations;

    this.cations = arrayShuffle(this.cations);
    this.cations = this.cations.slice(0, 3);
    this.anions = this.ions.anions;
    this.anions = arrayShuffle(this.anions);
    this.anions = this.anions.slice(0, 3);

    this.draw = this.cations.concat(this.anions);
    this.draw.forEach((item: any) => {
      item.show = 'name';
      item.selected = false;
      item.out = false;
      item.css = ['hidden'];
    });

    const clones = JSON.parse(JSON.stringify(this.draw));
    clones.forEach((item: any) => {
      item.show = 'formula';
    });

    this.draw = this.draw.concat(clones);
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
    this.stopwatchService.startStopwatch();
  }

  selectTile(tile: any) {
    if (tile.out === true || this.disableClick) {
      return;
    }
    tile.css = [];
    tile.selected = !tile.selected;
    if (tile.selected) {
      tile.css.push("selected");
      this.selection.push(tile);
    } else {
      const index = this.selection.findIndex((item: any) => item['name'] === tile.name);
      if (index !== -1) {
        tile.css = ['hidden'];
        this.selection.splice(index, 1);
      }
    }
    if (this.selection.length == 2) {
      if (this.selection[0].name == this.selection[1].name) {
        this.selection[0].out = true;
        this.selection[0].css = ['done'];
        this.selection[1].out = true;
        this.selection[1].css = ['done'];
        this.selection = [];
        this.score++;
        if (this.score == 6) {
          this.stopwatchService.stopStopwatch();
          this.disableClick = true;
          this.cssWon = 'won';
          setTimeout(() => { this.end() }, 800);
        }
      } else {
        this.disableClick = true;
        setTimeout(() => {
          this.selection[0].selected = false;
          this.selection[1].selected = false;
          this.selection[0].css = ['wrong'];
          this.selection[1].css = ['wrong'];
        }, 400);
        setTimeout(() => {
          this.disableClick = false;
          this.selection[0].css = ['hidden'];
          this.selection[1].css = ['hidden'];
          this.selection = [];
        }, 800);
      }
    }
  }

  end() {
    this.showGame = false;
    this.showResults = true;
    let display: any = [];
    display.game = 'memorion';
    display.time = this.stopwatchService.getDisplayString();
    display.comment = 'pour résoudre le puzzle!';
    this.showResultsService.updateDisplay(display);
  }

}
