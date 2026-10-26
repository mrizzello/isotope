import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { BalanceComponent } from './balance.component';
import { SafeHtmlPipe } from '../../pipes/sanitize.pipe';

describe('BalanceComponent', () => {
  let component: BalanceComponent;
  let fixture: ComponentFixture<BalanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BalanceComponent, SafeHtmlPipe ],
      imports: [ NoopAnimationsModule ],
      providers: [ provideHttpClient() ],
      schemas: [ NO_ERRORS_SCHEMA ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start a match of 3 distinct equations with empty coefficients', () => {
    component.start();
    expect(component.equations.length).toBe(3);
    expect(new Set(component.equations).size).toBe(3);
    expect(component.state).not.toBeNull();
    expect(component.state!.coefs.every((c) => c === 0)).toBeTrue();
    expect(component.state!.hands.human.length).toBe(3);
    expect(component.state!.hands.algo.length).toBe(3);
    expect(component.showGame).toBeTrue();
  });

  it('should animate a discarded molecule before replacing it', fakeAsync(() => {
    component.start();
    component.state = { ...component.state!, current: 'human' };
    component.disableClick = false;
    component.algoDelay = 1e9; // le robot ne joue pas pendant le test
    const before = component.state!.hands.human[0];
    component.selectHand(0);
    component.discard();
    expect(component.discarding).toEqual({ player: 'human', handIndex: 0 });
    expect(component.state!.hands.human[0]).toBe(before);
    expect(component.state!.current).toBe('human');
    tick(750);
    expect(component.discarding).toBeNull();
    expect(component.state!.current).toBe('algo');
    component.ngOnDestroy();
  }));

  it('should show the tutorial only for the first two human moves of a match', () => {
    component.start();
    component.state = { ...component.state!, current: 'human', hands: { ...component.state!.hands, human: ['TTTTTTTT', 'TTTTTTTT', 'TTTTTTTT'] } };
    component.disableClick = false;
    expect(component.showTutorial).toBeTrue();
    component.humanMoves = 2;
    expect(component.showTutorial).toBeFalse();
    component.start();
    expect(component.humanMoves).toBe(0);
  });
});
