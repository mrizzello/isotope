import { Component } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { MatDialog } from '@angular/material/dialog';
import { ScoresService } from '../../services/scores.service';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog.component';

export interface ScoreElement {
  id: string;
  name: string;
  score: string;
}

const SCORE_DATA: ScoreElement[] = [
  { id: 'lewis', name: 'Lewis', score: '' },
  { id: 'charges', name: 'Charges', score: '' },
  { id: 'associations', name: 'Associations', score: '' },
  { id: 'memorion', name: 'Memorion', score: '' },
  { id: 'trivion', name: 'Trivion', score: '' },
  { id: 'family', name: 'Family', score: '' },
  { id: 'hexaions', name: 'HexaIons', score: '' },
];

@Component({
    selector: 'app-scores',
    templateUrl: './scores.component.html',
    styleUrls: ['./scores.component.scss'],
    animations: [
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('300ms ease-in', style({ opacity: 1 }))
            ])
        ])
    ],
    standalone: false
})
export class ScoresComponent {

  scores: any = [];
  display: any = [];
  constructor(private scoresService: ScoresService, private dialog: MatDialog) { }

  ngOnInit() {
    this.buildDisplay();
  }

  resetScores(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Réinitialiser les scores',
        message: 'Voulez-vous vraiment réinitialiser tous les scores ?'
      }
    });
    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) {
        return;
      }
      this.scoresService.removeItem('scores');
      this.scoresService.removeItem('hexaionsRecord');
      this.buildDisplay();
    });
  }

  private buildDisplay(): void {
    this.scores = this.scoresService.getItem('scores') || {};
    const hexaionsRecord = this.scoresService.getItem('hexaionsRecord');
    this.display = [];
    SCORE_DATA.forEach((item)=>{
      if (item.id === 'hexaions') {
        item.score = hexaionsRecord
          ? hexaionsRecord.won + ' gagnées / ' + hexaionsRecord.lost + ' perdues'
          : '-';
      } else {
        item.score = this.scores[item.id] !== undefined ? this.scores[item.id] : '-';
      }
      this.display.push(item);
    });
  }
}
