import { Component, Input } from '@angular/core';

@Component({
  selector: '[lewis-structure]',
  templateUrl: './lewis-structure.component.svg',
  styleUrls: ['./lewis-structure.component.scss']
})
export class LewisStructureComponent {
  @Input() n: number = 1;
  @Input() css: string = '';
}
