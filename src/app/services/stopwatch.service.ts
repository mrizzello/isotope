import { Injectable } from '@angular/core';
import { interval, BehaviorSubject, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StopwatchService {
  private stopwatchSubscription: Subscription | null = null;
  private startTime = 0;
  private elapsedTime = 0;
  private running = false;

  public displayTime = new BehaviorSubject<string>('00:000');

  startStopwatch(): void {
    if (!this.running) {
      this.running = true;
      this.startTime = Date.now() - this.elapsedTime;
      this.stopwatchSubscription = interval(10).subscribe(() => {
        this.elapsedTime = Date.now() - this.startTime;
        this.updateDisplayTime();
      });
    }
  }

  stopStopwatch(): void {
    if (this.running) {
      this.stopwatchSubscription?.unsubscribe();
      this.running = false;
    }
  }

  resetStopwatch(): void {
    this.elapsedTime = 0;
    this.updateDisplayTime();
  }

  private updateDisplayTime(): void {
    const totalMilliseconds = this.elapsedTime;
    const minutes = Math.floor(totalMilliseconds / 60000);
    const remainingMilliseconds = totalMilliseconds % 60000;
    const seconds = Math.floor(remainingMilliseconds / 1000);
    const milliseconds = remainingMilliseconds % 1000;
  
    const displayString = `${this.formatTime(minutes)}:${this.formatTime(seconds)}:${this.formatTime(milliseconds, 3)}`;
    this.displayTime.next(displayString);
  }
  
  private formatTime(time: number, digits: number = 2): string {
    return time.toString().padStart(digits, '0');
  }

  getDisplayString(): string {
    return this.displayTime.getValue();
  }
  
}
