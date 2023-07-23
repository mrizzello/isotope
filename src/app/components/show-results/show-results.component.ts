import { Component, OnDestroy } from '@angular/core';
import { ShowResultsService } from '../../services/show-results.service';
import { DataService } from '../../services/data.service';
@Component({
  selector: 'app-show-results',
  templateUrl: './show-results.component.html',
  styleUrls: ['./show-results.component.scss']
})
export class ShowResultsComponent {

  display: any = [];
  phrases: any = [];
  maxGifs = 19
  nGif = 0;

  constructor(
    private showResultsService: ShowResultsService,
    private dataService: DataService,
  ) {
    this.phrases = this.dataService.getSuccessPhrases();
    this.showResultsService.display.subscribe((data: any) => {
      this.display.time = data.time !== undefined ? data.time : '';
      this.display.phrase = this.phrases[Math.floor(Math.random() * this.phrases.length)];
      this.nGif = Math.floor(Math.random() * (this.maxGifs - 1 + 1)) + 1;
    });
  }

  public clickRestart() {
    this.showResultsService.clickRestart();
  };

}
