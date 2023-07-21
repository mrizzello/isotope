import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ShowResultsService {

  public display = new BehaviorSubject<string>('00:000');
  private restart = new Subject<any>();

  public updateDisplay(display:any): void {  
    this.display.next(display);
  }

  public clickRestart(){
    this.restart.next(true);
  }

  public getRestart() {
    return this.restart.asObservable();
  }

}
