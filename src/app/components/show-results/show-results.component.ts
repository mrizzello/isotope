import { Component, ViewChild, ElementRef } from '@angular/core';
import { ShowResultsService } from '../../services/show-results.service';
import { DataService } from '../../services/data.service';
import { ScoresService } from '../../services/scores.service';
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
    phrase: ''
  };
  success: Success | null = null;
  bestScore?: boolean;

  private _gifUrl: string = '';
  private _iframeEl?: HTMLIFrameElement;

  @ViewChild('giphyIframe') set giphyIframe(content: ElementRef<HTMLIFrameElement> | undefined) {
    if (content) {
      this._iframeEl = content.nativeElement;
      this._iframeEl.src = this._gifUrl;
    } else {
      this._iframeEl = undefined;
    }
  }

  constructor(
    private showResultsService: ShowResultsService,
    private dataService: DataService,
    private scoresService: ScoresService
  ) {
    const successData = this.dataService.getSuccess();
    if (successData) {
      this.success = successData;
    }

    this.showResultsService.display.subscribe((data: any) => {
      this.display.title = data.title;
      this.display.time = data.time !== undefined ? data.time : '';
      this.display.comment = data.comment !== undefined ? data.comment : '';
      this.display.scores = data.scores; // rappel de score optionnel [{label, value, css}]
      if (this.success) {
        this.display.phrase = this.success.phrases[Math.floor(Math.random() * this.success.phrases.length)];
        const urlString = this.success.gifs[Math.floor(Math.random() * this.success.gifs.length)];
        this._gifUrl = urlString;
        if (this._iframeEl) {
          this._iframeEl.src = urlString;
        }
      }
      let scores = this.scoresService.getItem('scores');
      if (!scores) {
        scores = {};
      }
      let gameScore = scores[data.game];
      this.bestScore = false;
      if (data.points !== undefined) {
        // score en points : plus haut = meilleur
        if (gameScore == undefined || data.points >= gameScore) {
          scores[data.game] = data.points;
          this.scoresService.setItem('scores', scores);
          this.bestScore = true;
        }
      } else if (data.time <= gameScore || gameScore == undefined) {
        // temps : plus bas = meilleur
        scores[data.game] = data.time;
        this.scoresService.setItem('scores', scores);
        this.bestScore = true;
      }
    });
  }

  public clickRestart() {
    this.showResultsService.clickRestart();
    this.bestScore = false;
  }

}
