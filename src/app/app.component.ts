import { Component } from '@angular/core';
import { DataService } from './service/data.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent{
  title = 'isotope';

  showRouterOutlet = false;

  constructor(private dataService: DataService) {
    this.loadData();
  }

  ngAfterViewInit(): void {
  }

  loadData(): void {
    this.dataService.getData()
      .then(() => {
        const elementToRemove = document.getElementById('elementToRemove');
        if (elementToRemove) {
          elementToRemove.parentNode?.removeChild(elementToRemove);
          this.showRouterOutlet = true;
        }
      });
  }
}
