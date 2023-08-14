import { TestBed } from '@angular/core/testing';

import { MongoDatabaseService } from './mongo-database.service';

describe('MongoDatabaseService', () => {
  let service: MongoDatabaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MongoDatabaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
