import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScoreStarsComponent } from './score-stars.component';

describe('ScoreStarsComponent', () => {
  let component: ScoreStarsComponent;
  let fixture: ComponentFixture<ScoreStarsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScoreStarsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScoreStarsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
