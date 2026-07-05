import { Component } from '@angular/core';
import { IntroductionService } from '../../services/introduction.service';

@Component({
    selector: 'app-introduction',
    templateUrl: './introduction.component.html',
    styleUrls: ['./introduction.component.scss'],
    standalone: false
})
export class IntroductionComponent {

  display: any = [];

  constructor(private introductionService: IntroductionService) {
    this.introductionService.display.subscribe((data: any) => {
      this.display.icon = data.icon !== undefined ? data.icon : '';
      this.display.title = data.title !== undefined ? data.title : '';
      this.display.p = data.p !== undefined ? data.p : [];
      this.display.action = data.action !== undefined ? data.action : 'Commencer';
      this.display.choices = data.choices; // choix optionnels [{label, value}]
    });
  }

  public clickStart(value?: any) {
    this.introductionService.clickStart(value);
  };

}
