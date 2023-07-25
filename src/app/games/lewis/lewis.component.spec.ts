import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LewisComponent } from './lewis.component';

describe('LewisComponent', () => {
  let component: LewisComponent;
  let fixture: ComponentFixture<LewisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LewisComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LewisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
