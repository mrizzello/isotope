import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import arrayShuffle from 'array-shuffle';
import { Subscription } from 'rxjs';

import { DataService } from '../../services/data.service';
import { Ions } from '../../services/data.models';

import { IntroductionService } from '../../services/introduction.service';
import { IntroductionComponent } from '../../components/introduction/introduction.component';
import { StopwatchService } from '../../services/stopwatch.service';
import { StopwatchComponent } from '../../components/stopwatch/stopwatch.component';
import { ShowResultsService } from '../../services/show-results.service';
import { ShowResultsComponent } from '../../components/show-results/show-results.component';

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
  draw: any;
  score: number = 0;
  current: number = 0;
  maxScore: number = 8;
  circlesNumber: number = 65;
  minR: any = 10;
  maxR: any = 80;
  minX: any = - this.maxR;
  maxX: any = 510 + this.maxR;
  minY: any = - this.maxR;
  maxY: any = 350 - this.maxR;

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
      icon: 'add_circle_outline',
      title: 'Charges',
      p: [
        '<b>Rechargez votre batterie&nbsp!</b>',
        'Trouvez la bonne charge des ions proposés.'
      ]
    });
    this.restartSubscription = this.showResultsService.getRestart().subscribe((data: any) => {
      this.start();
    });
  }

  ngOnInit(): void {
    const ionsData = this.dataService.getIons();
    if (ionsData) {
      this.ions = ionsData;
      const regex = /\([A-Z]+\)/i;
      this.ions.cations = this.ions.cations.filter((cation: any) => !regex.test(cation.name));
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

    if (this.ions) {
      const clones = JSON.parse(JSON.stringify(this.ions));

      let cations = arrayShuffle(clones.cations);
      cations = cations.slice(0, 4);
      let anions = clones.anions;
      anions = arrayShuffle(anions);
      anions = anions.slice(0, 4);

      this.draw = cations.concat(anions);
      this.draw = arrayShuffle(this.draw);

      this.draw.forEach((item: any) => {
        item.visible = false;
        item.css = '';
        let charges = ['3+', '2+', '+', '–', '2–', '3–'];
        charges = charges.filter(charge => charge !== item.charge);
        charges.unshift(item.charge);
        charges = charges.slice(0, 4);
        charges = arrayShuffle(charges);
        let propositions: any = [];
        charges.forEach((charge) => {
          propositions.push({
            charge: charge,
            css: ''
          });
        });
        item.propositions = propositions;
        item.circles = [];
        for (let i = 0; i < this.circlesNumber; i++) {
          const rX = Math.floor(Math.random() * (this.maxX - this.minX + 1)) + this.minX;
          const rY = Math.floor(Math.random() * (this.maxY - this.minY + 1)) + this.minY;
          const rC = Math.floor(Math.random() * (this.maxR - this.minR + 1)) + this.minR;
          const rCss = Math.floor(Math.random() * (3 - 0 + 1)) + 0;
          item.circles.push({
            cx: rX,
            cy: rY,
            r: rC,
            css: 'move-'+rCss
          });
        }
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

  selectCharge(item: any, index: number) {
    let prop = item.propositions[index];
    if (this.disableClick || prop.css !== '') {
      return;
    }
    if (prop.charge == item.charge) {
      item.css = "correct";
      item.propositions.forEach((prop:any)=>{
        prop.css = prop.charge == item.charge ? 'correct' : 'hidden';
      });
      this.score++;
      if (this.score == this.maxScore) {
        this.stopwatchService.stopStopwatch();
        this.disableClick = true;
        setTimeout(() => { this.end() }, 500);
      } else {
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
    } else {
      prop.css = "wrong";
    }
  }

  end() {
    this.showGame = false;
    this.showResults = true;
    let display: any = [];
    display.title = 'Charges';
    display.game = 'charges';
    display.time = this.stopwatchService.getDisplayString();
    display.comment = 'pour résoudre le puzzle!';
    this.showResultsService.updateDisplay(display);
  }

}
