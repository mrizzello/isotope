import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
    selector: 'app-pictiochimie-score',
    templateUrl: './pictiochimie-score.component.html',
    styleUrls: ['./pictiochimie-score.component.scss'],
    standalone: false
})
export class PictiochimieScoreComponent implements OnInit, OnDestroy {

  team1Score: number = 0;
  team2Score: number = 0;
  timer: number = 60; // 1 minute in seconds
  timerInterval: any;
  timerRunning: boolean = false;

  teamNamesForm = new FormGroup({
    team1Name: new FormControl(''),
    team2Name: new FormControl('')
  });

  constructor() { }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  addPoint(team: number): void {
    if (team === 1) {
      this.team1Score++;
    } else {
      this.team2Score++;
    }
  }

  removePoint(team: number): void {
    if (team === 1) {
      this.team1Score = Math.max(0, this.team1Score - 1);
    } else {
      this.team2Score = Math.max(0, this.team2Score - 1);
    }
  }

  startTimer(): void {
    if (!this.timerRunning) {
      this.timerRunning = true;
      this.timerInterval = setInterval(() => {
        if (this.timer > 0) {
          this.timer--;
        } else {
          this.stopTimer();
        }
      }, 1000);
    }
  }

  stopTimer(): void {
    this.timerRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  resetTimer(): void {
    this.stopTimer();
    this.timer = 60;
  }

  // Violet du logo jusqu'à 10 s, glisse vers le rouge entre 10 et 5 s, rouge ensuite
  get barColor(): string {
    const t = Math.min(1, Math.max(0, (10 - this.timer) / 5));
    const from = [0x66, 0x50, 0x97];
    const to = [0xf4, 0x43, 0x36];
    const [r, g, b] = from.map((c, i) => Math.round(c + (to[i] - c) * t));
    return `rgb(${r}, ${g}, ${b})`;
  }

  get barTrackColor(): string {
    return this.barColor.replace('rgb', 'rgba').replace(')', ', 0.2)');
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  resetAll(): void {
    this.team1Score = 0;
    this.team2Score = 0;
    this.resetTimer();
  }
}
