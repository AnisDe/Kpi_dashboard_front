import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SqlDatabaseService {
  private baseUrl = 'http://localhost:9090/tables';

  constructor(private http: HttpClient) {}

  connect(url: string, username: string, password: string): Observable<any> {
    const body = { url, username, password };
    const urlEndpoint = `${this.baseUrl}/connect`;
    return this.http.post<any>(urlEndpoint, body);
  }

  executeSQL(query: string) {
    const response = this.executeQuery(query);
    response.subscribe(
      (result) => {
        console.log('SQL response:', result);
      },
      (error) => {
        console.error('Error executing SQL:', error);
      }
    );

    return response;
  }

  executeQuery(query: string): Observable<any> {
    const urlEndpoint = `${this.baseUrl}/query`;
    const body = { query };
    return this.http.post<any>(urlEndpoint, body);
  }

  mapPostgresTypeToQueryBuilderType(columnType: string): string {
    switch (columnType.toLowerCase()) {
      case 'varchar':
      case 'text':
        return 'string';
      case 'integer':
      case 'bigint':
      case 'smallint':
      case 'numeric':
      case 'real':
      case 'double precision':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'date':
        return 'date';
      case 'time':
      case 'time without time zone':
        return 'time';
      case 'timestamp':
      case 'timestamp without time zone':
        return 'datetime';
      default:
        return 'unknown';
    }
  }
}
