import { TestBed } from '@angular/core/testing';

import { SharedDatabasesService } from './shared-databases.service';

describe('SharedDatabasesService', () => {
  let service: SharedDatabasesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SharedDatabasesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
