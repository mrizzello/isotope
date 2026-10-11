import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { LewisComponent } from './lewis.component';

describe('LewisComponent', () => {
  let component: LewisComponent;
  let fixture: ComponentFixture<LewisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LewisComponent ],
      imports: [ NoopAnimationsModule ],
      providers: [ provideHttpClient() ],
      schemas: [ NO_ERRORS_SCHEMA ]
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
