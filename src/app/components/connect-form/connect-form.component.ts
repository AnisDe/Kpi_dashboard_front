import { Component, OnInit } from '@angular/core';
import { SqlDatabaseService } from '../../services/DataBase_Services/SqlDatabase_Services/sql-database.service';
import { MongoDatabaseService } from 'src/app/services/DataBase_Services/MongoDatabase_Services/mongo-database.service';
import { Field, QueryBuilderConfig } from 'ngx-angular-query-builder';
import { catchError, interval, min } from 'rxjs';
import { Observable } from 'rxjs';

import Chart from 'chart.js/auto';
import { QueryBuilderService } from 'src/app/services/QueryBuilder_Services/query-builder.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { KeycloakService } from 'keycloak-angular';
interface Metadata {
  [key: string]: { [key: string]: any[] };
}

@Component({
  selector: 'app-connect-form',
  templateUrl: 'connect-form.component.html',
  styleUrls: ['connect-form.component.css'],
})
export class ConnectFormComponent implements OnInit {
  databaseName = '';
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

  addQueryBuilder(): void {
    this.queryBuilders.push({
      config: this.config,
      query: { condition: 'and', rules: [] },
    });
  }

  removeQueryBuilder(index: number): void {
    this.queryBuilders.splice(index, 1);
    this.convertToChartData();
  }
  queryBuilders: { config: QueryBuilderConfig; query: any }[] = [
    { config: this.config, query: this.query }, // Initial query builder
  ];
  tableNames: string[] = [];
  columnNames: string[] = [];
  constructor(
    private sqlDatabaseService: SqlDatabaseService,
    private mongodbDatabaseService: MongoDatabaseService,
    private queryBuilderService: QueryBuilderService,
    private keycloakService: KeycloakService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const storedUrl = sessionStorage.getItem('url');
    const storedUsername = sessionStorage.getItem('username');
    const storedPassword = sessionStorage.getItem('password');

    if (
      storedUrl !== null ||
      storedUsername !== null ||
      storedPassword !== null
    ) {
      this.onConnect();
    }
    const chartDataString = sessionStorage.getItem('chartData');
    const chartData = chartDataString ? JSON.parse(chartDataString) : null;
    if (chartData !== null) {
      this.createChart(chartData);
    }
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

  logout() {
    this.keycloakService.logout('http://localhost:4200/');
  }
  removeYAxisInput(index: number): void {
    this.destroyChart('myChart');
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

    // Check if values exist in sessionStorage
    const storedUrl = sessionStorage.getItem('url');
    const storedUsername = sessionStorage.getItem('username');
    const storedPassword = sessionStorage.getItem('password');
    const storedDatabaseType = sessionStorage.getItem('selectedDatabaseType');
    const storedDatabaseName = sessionStorage.getItem('databaseName');

    if (
      storedUrl !== null &&
      storedUsername !== null &&
      storedDatabaseType !== null &&
      storedDatabaseName !== null
    ) {
      this.url = storedUrl;
      this.username = storedUsername;
      this.password = storedPassword || '';
      this.databaseName = storedDatabaseName;
      this.selectedDatabaseType = storedDatabaseType as
        | 'mongodb'
        | 'postgresql';
    }

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

        // Store values in sessionStorage
        sessionStorage.setItem('url', this.url);
        sessionStorage.setItem('username', this.username);
        sessionStorage.setItem('password', this.password);
        sessionStorage.setItem(
          'selectedDatabaseType',
          this.selectedDatabaseType
        );
        sessionStorage.setItem('databaseName', this.databaseName);
      },
      (error: { message: string | null }) => {
        console.error('Connect failed!', error);
        this.loading = false;
        this.error = error.message;
      }
    );
  }

  connect(url: string, username: string, password: string): Observable<any> {
    const databaseName = this.databaseName;
    console.log(sessionStorage.getItem('selectedDatabaseType'));
    const storedDatabaseType = sessionStorage.getItem('selectedDatabaseType');
    const selectedDatabaseType =
      storedDatabaseType !== null
        ? storedDatabaseType
        : this.selectedDatabaseType;

    const body = {
      databaseName,
      selectedDatabaseType,
      url,
      username,
      password,
    };
    const urlEndpoint = `${this.baseUrl}/connect`;
    return this.http.post<any>(urlEndpoint, body);
  }
  destroyChart(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }
  }
  disconnect(url: string): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const requestBody = { url };
    this.destroyChart('myChart');
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
  disconnectFromDatabase(url: string) {
    this.disconnect(url).subscribe(
      (response) => {
        window.location.reload();

        console.log('Disconnected successfully:', response);
      },
      (error) => {
        console.error('Error disconnecting from the database:', error);
      }
    );
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

  onQueryChange(index: number) {
    this.convertToChartData();

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
        resolve(variableValues);
      });
    });
  }
  createChart(chartData: any) {
    if (chartData) {
      // Assuming you have access to the canvas and ctx as before
      const canvas = document.getElementById(
        'myChart'
      ) as HTMLCanvasElement | null;
      const ctx = canvas?.getContext('2d');

      if (!canvas || !ctx) {
        console.error('Chart canvas element or context not found.');
        return;
      }

      // Create the chart using the provided chart data
      new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
          // Customize chart options here as needed
          scales: {
            // Your scale configuration here
          },
        },
      });
    } else {
      console.error('Chart data not found.');
    }
  }
  convertToChartData(): void {
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

    const allDatasets: {
      label: string;
      data: { x: any; y: any }[];
      backgroundColor: string;
      beginAtZero: boolean;
    }[] = [];

    // Recursive function to process query builders
    const processQueryBuilder = (index: number) => {
      if (index >= this.queryBuilders.length) {
        if (allDatasets.length > 0) {
          const chartData = {
            labels: labels,
            datasets: allDatasets,
          };

          // Convert the chart data to a JSON string
          const chartDataString = JSON.stringify(chartData);

          sessionStorage.setItem('chartData', chartDataString);

          const allYAverages = allDatasets.map(
            (dataset) =>
              dataset.data.reduce((sum, point) => sum + point.y, 0) /
              dataset.data.length
          );

          const minYValue = Math.min(...allYAverages);
          const maxYValue = Math.max(...allYAverages);

          const yAxesConfig = {
            y: {
              type: 'linear',
              ticks: {
                min: minYValue,
                max: maxYValue,
                beginAtZero: true,
              },
            },
          };

          new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
              scales: yAxesConfig as any,
            },
          });
        }
        return;
      }

      const queryBuilder = this.queryBuilders[index];
      const query = queryBuilder.query;

      let response: Observable<any>;

      if (this.selectedDatabaseType === 'mongodb') {
        const mongoQuery = this.mongodbDatabaseService.convertRuleToMongoQuery(
          query,
          this.tableNames
        );
        response = this.mongodbDatabaseService.executeQuery(
          this.connectionString,
          mongoQuery
        );
      } else if (this.selectedDatabaseType === 'postgresql') {
        const sqlQuery = this.sqlDatabaseService.convertToSQL(
          this.tableNames,
          query
        );

        response = this.sqlDatabaseService.executeSQL(sqlQuery);
      } else {
        console.error(
          'Invalid selectedDatabaseType:',
          this.selectedDatabaseType
        );
        return;
      }

      response.subscribe(
        async (data) => {
          const xAxisColumnNameValues = await this.selectVariableValues(
            response,
            this.xAxisColumnName
          );

          // Calculate minimum and maximum values for y-axis across all datasets
          const allYValues = [];

          for (const yAxisColumnNames of this.yAxisColumnNamesArrays) {
            const yAxisColumnName = yAxisColumnNames[0];
            const yAxisColumnNameValues = await this.selectVariableValues(
              response,
              yAxisColumnName
            );

            allYValues.push(...yAxisColumnNameValues);

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

            allDatasets.push({
              label: yAxisColumnNames.join(', '),
              data: dataPoints,
              backgroundColor: this.getRandomColor(),
              beginAtZero: true,
            });
          }

          // Recursively process the next query builder
          processQueryBuilder(index + 1);
        },
        (error) => {
          console.error('Error executing QUERY:', error);
        }
      );
    };

    processQueryBuilder(0);
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
      this.tableNames.push(tableName);
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
        this.columnNames.push(column);
      });
    }
  }

  private setFieldsForPostgreSQL(metadata: Metadata): void {
    const { fields: queryBuilderConfigFields } = this.config;

    for (const [tableName, table] of Object.entries(metadata)) {
      const columns = this.getTableNames(table);
      this.tableNames.push(tableName);

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
        this.columnNames.push(column);
      });
    }
  }
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

  getTableNames(data: any): string[] {
    return Object.keys(data);
  }

  toggleYAxisColumn(index: number) {
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
