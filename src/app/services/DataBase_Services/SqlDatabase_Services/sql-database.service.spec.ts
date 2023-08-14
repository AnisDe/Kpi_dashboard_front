import { TestBed } from '@angular/core/testing';

import { SqlDatabaseService } from './sql-database.service';

describe('DatabaseService', () => {
  let service: SqlDatabaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SqlDatabaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
