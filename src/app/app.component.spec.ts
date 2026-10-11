import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { SwUpdate } from '@angular/service-worker';
import { of } from 'rxjs';
import { DataService } from './services/data.service';

describe('AppComponent', () => {
  let mockSwUpdate: any;

  beforeEach(async () => {
    mockSwUpdate = {
      isEnabled: false,
      versionUpdates: of()
    };

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
      declarations: [
        AppComponent
      ],
      providers: [
        { provide: SwUpdate, useValue: mockSwUpdate },
        { provide: DataService, useValue: { loadData: () => Promise.resolve() } }
      ],
      schemas: [ NO_ERRORS_SCHEMA ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'isotope'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('isotope');
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.sitename')?.textContent).toContain('isotope.ch');
  });
});
