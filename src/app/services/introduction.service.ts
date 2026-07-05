import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IntroductionService {

  public display = new BehaviorSubject<string>('');
  private start = new Subject<any>();

  public updateDisplay(display: any): void {
    this.display.next(display);
  }
  
  public clickStart(value?: any) {
    this.start.next(value !== undefined ? value : true);
  }

  public getStart() {
    return this.start.asObservable();
  }

}
