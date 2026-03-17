import { TestBed } from '@angular/core/testing';

import { StudentApi } from './student-api';

describe('StudentApi', () => {
  let service: StudentApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StudentApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
