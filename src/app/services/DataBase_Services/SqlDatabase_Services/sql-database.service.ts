import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SqlDatabaseService {
  private baseUrl = 'http://localhost:9090/tables';

  constructor(private http: HttpClient) {}

  convertToSQL(
    tableNames: string[],
    query: { condition: string; rules: any[] }
  ): string {
    let sqlQueries = [];
    for (const tableName of tableNames) {
      let sqlQuery = `SELECT * FROM "${tableName}"`;

      if (query.rules.length > 0) {
        let conditions = query.rules
          .map((rule) => this.generateCondition(rule))
          .join(` ${query.condition.toUpperCase()} `);
        sqlQuery += ` WHERE ${conditions}`;
      }

      sqlQueries.push(sqlQuery);
    }

    return sqlQueries.join('; ');
  }

  generateCondition(rule: any): string {
    if (rule.condition && rule.rules && rule.rules.length > 0) {
      let conditions = rule.rules
        .map((subRule: any) => this.generateCondition(subRule))
        .join(` ${rule.condition.toUpperCase()} `);
      return `(${conditions})`;
    } else {
      const field = `"${rule.field}"`;
      const operator = rule.operator;
      const value = rule.value;

      let condition = '';

      if (operator === 'equals') {
        condition = `${field} = ${this.formatValue(value)}`;
      } else if (operator === 'notEquals') {
        condition = `${field} <> ${this.formatValue(value)}`;
      } else if (operator === 'lessThan') {
        condition = `${field} < ${this.formatValue(value)}`;
      } else if (operator === 'lessThanOrEqual') {
        condition = `${field} <= ${this.formatValue(value)}`;
      } else if (operator === 'greaterThan') {
        condition = `${field} > ${this.formatValue(value)}`;
      } else if (operator === 'greaterThanOrEqual') {
        condition = `${field} >= ${this.formatValue(value)}`;
      } else if (operator === 'contains') {
        condition = `${field} LIKE '%${value}%'`;
      } else if (operator === 'notContains') {
        condition = `${field} NOT LIKE '%${value}%'`;
      }

      return condition;
    }
  }

  formatValue(value: any): string {
    if (typeof value === 'string') {
      return `'${value}'`;
    } else if (typeof value === 'boolean') {
      return value ? 'TRUE' : 'FALSE';
    } else {
      return value.toString();
    }
  }
  executeSQL(
    queryName: string,
    query: string,
    condition: string
  ): Observable<any> {
    const response = this.executeQuery(queryName, query, condition);
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

  executeQuery(
    queryName: string,
    query: string,
    queryBuilders: string
  ): Observable<any> {
    const urlEndpoint = `${this.baseUrl}/query`;
    const body = { query, queryBuilders, queryName };
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

  saveQuery(
    queryName: string,
    query: string,
    condition: string
  ): Observable<any> {
    const response = this.saveQueryy(queryName, query, condition);
    response.subscribe(
      (result) => {
        console.log('Query saved', result);
      },
      (error) => {
        console.error('Query not saved', error);
      }
    );

    return response;
  }

  saveQueryy(
    queryName: string,
    query: string,
    queryBuilders: string
  ): Observable<any> {
    const urlEndpoint = `${this.baseUrl}/saveQuery`;
    console.log('first');
    const body = { query, queryBuilders, queryName };
    return this.http.post<any>(urlEndpoint, body);
  }
}
