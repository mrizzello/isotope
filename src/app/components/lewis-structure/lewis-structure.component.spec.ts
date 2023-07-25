import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LewisStructureComponent } from './lewis-structure.component';

describe('LewisStructureComponent', () => {
  let component: LewisStructureComponent;
  let fixture: ComponentFixture<LewisStructureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LewisStructureComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LewisStructureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
