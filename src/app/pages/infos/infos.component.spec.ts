import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { InfosComponent } from './infos.component';

describe('InfosComponent', () => {
  let component: InfosComponent;
  let fixture: ComponentFixture<InfosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InfosComponent ],
      imports: [ NoopAnimationsModule ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
