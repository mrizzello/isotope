import { Component } from '@angular/core';
import { IntroductionService } from '../../services/introduction.service';

@Component({
  selector: 'app-introduction',
  templateUrl: './introduction.component.html',
  styleUrls: ['./introduction.component.scss']
})
export class IntroductionComponent {

  display: any = [];

  constructor(private introductionService: IntroductionService) {
    this.introductionService.display.subscribe((data: any) => {
      this.display.title = data.title !== undefined ? data.title : '';
      this.display.p = data.p !== undefined ? data.p : [];
      this.display.action = data.action !== undefined ? data.action : 'Commencer';
    });
  }

  public clickStart() {
    this.introductionService.clickStart();
  };

}
