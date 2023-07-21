import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatDrawer } from '@angular/material/sidenav';

import { DataService } from './services/data.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'isotope';
  @ViewChild('drawer') drawer!: MatDrawer;

  showRouterOutlet = false;

  constructor(
    private dataService: DataService,
    private router: Router) {
    this.loadData();
  }

  ngAfterViewInit(): void {
  }

  loadData(): void {
    this.dataService.getData()
      .then(() => {
        setTimeout(() => {
          const elementToRemove = document.getElementById('elementToRemove');
          if (elementToRemove) {
            elementToRemove.parentNode?.removeChild(elementToRemove);
            this.showRouterOutlet = true;
          }
        }, 1500);
      });
  }

  navigateAndCloseNav(path:string): void {
    this.router.navigate([path]);
    this.drawer.close();
  }
  
}
