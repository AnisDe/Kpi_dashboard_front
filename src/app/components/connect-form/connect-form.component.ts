import { Component, OnInit } from '@angular/core';
import { SqlDatabaseService } from '../../services/DataBase_Services/SqlDatabase_Services/sql-database.service';
import { MongoDatabaseService } from 'src/app/services/DataBase_Services/MongoDatabase_Services/mongo-database.service';
import { Field, QueryBuilderConfig } from 'ngx-angular-query-builder';
import { interval, min } from 'rxjs';
import { Observable } from 'rxjs';

import Chart from 'chart.js/auto';

interface Metadata {
  [key: string]: { [key: string]: any[] };
}

@Component({
  selector: 'app-connect-form',
  templateUrl: 'connect-form.component.html',
  styleUrls: ['connect-form.component.css'],
})
export class ConnectFormComponent implements OnInit {
  url = '';
  username = '';
  databaseService: any;
  password = '';
  loading = false;
  result: Metadata | null = null;
  error: string | null = null;
  xAxisColumnName: string = '';
  yAxisColumnName: string = '';

  queryBuilderConfig!: QueryBuilderConfig;
  query: any = {
    condition: 'and',
    rules: [],
  };
  selectedDatabaseType: 'mongodb' | 'postgresql' = 'mongodb';

  config: QueryBuilderConfig = {
    fields: {},
  };
  tableNames: string[] = []; // Declaring tableNames as a class property
  columnNames: string[] = [];
  constructor(
    private sqlDatabaseService: SqlDatabaseService,
    private mongodbDatabaseService: MongoDatabaseService
  ) {}

  ngOnInit(): void {
    this.queryBuilderConfig = {
      fields: {},
    };
    // interval(10000).subscribe(() => {
    //   this.refreshData();
    // });
  }

  onConnect(): void {
    this.loading = true;
    this.result = null;
    this.error = null;

    if (!this.url || !this.username) {
      this.loading = false;
      this.error = 'URL and Username are required fields.';
      return;
    }

    if (this.selectedDatabaseType === 'mongodb') {
      this.databaseService = this
        .mongodbDatabaseService as MongoDatabaseService;
    } else if (this.selectedDatabaseType === 'postgresql') {
      this.databaseService = this.sqlDatabaseService as SqlDatabaseService;
    }

    if (!this.databaseService) {
      console.error('Selected database service is undefined.');
      return;
    }
    this.databaseService
      .connect(this.url, this.username, this.password)
      .subscribe(
        (data: Metadata) => {
          this.loading = false;
          this.result = data;
          this.setFields(data);
        },
        (error: { message: string | null }) => {
          console.error('Connect failed!', error);
          this.loading = false;
          this.error = error.message;
        }
      );
  }

  refreshData(): void {
    if (!this.url || !this.username) {
      return;
    }
    this.sqlDatabaseService
      .connect(this.url, this.username, this.password)
      .subscribe(
        (data: Metadata) => {
          this.result = data;
          this.setFields(data);
          console.log('Data refreshed');
        },
        (error) => {
          console.error('Connect failed!', error);
          this.error = error.message;
        }
      );
  }

  onQueryChange() {
    this.convertToChartData();
    console.log(this.yAxisColumnName);
    // Check if the field and value exist in the result
    // if (!this.isDataValid(field, value)) {
    //   console.log('Field or value does not exist in the result.');
    //   return;
    // }
    // const sqlQuery = this.convertToSQL(this.tableNames, this.query);
    // console.log(sqlQuery);
    // this.executeSQL(sqlQuery);
  }

  async selectVariableValues(
    response: Observable<any[]>,
    variableName: string
  ): Promise<any[]> {
    return new Promise<any[]>((resolve) => {
      response.subscribe((data) => {
        const variableValues = data.map((item) => item[variableName]);
        console.log('selectVariableValues', variableValues);
        resolve(variableValues);
      });
    });
  }

  convertToChartData(): void {
    const sqlQuery = this.convertToSQL(this.tableNames, this.query);
    const response = this.sqlDatabaseService.executeSQL(sqlQuery);
    console.log('RESPONSE', response);

    response.subscribe(
      async (data) => {
        const canvas = document.getElementById(
          'myChart'
        ) as HTMLCanvasElement | null;
        if (!canvas) {
          console.error('Chart canvas element not found.');
          return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error('Failed to get 2D context for chart canvas.');
          return;
        }

        // Destroy existing chart if it exists
        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
          existingChart.destroy();
        }

        const yAxisColumnNameValues = await this.selectVariableValues(
          response,
          this.yAxisColumnName
        );
        const xAxisColumnNameValues = await this.selectVariableValues(
          response,
          this.xAxisColumnName
        );
        const dataPoints = [];

        // Loop through the x and y arrays and create data objects
        for (
          let i = 0;
          i < xAxisColumnNameValues.length && i < yAxisColumnNameValues.length;
          i++
        ) {
          dataPoints.push({
            x: xAxisColumnNameValues[i].toString(),
            y: yAxisColumnNameValues[i],
          });
        }
        console.log(dataPoints);
        const labels = Array.from({ length: 62 }, () => '');
        new Chart(ctx, {
          type: 'line', // Change the chart type as per your requirement
          data: {
            labels: labels,
            datasets: [
              {
                label: this.yAxisColumnName,
                data: dataPoints,
                backgroundColor: 'rgba(0, 123, 255, 0.5)',
              },
            ],
          },
        });
      },
      (error) => {
        console.error('Error executing SQL:', error);
      }
    );
  }

  setFields(metadata: Metadata): void {
    const { fields: queryBuilderConfigFields } = this.config;

    for (const [tableName, table] of Object.entries(metadata)) {
      const columns = this.getTableNames(table);
      this.tableNames.push(tableName); // Add tableName to the tableNames array

      columns.forEach((column: string) => {
        const columnData = table[column];
        const columnType = this.getColumnType(columnData);
        const field: Field = {
          name: column,
          type: this.sqlDatabaseService.mapPostgresTypeToQueryBuilderType(
            columnType
          ),
          operators: this.getOperatorsForFieldType(
            this.sqlDatabaseService.mapPostgresTypeToQueryBuilderType(
              columnType
            )
          ),
        };
        queryBuilderConfigFields[column] = field;
        this.columnNames.push(column); // Add column to the columnNames array
      });
    }
  }

  getTableNames(data: any): string[] {
    return Object.keys(data);
  }

  getAllFields(condition: { field: any; rules: any[] }) {
    let fields: any[] = [];

    if (condition.field) {
      fields.push(condition.field);
    }

    if (condition.rules && Array.isArray(condition.rules)) {
      condition.rules.forEach((rule: { field: any; rules: any }) => {
        if (rule.field) {
          fields.push(rule.field);
        }

        if (rule.rules && Array.isArray(rule.rules)) {
          fields = fields.concat(this.getAllFields(rule));
        }
      });
    }

    return fields;
  }
  toggleYAxisColumn() {
    this.convertToChartData();
  }
  toggleXAxisColumn() {
    this.convertToChartData();
  }

  getColumnType(columnType: any): string {
    if (Array.isArray(columnType)) {
      return columnType.length > 0
        ? this.getColumnTypeValue(columnType[0])
        : 'unknown';
    } else if (columnType && typeof columnType === 'object') {
      if (columnType.hasOwnProperty('columnType')) {
        return this.getColumnTypeValue(columnType.columnType);
      } else if (columnType.hasOwnProperty('dataType')) {
        return columnType.dataType.toLowerCase();
      } else {
        return 'unknown';
      }
    } else {
      return 'unknown';
    }
  }

  getColumnValues(columnType: any): any[] {
    if (Array.isArray(columnType)) {
      return columnType.length > 0 ? columnType.slice(1) : [];
    } else if (columnType && typeof columnType === 'object') {
      return columnType.hasOwnProperty('columnValues')
        ? columnType.columnValues
        : [];
    } else {
      return [];
    }
  }

  getCollectionType(columnType: any): string {
    console.log(columnType);
    if (Array.isArray(columnType.fieldType)) {
      console.log('first');
      return columnType.fieldType.length > 0
        ? this.mongodbDatabaseService.getCollectionTypeValue(
            columnType.fieldType[0]
          )
        : 'unknown';
    } else if (columnType && typeof columnType === 'object') {
      if (columnType.hasOwnProperty('fieldType')) {
        return this.mongodbDatabaseService.getCollectionTypeValue(
          columnType.fieldType
        );
      } else if (columnType.hasOwnProperty('dataType')) {
        return this.mongodbDatabaseService.getCollectionTypeValue(
          columnType.dataType.toLowerCase()
        );
      } else {
        return 'unknown';
      }
    } else if (typeof columnType === 'string') {
      return this.mongodbDatabaseService.getCollectionTypeValue(
        columnType.toLowerCase()
      );
    } else {
      return 'unknown';
    }
  }

  getColumnTypeValue(type: any): string {
    if (typeof type === 'string') {
      return type;
    } else if (Array.isArray(type)) {
      return type.length > 0 ? type[0] : 'unknown';
    } else {
      return 'unknown';
    }
  }

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

  isDataValid(field: string, value: any): boolean {
    if (!this.result) {
      return false;
    }

    for (const tableName in this.result) {
      if (this.result.hasOwnProperty(tableName)) {
        const table = this.result[tableName];
        if (table.hasOwnProperty(field)) {
          const columnValues = table[field];
          if (this.isValueInColumnValues(columnValues, value)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  isValueInColumnValues(columnValues: any, value: any): boolean {
    if (Array.isArray(columnValues.columnValues)) {
      const stringValues = columnValues.columnValues.map(String);
      const stringValue = String(value);
      return stringValues.includes(stringValue);
    }

    return false;
  }
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
}
