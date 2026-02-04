import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-pictiochimie-score',
  templateUrl: './pictiochimie-score.component.html',
  styleUrls: ['./pictiochimie-score.component.scss']
})
export class PictiochimieScoreComponent implements OnInit {

  team1Score: number = 0;
  team2Score: number = 0;
  timer: number = 60; // 1 minute in seconds
  timerInterval: any;
  timerRunning: boolean = false;

  teamNamesForm = new FormGroup({
    team1Name: new FormControl('Équipe 1'),
    team2Name: new FormControl('Équipe 2')
  });

  constructor() { }

  ngOnInit(): void {
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
      this.team1Score--;
    } else {
      this.team2Score--;
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
