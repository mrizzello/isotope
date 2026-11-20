import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SudokuComponent } from './sudoku.component';
import { SudokuIon, solutionCell } from './sudoku.logic';

const ion = (symbol: string, charge: number, name: string): SudokuIon =>
  ({ symbol, plain: symbol.replace(/<[^>]+>/g, ''), charge, name });

describe('SudokuComponent', () => {
  let component: SudokuComponent;
  let fixture: ComponentFixture<SudokuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SudokuComponent ],
      imports: [ NoopAnimationsModule ],
      providers: [ provideHttpClient() ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SudokuComponent);
    component = fixture.componentInstance;
    // les données ne sont pas chargées en test : sous-ensemble fourni à la main
    component.cations = [
      ion('Ca', 2, 'cation calcium'), ion('Na', 1, 'cation sodium'),
      ion('Al', 3, 'cation aluminium'), ion('H', 1, 'cation hydrogène')
    ];
    component.anions = [
      ion('SO<sub>4</sub>', 2, 'sulfate'), ion('Cl', 1, 'chlorure'),
      ion('OH', 1, 'hydroxyde'), ion('NO<sub>3</sub>', 1, 'nitrate')
    ];
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('starts a puzzle with 4 givens', () => {
    component.start();
    fixture.detectChanges();
    expect(component.cells.filter((c) => c.cation !== null).length).toBe(4);
    expect(component.filled).toBeFalse();
    expect(fixture.nativeElement.querySelectorAll('.cell').length).toBe(16);
  });

  it('adds ions with a sticky selection, then erases', () => {
    component.start();
    const free = component.puzzle!.givens.indexOf(false);
    component.selectIon('cation', 0);
    component.touchCell(free);
    component.selectIon('anion', 2);
    component.touchCell(free);
    component.touchCell(free);
    expect(component.cells[free]).toEqual({ cation: 0, cationCount: 1, anion: 2, anionCount: 2 });
    component.selectIon('anion', 1);
    component.touchCell(free);
    expect(component.cells[free].anion).toBe(2);
    expect(component.message).toContain('Effacez');
    component.selectErase();
    component.touchCell(free);
    expect(component.cells[free].cation).toBeNull();
  });

  it('ignores touches on givens', () => {
    component.start();
    const given = component.puzzle!.givens.indexOf(true);
    const before = component.cells[given];
    component.selectErase();
    component.touchCell(given);
    expect(component.cells[given]).toBe(before);
  });

  it('marks wrong cells, then ends when the grid is right', () => {
    component.start();
    const p = component.puzzle!;
    component.cells = component.cells.map((_, i) => solutionCell(p, i));
    const free = p.givens.indexOf(false);
    component.cells[free] = { ...component.cells[free], cationCount: 3 };
    component.check();
    expect(component.wrong.has(free)).toBeTrue();
    expect(component.showGame).toBeTrue();
    component.cells = component.cells.map((_, i) => solutionCell(p, i));
    component.check();
    expect(component.showResults).toBeTrue();
  });
});
