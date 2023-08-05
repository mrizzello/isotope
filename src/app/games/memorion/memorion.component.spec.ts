import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemorionComponent } from './memorion.component';

describe('MemorionComponent', () => {
  let component: MemorionComponent;
  let fixture: ComponentFixture<MemorionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MemorionComponent]
    });
    fixture = TestBed.createComponent(MemorionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
