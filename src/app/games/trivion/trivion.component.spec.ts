import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { TrivionComponent } from './trivion.component';

describe('TrivionComponent', () => {
  let component: TrivionComponent;
  let fixture: ComponentFixture<TrivionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TrivionComponent ],
      imports: [ NoopAnimationsModule ],
      providers: [ provideHttpClient() ],
      schemas: [ NO_ERRORS_SCHEMA ]
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
