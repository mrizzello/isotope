import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { HexaionsComponent } from './hexaions.component';

describe('HexaionsComponent', () => {
  let component: HexaionsComponent;
  let fixture: ComponentFixture<HexaionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HexaionsComponent ],
      imports: [ NoopAnimationsModule ],
      providers: [ provideHttpClient() ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HexaionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should build the grid matching the chosen radius and draw a tile on start', () => {
    component.ions = {
      cations: [{ symbol: 'Na', charge: '+' }],
      anions: [{ symbol: 'Cl', charge: '–' }]
    };
    component.gridRadius = 2; // Grille L
    component.start();
    expect(component.cells.length).toBe(19);
    expect(component.drawnTile).not.toBeNull();
    expect(component.showGame).toBeTrue();

    component.gridRadius = 3; // Grille XL
    component.start();
    expect(component.cells.length).toBe(37);
  });
});
