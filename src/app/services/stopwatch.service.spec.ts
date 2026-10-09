import { TestBed } from '@angular/core/testing';

import { StopwatchService } from './stopwatch.service';

describe('StopwatchService', () => {
  let service: StopwatchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StopwatchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('adds a time penalty', () => {
    service.resetStopwatch();
    service.addTime(3000);
    expect(service.getDisplayString()).toBe('00:03:000');
  });
});
