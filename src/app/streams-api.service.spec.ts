import { TestBed } from '@angular/core/testing';

import { StreamsApiService } from './streams-api.service';

describe('StreamsApiService', () => {
  let service: StreamsApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StreamsApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
