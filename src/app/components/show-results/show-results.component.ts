import { Component, OnDestroy } from '@angular/core';
import { ShowResultsService } from '../../services/show-results.service';
import { DataService } from '../../services/data.service';
import { ScoresService } from '../../services/scores.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Success } from '../../services/data.models';

@Component({
    selector: 'app-show-results',
    templateUrl: './show-results.component.html',
    styleUrls: ['./show-results.component.scss'],
    standalone: false
})
export class ShowResultsComponent {

  display: any = {
    game: '',
    time: '',
    comment: '',
    gif: '' as SafeResourceUrl,
    phrase: ''
  };
  success: Success | null = null;
  bestScore?: boolean;

  constructor(
    private showResultsService: ShowResultsService,
    private dataService: DataService,
    private scoresService: ScoresService,
    private sanitizer: DomSanitizer
  ) {
    const successData = this.dataService.getSuccess();
    if (successData) {
      this.success = successData;
    }

    this.showResultsService.display.subscribe((data: any) => {
      this.display.title = data.title;
      this.display.time = data.time !== undefined ? data.time : '';
      this.display.comment = data.comment !== undefined ? data.comment : '';
      if (this.success) {
        this.display.phrase = this.success.phrases[Math.floor(Math.random() * this.success.phrases.length)];
        const urlString = this.success.gifs[Math.floor(Math.random() * this.success.gifs.length)];
        this.display.gif = this.sanitizer.bypassSecurityTrustResourceUrl(urlString);
      }
      let scores = this.scoresService.getItem('scores');
      if (!scores) {
        scores = {};
      }
      let gameScore = scores[data.game];
      this.bestScore = false;
      if (data.time <= gameScore || gameScore == undefined) {
        scores[data.game] = data.time;
        this.scoresService.setItem('scores', scores);
        this.bestScore = true;
      }
    });
  }

  public clickRestart() {
    this.showResultsService.clickRestart();
    this.bestScore = false;
  };

}
