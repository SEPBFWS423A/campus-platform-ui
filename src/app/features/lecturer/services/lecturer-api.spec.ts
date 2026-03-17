import { TestBed } from '@angular/core/testing';

import { LecturerApi } from './lecturer-api';

describe('LecturerApi', () => {
  let service: LecturerApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LecturerApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
