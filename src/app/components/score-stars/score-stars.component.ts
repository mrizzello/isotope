import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
    selector: 'app-score-stars',
    templateUrl: './score-stars.component.html',
    styleUrls: ['./score-stars.component.scss'],
    standalone: false
})
export class ScoreStarsComponent implements OnChanges {

  @Input() score: number = 0;
  @Input() maxScore: number = 0;

  stars: any[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['score']) {
      this.updateStars();
    }
  }

  private updateStars() {
    this.stars = [];
    for (let i = 1; i <= this.maxScore; i++) {
      const star = {
        css: i <= this.score ? 'enabled' : 'disabled'
      };
      this.stars.push(star);
    }
  }

}
