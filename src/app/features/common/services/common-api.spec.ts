import { TestBed } from '@angular/core/testing';

import { CommonApi } from './common-api';

describe('CommonApi', () => {
  let service: CommonApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommonApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
