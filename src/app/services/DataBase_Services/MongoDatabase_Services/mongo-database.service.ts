import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MongoDatabaseService {
  private baseUrl = 'http://localhost:9090/tables';
  constructor(private http: HttpClient) {}

  getCollectionType(columnType: any): string {
    if (Array.isArray(columnType.fieldType)) {
      return columnType.fieldType.length > 0
        ? this.getCollectionTypeValue(columnType.fieldType[0])
        : 'unknown';
    } else if (columnType && typeof columnType === 'object') {
      if (columnType.hasOwnProperty('fieldType')) {
        return this.getCollectionTypeValue(columnType.fieldType);
      } else if (columnType.hasOwnProperty('dataType')) {
        return this.getCollectionTypeValue(columnType.dataType.toLowerCase());
      } else {
        return 'unknown';
      }
    } else if (typeof columnType === 'string') {
      return this.getCollectionTypeValue(columnType.toLowerCase());
    } else {
      return 'unknown';
    }
  }
  convertRuleToMongoQuery(rule: any, collectionsNames: string[]): any {
    const queries: any = {
      queries: {},
    };

    collectionsNames.forEach((collectionName) => {
      queries.queries[collectionName] = this.convertRuleForCollection(rule);
    });

    return queries;
  }

  convertRuleForCollection(rule: any): any {
    console.log(rule);

    // Check if the rule has a 'condition' property and an array of 'rules'
    if ('condition' in rule && Array.isArray(rule.rules)) {
      const operator = rule.condition === 'and' ? '$and' : '$or';

      // Recursively process each rule in the array
      return {
        [operator]: rule.rules.map((ruleOrQuery: any) => {
          if ('condition' in ruleOrQuery) {
            return this.convertRuleForCollection(ruleOrQuery); // Recurse for nested rules
          } else {
            const field = ruleOrQuery.field;
            const operator = this.getMongoOperator(ruleOrQuery.operator);
            const value = ruleOrQuery.value;

            if (operator && field && value !== undefined) {
              const condition: any = {};
              condition[field] = { [operator]: value };
              return condition;
            } else {
              return {};
            }
          }
        }),
      };
    } else {
      return {}; // Return an empty object for unsupported rule structures
    }
  }

  getMongoOperator(operator: string): string | undefined {
    switch (operator) {
      case 'equals':
        return '$eq';
      case 'notEquals':
        return '$ne';
      case 'greaterThan':
        return '$gt';
      case 'greaterThanOrEqual':
        return '$gte';
      case 'lessThan':
        return '$lt';
      case 'lessThanOrEqual':
        return '$lte';
      case 'contains':
        return '$regex';
      case 'notContains':
        return '$not';
      default:
        return undefined;
    }
  }
  //YEMCHII
  // executeMongoQuery(query: any): Observable<any> {
  //   const response = this.executeQuery(JSON.stringify(query));
  //   response.subscribe(
  //     (result) => {
  //       console.log('SQL response:', result);
  //     },
  //     (error) => {
  //       console.error('Error executing SQL:', error);
  //     }
  //   );

  //   return response;
  // }

  // private executeQuery(query: string): Observable<any> {
  //   const urlEndpoint = `${this.baseUrl}/executeMongoQuery`;
  //   const body = { query };
  //   return this.http.post<any>(urlEndpoint, body);
  // }

  executeSQL(connectionString: string, query: string) {
    const response = this.executeQuery(connectionString, query);
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

  executeQuery(connectionString: string, query: string): Observable<any> {
    const urlEndpoint = `${this.baseUrl}/executeMongoQuery`; // Adjust the URL if needed
    const body = { connectionString, query: JSON.stringify(query) }; // Convert the query to a string
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
