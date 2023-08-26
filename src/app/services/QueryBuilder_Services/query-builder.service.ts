import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class QueryBuilderService {
  constructor() {}
  getOperatorsForFieldType(fieldType: string): string[] {
    switch (fieldType) {
      case 'string':
        return ['equals', 'notEquals', 'contains', 'notContains'];
      case 'number':
      case 'decimal':
        return ['equals', 'notEquals', 'lessThan', 'greaterThan'];
      case 'boolean':
        return ['equals'];
      case 'date':
        return ['equals', 'notEquals', 'lessThan', 'greaterThan'];
      case 'time':
        return ['equals', 'notEquals', 'before', 'after'];
      case 'datetime':
        return ['equals', 'notEquals', 'before', 'after'];
      default:
        return [];
    }
  }
}
