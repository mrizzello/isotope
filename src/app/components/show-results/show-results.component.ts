import { Component, OnDestroy } from '@angular/core';
import { ShowResultsService } from '../../services/show-results.service';
import { DataService } from '../../services/data.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-show-results',
  templateUrl: './show-results.component.html',
  styleUrls: ['./show-results.component.scss']
})
export class ShowResultsComponent {

  display: any = {
    time: '',
    comment: '',
    gif: '' as SafeResourceUrl,
    phrase: ''
  };
  success: any = [];

  constructor(
    private showResultsService: ShowResultsService,
    private dataService: DataService,
    private sanitizer: DomSanitizer
  ) {
    this.success = this.dataService.getSuccess();
    this.showResultsService.display.subscribe((data: any) => {
      this.display.time = data.time !== undefined ? data.time : '';
      this.display.comment = data.comment !== undefined ? data.comment : '';
      this.display.phrase = this.success.phrases[Math.floor(Math.random() * this.success.phrases.length)];
      const urlString = this.success.gifs[Math.floor(Math.random() * this.success.gifs.length)];
      this.display.gif = this.sanitizer.bypassSecurityTrustResourceUrl(urlString);
    });
  }

  public clickRestart() {
    this.showResultsService.clickRestart();
  };

}
