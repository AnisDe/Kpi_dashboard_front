import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DatabaseService {
  private baseUrl = 'http://localhost:8080/tables';

  constructor(private http: HttpClient) {}

  connect(url: string, username: string, password: string): Observable<any> {
    const body = { url, username, password };
    const urlEndpoint = `${this.baseUrl}/connect`;
    return this.http.post<any>(urlEndpoint, body);
  }
}
