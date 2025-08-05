import { Component, ViewChild, Inject, Renderer2 } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
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
  private routerEventsSubscription: Subscription;
  contentClass: string = '';

  constructor(
    private dataService: DataService,
    private router: Router
  ) {
    this.routerEventsSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.contentClass = event.url.replace('/', '');
        if( this.contentClass == ''){
          this.contentClass = 'home';
        }
      }
    });
  }

  async ngOnInit(): Promise<void> {
    await this.dataService.loadData();
    this.showRouterOutlet = true;
  }

  ngOnDestroy() {
    this.routerEventsSubscription.unsubscribe();
  }

  navigateAndCloseNav(path: string): void {
    this.router.navigate([path]);
    this.drawer.close();
  }

}
