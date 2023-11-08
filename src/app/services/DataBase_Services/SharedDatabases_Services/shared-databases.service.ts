import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { ChartService } from 'src/app/services/Chart_services/chart.service';

@Injectable({
  providedIn: 'root',
})
export class SharedDatabasesService {
  constructor(private chartService: ChartService, private http: HttpClient) {}
  private baseUrl = 'http://localhost:9090/tables';

  getColumnType(column: any): string {
    if (Array.isArray(column)) {
      return column.length > 0 ? column[0] : 'unknown';
    } else if (column && typeof column === 'object') {
      if (column.hasOwnProperty('columnType')) {
        return this.getColumnType(column.columnType);
      } else if (column.hasOwnProperty('fieldType')) {
        return this.getColumnType(column.fieldType);
      } else if (column.hasOwnProperty('dataType')) {
        return column.dataType.toLowerCase();
      } else {
        return 'unknown';
      }
    } else if (typeof column === 'string') {
      return column;
    } else {
      return 'unknown';
    }
  }

  disconnect(url: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const requestBody = { url };
    this.chartService.destroyChart('myChart');
    console.log('url', url, ' headers:', headers);
    sessionStorage.removeItem('chartData');
    sessionStorage.removeItem('url');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('password');
    return this.http.post(`${this.baseUrl}/disconnect`, requestBody, {
      headers,
      responseType: 'text',
    });
  }

  getFilteredData(): Observable<any[]> {
    const urlEndpoint = `${
      this.baseUrl
    }/queries?timestamp=${new Date().getTime()}`;

    return this.http.get<any[]>(urlEndpoint).pipe(
      map(
        (
          data: {
            name: any;
            conditions: any;
            database: { databaseName: any; url: any; type: any };
          }[]
        ) =>
          data.map(
            (item: {
              name: any;
              conditions: any;
              database: { databaseName: any; url: any; type: any };
            }) => ({
              name: item.name,
              conditions: item.conditions,
              database: {
                databaseName: item.database.databaseName,
                url: item.database.url,
                type: item.database.type,
              },
            })
          )
      ),
      tap((result) => {
        if (result.length === 0) {
          console.log('No logged queries');
        }
      }),
      catchError((error) => {
        console.error('Error in getFilteredData:', error);
        return throwError(error);
      })
    );
  }

  getDataBases(): Observable<any[]> {
    const urlEndpoint = `${this.baseUrl}/user-databases`;

    return this.http.get<any[]>(urlEndpoint).pipe(
      map((databases) =>
        databases.map((database) => ({
          databaseName: database.databaseName,
          url: database.url,
          type: database.type,
        }))
      )
    );
  }
}
