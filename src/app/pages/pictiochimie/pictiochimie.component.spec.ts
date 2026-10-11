import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { PictiochimieComponent } from './pictiochimie.component';

describe('PictiochimieComponent', () => {
  let component: PictiochimieComponent;
  let fixture: ComponentFixture<PictiochimieComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ PictiochimieComponent ],
      imports: [ NoopAnimationsModule ],
      providers: [ provideHttpClient() ],
      schemas: [ NO_ERRORS_SCHEMA ]
    });
    fixture = TestBed.createComponent(PictiochimieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
