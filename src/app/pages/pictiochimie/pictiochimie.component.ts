import { Component } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { DataService } from '../../services/data.service';
import arrayShuffle from 'array-shuffle';

export interface Chapter {
  id: string
  chapter: string
  words: string[]
  selected?: boolean
}

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
        ])
    ],
    standalone: false
})
export class PictiochimieComponent {

  data: Chapter[] = [];
  words: any[] = [];
  play: boolean = false;
  cursor: number = 0;

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
    this.data = this.dataService.getPictiochimie();
  }

  toggleSelect(item: Chapter): void {
    if (item.selected === undefined) {
      item.selected = false;
    }
    item.selected = !item.selected;
  }

  start(): void {
    let tmp: any[] = [];
    this.data.forEach((item) => {
      if (item.selected) {
        tmp = [...tmp, ...item.words]
      }
    });
    this.words = [];
    tmp.forEach((word, index) => {
      this.words.push({
        word: word,
        visible: false,
      });
    });
    this.words = arrayShuffle(this.words);
    this.cursor = 0;
    this.words[this.cursor].visible = true;
    this.play = true;
  }

  navigate(dir: string) {
    this.words[this.cursor].visible = false;
    switch (dir) {
      case '0':
        this.play = false;
        break;
      case '+':
        if( this.cursor < this.words.length - 1 ){
          this.cursor++;
        }
        break;
      case '-':
        if (this.cursor > 0) {
          this.cursor--;
        }
        break;
    }
    this.words[this.cursor].visible = true;
  }

  openScoreWindow(): void {
    window.open('/pictiochimie-score', '_blank');
  }

}
