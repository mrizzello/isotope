import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrivionComponent } from './trivion.component';

describe('TrivionComponent', () => {
  let component: TrivionComponent;
  let fixture: ComponentFixture<TrivionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TrivionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrivionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
