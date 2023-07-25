import { Component, OnDestroy } from '@angular/core';
import { StopwatchService } from '../../services/stopwatch.service';

@Component({
  selector: 'app-stopwatch',
  templateUrl: './stopwatch.component.html',
  styleUrls: ['./stopwatch.component.scss']
})
export class StopwatchComponent implements OnDestroy {
  
  displayTime:string = '00:00:000';
  running:boolean = false;

  constructor(private stopwatchService: StopwatchService) {
    this.stopwatchService.displayTime.subscribe((time: string) => {
      this.displayTime = time;
    });
    this.running = this.stopwatchService.getIsRunning();
  }

  ngOnDestroy(): void {
    this.stopwatchService.stopStopwatch();
  }

  startStopwatch(): void {
    this.stopwatchService.startStopwatch();
  }

  stopStopwatch(): void {
    this.stopwatchService.stopStopwatch();
  }

  resetStopwatch(): void {
    this.stopwatchService.resetStopwatch();
  }

  getIsRunning(): boolean {
    return this.stopwatchService.getIsRunning();
  }
}
