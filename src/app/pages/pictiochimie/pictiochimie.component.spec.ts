import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PictiochimieComponent } from './pictiochimie.component';

describe('PictiochimieComponent', () => {
  let component: PictiochimieComponent;
  let fixture: ComponentFixture<PictiochimieComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PictiochimieComponent]
    });
    fixture = TestBed.createComponent(PictiochimieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
