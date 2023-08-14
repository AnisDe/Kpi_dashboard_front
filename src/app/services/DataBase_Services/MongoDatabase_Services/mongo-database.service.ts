import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MongoDatabaseService {
  private baseUrl = 'http://localhost:9090/tables';

  constructor(private http: HttpClient) {}
  connect(url: string, username: string, password: string): Observable<any> {
    const body = { url, username, password };
    const urlEndpoint = `${this.baseUrl}/connect`;
    return this.http.post<any>(urlEndpoint, body);
  }

  getCollectionTypeValue(columnType: string): string {
    // Define mappings for different column types
    switch (columnType) {
      case 'Date':
        return 'Date';
      case 'Boolean':
        return 'boolean';
      case 'Null':
        return 'null';
      case 'String':
        return 'string';
      case 'Array':
        return 'any[]';
      case 'Double':
        return 'number';
      case 'Integer':
        return 'number';
      case 'Object':
        return 'object';
      case 'ObjectId':
        return 'string';
      case 'Regular expression':
        return 'RegExp';
      case 'Binary file':
        return 'Uint8Array';
      case 'Symbol':
        return 'symbol';
      case 'Number':
        return 'number';
      case 'Undefined':
        return 'undefined';
      default:
        return 'any';
    }
  }
}
