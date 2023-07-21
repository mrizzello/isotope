import { TestBed } from '@angular/core/testing';

import { ShowResultsService } from './show-results.service';

describe('ShowResultsService', () => {
  let service: ShowResultsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ShowResultsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
