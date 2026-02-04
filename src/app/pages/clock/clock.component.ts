import { Component } from '@angular/core';
import { trigger, transition, style, state, animate } from '@angular/animations';
import { interval, Subscription } from 'rxjs';
import { DataService } from '../../services/data.service';
import { Element } from '../../services/data.models';

@Component({
    selector: 'app-clock',
    templateUrl: './clock.component.html',
    styleUrls: ['./clock.component.scss'],
    animations: [
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('300ms ease-in', style({ opacity: 1 }))
            ])
        ]),
        trigger('blink', [
            state('visible', style({ opacity: 1 })),
            state('hidden', style({ opacity: 0 })),
            transition('visible <=> hidden', animate('0ms')),
        ]),
    ],
    standalone: false
})
export class ClockComponent {
  currentTime: Date = new Date();
  hours: number = 0;
  colonVisible: boolean = true;
  private clockSubscription: Subscription | undefined;
  elements: Element[] = [];
  elementHours: string = '';
  elementMinutes: string = '';

  constructor(private dataService: DataService) {
    const elements = this.dataService.getElements();
    if (elements) {
      this.elements = elements;
    }
    this.getElementsTime();
  }

  ngOnInit(): void {
    this.clockSubscription = interval(1000).subscribe(() => {
      this.currentTime = new Date();
      this.colonVisible = !this.colonVisible;
      this.getElementsTime();
    });
  }

  getElementsTime(){
    this.currentTime = new Date();
    let currentHours = this.currentTime.getHours();
    this.elementHours = 'Minuit';
    if( currentHours > 0 ){
      let element = this.elements.find((el) => el.n == currentHours.toString());
      if (element) {
        this.elementHours = element.name;
      }
    }
    let currentMinutes = this.currentTime.getMinutes();
    this.elementMinutes = 'zéro';
    if( currentMinutes > 0 ){
      let element = this.elements.find((el) => el.n == currentMinutes.toString());
      if (element) {
        this.elementMinutes = element.name;
      }
    }
  }

  ngOnDestroy(): void {
    this.clockSubscription?.unsubscribe();
  }
}
