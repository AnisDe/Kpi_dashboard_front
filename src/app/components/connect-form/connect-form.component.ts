import { Component, OnInit } from '@angular/core';
import { SqlDatabaseService } from '../../services/DataBase_Services/SqlDatabase_Services/sql-database.service';
import { MongoDatabaseService } from 'src/app/services/DataBase_Services/MongoDatabase_Services/mongo-database.service';
import { Field, QueryBuilderConfig } from 'ngx-angular-query-builder';
import { interval, min } from 'rxjs';
import { Observable } from 'rxjs';

import Chart from 'chart.js/auto';
import { QueryBuilderService } from 'src/app/services/QueryBuilder_Services/query-builder.service';
import { HttpClient } from '@angular/common/http';

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
  connectionString = '';
  databaseService: any;
  password = '';
  loading = false;
  result: Metadata | null = null;
  error: string | null = null;
  xAxisColumnName: string = '';
  yAxisColumnName: string = '';
  yAxisColumnNamesArrays: string[][] = [[]];
  private baseUrl = 'http://localhost:9090/tables';

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
    private mongodbDatabaseService: MongoDatabaseService,
    private queryBuilderService: QueryBuilderService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.queryBuilderConfig = {
      fields: {},
    };
    // interval(10000).subscribe(() => {
    //   this.refreshData();
    // });
  }
  addYAxisInput(): void {
    this.yAxisColumnNamesArrays.push(['']);
  }

  removeYAxisInput(index: number): void {
    const canvas = document.getElementById('myChart') as HTMLCanvasElement;
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }
    this.yAxisColumnNamesArrays.splice(index, 1);
    this.convertToChartData();
  }

  updateYAxisArray(selectedValue: string, index: number): void {
    this.yAxisColumnNamesArrays[index][0] = selectedValue;
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
    this.connect(this.url, this.username, this.password).subscribe(
      (data: Metadata) => {
        this.loading = false;
        this.connectionString = this.url;
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
  connect(url: string, username: string, password: string): Observable<any> {
    const body = { url, username, password };
    const urlEndpoint = `${this.baseUrl}/connect`;
    return this.http.post<any>(urlEndpoint, body);
  }
  refreshData(): void {
    if (!this.url || !this.username) {
      return;
    }
    this.databaseService
      .connect(this.url, this.username, this.password)
      .subscribe(
        (data: Metadata) => {
          this.result = data;
          this.setFields(data);
          console.log('Data refreshed');
        },
        (error: { message: string | null }) => {
          console.error('Connect failed!', error);
          this.error = error.message;
        }
      );
  }

  onQueryChange() {
    this.convertToChartData();
    console.log(this.yAxisColumnName);
    console.log('URLLLL', this.connectionString);
    console.log('YYYYYYYYYY', this.yAxisColumnNamesArrays);
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
        console.log('DATAAAAAA', data);
        const variableValues = data.map((item) => item[variableName]);
        console.log('selectVariableValues', variableValues);
        resolve(variableValues);
      });
    });
  }

  convertToChartData(): void {
    let response: Observable<any>;

    if (this.selectedDatabaseType === 'mongodb') {
      const mongoQuery = this.mongodbDatabaseService.convertRuleToMongoQuery(
        this.query,
        this.tableNames
      );
      console.log(mongoQuery);
      response = this.mongodbDatabaseService.executeQuery(
        this.connectionString,
        mongoQuery
      );
    } else if (this.selectedDatabaseType === 'postgresql') {
      const sqlQuery = this.sqlDatabaseService.convertToSQL(
        this.tableNames,
        this.query
      );

      response = this.sqlDatabaseService.executeSQL(sqlQuery);
    } else {
      console.error('Invalid selectedDatabaseType:', this.selectedDatabaseType);
      return;
    }

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

        const existingChart = Chart.getChart(canvas);
        if (existingChart) {
          existingChart.destroy();
        }

        const labels = Array.from([], () => '');
        const datasets = [];

        // Fetch x-axis values
        const xAxisColumnNameValues = await this.selectVariableValues(
          response,
          this.xAxisColumnName
        );

        for (const yAxisColumnNames of this.yAxisColumnNamesArrays) {
          const yAxisColumnName = yAxisColumnNames[0]; // Assuming only one column is used
          const yAxisColumnNameValues = await this.selectVariableValues(
            response,
            yAxisColumnName
          );

          const dataPoints = [];
          for (
            let i = 0;
            i < xAxisColumnNameValues.length &&
            i < yAxisColumnNameValues.length;
            i++
          ) {
            dataPoints.push({
              x: xAxisColumnNameValues[i].toString(),
              y: yAxisColumnNameValues[i],
            });
          }

          datasets.push({
            label: yAxisColumnNames.join(', '),
            data: dataPoints,
            backgroundColor: this.getRandomColor(),
            beginAtZero: true,
          });
        }

        new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: datasets,
          },
          options: {
            scales: {
              x: {
                reverse: false,
              },
            },
          },
        });
      },
      (error) => {
        console.error('Error executing SQL:', error);
      }
    );
  }
  getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }
  setFields(metadata: Metadata): void {
    if (this.selectedDatabaseType === 'mongodb') {
      this.setFieldsForMongoDB(metadata);
    } else if (this.selectedDatabaseType === 'postgresql') {
      this.setFieldsForPostgreSQL(metadata);
    } else {
      console.error('Invalid database type selected.');
    }
  }

  setFieldsForMongoDB(metadata: Metadata): void {
    const { fields: queryBuilderConfigFields } = this.config;

    for (const [tableName, table] of Object.entries(metadata)) {
      const columns = this.getTableNames(table);
      this.tableNames.push(tableName); // Add tableName to the tableNames array
      columns.forEach((column: string) => {
        const columnData = table[column];
        const columnType = this.getColumnType(columnData);
        const field: Field = {
          name: column,
          type: this.databaseService.getCollectionTypeValue(columnType),
          operators: this.queryBuilderService.getOperatorsForFieldType(
            this.databaseService.getCollectionTypeValue(columnType)
          ),
        };
        queryBuilderConfigFields[column] = field;
        this.columnNames.push(column); // Add column to the columnNames array
      });
    }
  }

  private setFieldsForPostgreSQL(metadata: Metadata): void {
    const { fields: queryBuilderConfigFields } = this.config;

    for (const [tableName, table] of Object.entries(metadata)) {
      const columns = this.getTableNames(table);
      this.tableNames.push(tableName); // Add tableName to the tableNames array

      columns.forEach((column: string) => {
        const columnData = table[column];
        const columnType = this.getColumnType(columnData);
        const field: Field = {
          name: column,
          type: this.databaseService.mapPostgresTypeToQueryBuilderType(
            columnType
          ),
          operators: this.queryBuilderService.getOperatorsForFieldType(
            this.databaseService.mapPostgresTypeToQueryBuilderType(columnType)
          ),
        };
        queryBuilderConfigFields[column] = field;
        this.columnNames.push(column); // Add column to the columnNames array
      });
    }
  }
  getColumnType(columnType: any): string {
    if (Array.isArray(columnType)) {
      return columnType.length > 0 ? columnType[0] : 'unknown';
    } else if (columnType && typeof columnType === 'object') {
      if (columnType.hasOwnProperty('columnType')) {
        return this.getColumnType(columnType.columnType);
      } else if (columnType.hasOwnProperty('fieldType')) {
        return this.getColumnType(columnType.fieldType);
      } else if (columnType.hasOwnProperty('dataType')) {
        return columnType.dataType.toLowerCase();
      } else {
        return 'unknown';
      }
    } else if (typeof columnType === 'string') {
      return columnType;
    } else {
      return 'unknown';
    }
  }

  getTableNames(data: any): string[] {
    return Object.keys(data);
  }

  toggleYAxisColumn() {
    this.convertToChartData();
  }
  toggleXAxisColumn() {
    this.convertToChartData();
  }

  getColumnValues(columnType: any): any[] {
    if (Array.isArray(columnType)) {
      return columnType.length > 0 ? columnType.slice(1) : [];
    } else if (columnType && typeof columnType === 'object') {
      return columnType.hasOwnProperty('columnValues')
        ? columnType.columnValues
        : columnType.hasOwnProperty('fieldValues')
        ? columnType.fieldValues
        : [];
    } else {
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
}
