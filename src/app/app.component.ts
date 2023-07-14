import { Component, OnInit } from '@angular/core';
import { DataService } from './service/data.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'isotope';

  showSplashScreen = true;

  constructor(private dataService: DataService) {
    this.loadData();
  }

  loadData(): void {
    this.dataService.getData()
      .then(() => {
        this.showSplashScreen = false;
        // this.showSplashScreen = true;
        // setTimeout(()=>{this.showSplashScreen = false;}, 3000);
      });
  }
}
