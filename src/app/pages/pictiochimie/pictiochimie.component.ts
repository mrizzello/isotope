import { Component, HostListener } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { DataService } from '../../services/data.service';
import arrayShuffle from 'array-shuffle';
import { Pictiochimie } from '../../services/data.models';

@Component({
    selector: 'app-pictiochimie',
    templateUrl: './pictiochimie.component.html',
    styleUrls: ['./pictiochimie.component.scss'],
    animations: [
        trigger('fadeIn', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('300ms ease-in', style({ opacity: 1 }))
            ])
        ]),
        trigger('wordSwap', [
            transition('* => *', [
                style({ opacity: 0, transform: 'translateY(24px)' }),
                animate('200ms ease-out', style({ opacity: 1, transform: 'none' }))
            ])
        ])
    ],
    standalone: false
})
export class PictiochimieComponent {

  data: (Pictiochimie & { selected?: boolean })[] = [];
  words: string[] = [];
  play: boolean = false;
  finished: boolean = false;
  cursor: number = 0;

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
    const pictiochimieData = this.dataService.getPictiochimie();
    if (pictiochimieData) {
      this.data = pictiochimieData.filter((item) => item.words.length > 0);
    }
  }

  get hasSelection(): boolean {
    return this.data.some((item) => item.selected);
  }

  toggleSelect(item: Pictiochimie & { selected?: boolean }): void {
    if (item.selected === undefined) {
      item.selected = false;
    }
    item.selected = !item.selected;
  }

  start(): void {
    if (!this.hasSelection) {
      return;
    }
    const tmp = this.data
      .filter((item) => item.selected)
      .flatMap((item) => item.words);
    this.words = arrayShuffle(tmp);
    this.cursor = 0;
    this.finished = false;
    this.play = true;
  }

  prev(): void {
    if (this.finished) {
      this.finished = false;
    } else if (this.cursor > 0) {
      this.cursor--;
    }
  }

  next(): void {
    if (this.cursor < this.words.length - 1) {
      this.cursor++;
    } else {
      this.finished = true;
    }
  }

  home(): void {
    if (this.cursor > 0 && !this.finished && !confirm('Quitter la partie en cours ?')) {
      return;
    }
    this.play = false;
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.play) {
      return;
    }
    switch (event.key) {
      case 'ArrowLeft':
        this.prev();
        break;
      case 'ArrowRight':
        if (!this.finished) {
          this.next();
        }
        break;
      case 'Escape':
        this.home();
        break;
    }
  }

  openScoreWindow(): void {
    window.open('/pictiochimie-score', '_blank');
  }

}
