import { Component } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { ScoresService } from '../../services/scores.service';

export interface ScoreElement {
  id: string;
  name: string;
  score: string;
}

const SCORE_DATA: ScoreElement[] = [
  { id: 'lewis', name: 'Lewis', score: '' },
  { id: 'charges', name: 'Charges', score: '' },
  { id: 'associations', name: 'Associations', score: '' },
  { id: 'memorion', name: 'Memorion', score: '' },
  { id: 'trivion', name: 'Trivion', score: '' },
  { id: 'family', name: 'Family', score: '' },
];

@Component({
    selector: 'app-scores',
    templateUrl: './scores.component.html',
    styleUrls: ['./scores.component.scss'],
    animations: [
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('300ms ease-in', style({ opacity: 1 }))
            ])
        ])
    ],
    standalone: false
})
export class ScoresComponent {

  scores: any = [];
  display: any = [];
  constructor(private scoresService: ScoresService) { }

  ngOnInit() {
    this.scores = this.scoresService.getItem('scores');
    SCORE_DATA.forEach((item)=>{
      item.score = this.scores[item.id] !== undefined ? this.scores[item.id] : '-';
      this.display.push(item);
    });
  }
}
