import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { FamilyRushComponent } from './family-rush.component';

describe('FamilyRushComponent', () => {
  let component: FamilyRushComponent;
  let fixture: ComponentFixture<FamilyRushComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FamilyRushComponent ],
      imports: [ NoopAnimationsModule ],
      providers: [ provideHttpClient() ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FamilyRushComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should sort a molecule into the right bin and penalise the wrong one', () => {
    component.compounds = [
      { type: 'sel', formule: 'NaCl', general: '', name: '' },
      { type: 'oxyde', formule: 'CuO', general: '', name: '' }
    ];
    component.start();
    const sel = component.bins.find((b) => b.value === 'sel')!;
    const oxyde = component.bins.find((b) => b.value === 'oxyde')!;

    component.molecules = [{ id: 1, compound: component.compounds[0], lane: 0, y: 0.5, special: false }];
    component.selectMolecule(component.molecules[0]);
    component.selectBin(sel);
    expect(component.state.score).toBe(1);
    expect(component.molecules.length).toBe(0);

    component.molecules = [{ id: 2, compound: component.compounds[0], lane: 0, y: 0.5, special: false }];
    component.selectMolecule(component.molecules[0]);
    component.selectBin(oxyde);
    expect(component.state.combo).toBe(0);
    expect(oxyde.disabled).toBeTrue();
    expect(sel.hint).toBeTrue();
    component.intro();
  });

  it('should clear the screen when a special molecule is sorted', () => {
    component.compounds = [{ type: 'sel', formule: 'NaCl', general: '', name: '' }];
    component.start();
    component.molecules = [
      { id: 1, compound: component.compounds[0], lane: 0, y: 0.5, special: true },
      { id: 2, compound: component.compounds[0], lane: 1, y: 0.2, special: false }
    ];
    component.selectMolecule(component.molecules[0]);
    component.selectBin(component.bins.find((b) => b.value === 'sel')!);
    expect(component.molecules.length).toBe(0);
    component.intro();
  });
});
