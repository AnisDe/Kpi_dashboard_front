import { Component, OnInit } from '@angular/core';
import { SqlDatabaseService } from '../../services/DataBase_Services/SqlDatabase_Services/sql-database.service';
import { MongoDatabaseService } from 'src/app/services/DataBase_Services/MongoDatabase_Services/mongo-database.service';
import { Field, QueryBuilderConfig } from 'ngx-angular-query-builder';
import { Observable, interval } from 'rxjs';

import Chart from 'chart.js/auto';
import { QueryBuilderService } from 'src/app/services/QueryBuilder_Services/query-builder.service';
import { HttpClient } from '@angular/common/http';
import { ChartService } from 'src/app/services/Chart_services/chart.service';
import { Metadata } from 'src/app/shared/interfaces';
import { SharedDatabasesService } from 'src/app/services/DataBase_Services/SharedDatabases_Services/shared-databases.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-connect-form',
  templateUrl: 'connect-form.component.html',
  styleUrls: ['connect-form.component.css'],
})
export class ConnectFormComponent implements OnInit {
  selectedDatabaseType: 'mongodb' | 'postgresql' | '' = '';
  databaseName = '';
  url = '';
  username = '';
  password = '';
  connectionString = '';
  databaseService: any;

  loading = false;
  result: Metadata | null = null;
  error: string | null = null;
  xAxisColumnName: string = '';
  yAxisColumnName: string = '';
  queryName: string = '';
  filteredData: any[] = [];
  isPieButtonActivated = false;
  isLineButtonActivated = true;
  yAxisColumnNamesArrays: string[][] = [[]];
  private baseUrl = 'http://localhost:9090/tables';
  queryBuilderConfig!: QueryBuilderConfig;
  query: any = {
    condition: 'and',
    rules: [],
  };

  config: QueryBuilderConfig = {
    fields: {},
  };
  databases: any;

  addQueryBuilder(): void {
    this.queryBuilders.push({
      config: this.config,
      query: { condition: 'and', rules: [] },
    });
  }

  removeQueryBuilder(index: number): void {
    this.queryBuilders.splice(index, 1);
  }

  queryBuilders: { config: QueryBuilderConfig; query: any }[] = [];
  tableNames: string[] = [];
  columnNames: string[] = [];
  constructor(
    private sqlDatabaseService: SqlDatabaseService,
    private mongodbDatabaseService: MongoDatabaseService,
    private queryBuilderService: QueryBuilderService,
    private chartService: ChartService,
    private sharedDatabasesService: SharedDatabasesService,
    private http: HttpClient,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.filteredData = [];
    const storedToken = sessionStorage.getItem('token');
    const storedDbUrl = sessionStorage.getItem('url');
    const storedDbUsername = sessionStorage.getItem('username');
    const storedDbPassword = sessionStorage.getItem('password');
    console.log(sessionStorage.getItem('logged_username'));

    if (storedToken) {
      const tokenUsername = this.extractUsernameFromKeycloakToken(storedToken);
      const storedLogedUsername = sessionStorage.getItem('logged_username');
      if (tokenUsername === storedLogedUsername) {
        // Token is valid, and it belongs to the same user
        this.sharedDatabasesService.getDataBases().subscribe((data) => {
          this.databases = data;
        });
        if (
          storedDbUrl !== null ||
          storedDbUsername !== null ||
          storedDbPassword !== null
        ) {
          this.onConnect();
          this.filteredData = [];
        }
      }
    }

    this.queryBuilderConfig = {
      fields: {},
    };
  }

  addYAxisInput(): void {
    this.yAxisColumnNamesArrays.push(['']);
  }

  removeYAxisInput(index: number): void {
    this.chartService.destroyChart('myChart');
    this.yAxisColumnNamesArrays.splice(index, 1);
  }

  updateYAxisArray(selectedValue: string, index: number): void {
    this.yAxisColumnNamesArrays[index][0] = selectedValue;
  }
  extractUsernameFromKeycloakToken(token: string): string | null {
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      return tokenPayload.name;
    } catch (error) {
      console.error('Error extracting username from token:', error);
      return null;
    }
  }

  onConnect(): void {
    this.loading = true;
    this.result = null;
    this.error = null;
    this.filteredData = [];
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

    if (!this.url || !this.username || this.selectedDatabaseType == '') {
      this.loading = false;
      // this.error = 'URL and Username are required fields.';
      this.toastr.error('All fields are required.', 'Error', {
        positionClass: 'toast-top-center',
      });
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
        this.refreshQuerys();
        // interval(10000).subscribe(() => {
        //   this.refreshData();
        // });
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
    sessionStorage.setItem('selectedDatabaseType', this.selectedDatabaseType);
    const selectedDatabaseType = this.selectedDatabaseType;

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

  refreshQuerys() {
    this.sharedDatabasesService.getFilteredData().subscribe((data) => {
      console.log(data);
      this.filteredData = data;
    });
  }

  disconnectFromDatabase(url: string) {
    this.sharedDatabasesService.disconnect(url).subscribe(
      (response) => {
        window.location.reload();

        console.log('Disconnected successfully:', response);
      },
      (error) => {
        console.error('Error disconnecting from the database:', error);
      }
    );
    this.filteredData = [];
  }

  refreshData(): void {
    if (!this.url || !this.username) {
      return;
    }
    this.connect(this.url, this.username, this.password).subscribe(
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

  onQueryChange(index: number) {}

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

  initializeChartCanvas(): HTMLCanvasElement | null {
    const canvas = document.getElementById(
      'myChart'
    ) as HTMLCanvasElement | null;
    if (!canvas) {
      console.error('Chart canvas element not found.');
      return null;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get 2D context for chart canvas.');
      return null;
    }

    const existingChart = Chart.getChart(canvas);
    if (existingChart) {
      existingChart.destroy();
    }

    return canvas;
  }

  //////// PIE CHART WORK
  convertDataToPieChart(): void {
    const canvas = this.initializeChartCanvas();
    if (!canvas) {
      return;
    }

    const labels: string[] = [];
    const dataPoints: number[] = [];
    const queryBuilders: any[] = [];

    let completedQueries = 0;
    let sqlQuery: string; // Declare sqlQuery here
    let mongoQuery: string; // Declare mongoQuery here

    const processQueryBuilders = (index: number) => {
      if (index >= this.queryBuilders.length) {
        this.chartService.createPieChart(canvas, labels, dataPoints);

        if (completedQueries === this.queryBuilders.length) {
          if (this.selectedDatabaseType === 'mongodb') {
            this.mongodbDatabaseService.saveQuery(
              this.connectionString,
              JSON.stringify(queryBuilders),
              this.queryName
            );
          } else if (this.selectedDatabaseType === 'postgresql') {
            this.sqlDatabaseService.saveQuery(
              this.queryName,
              sqlQuery,
              JSON.stringify(queryBuilders)
            );
          } else {
            console.error(
              'Invalid selectedDatabaseType:',
              this.selectedDatabaseType
            );
            return;
          }
        }
        return;
      }

      const queryBuilder = this.queryBuilders[index];
      queryBuilders.push(queryBuilder.query);
      const query = queryBuilder.query;
      let response: Observable<any>;

      if (this.selectedDatabaseType === 'mongodb') {
        mongoQuery = this.mongodbDatabaseService.convertRuleToMongoQuery(
          query,
          this.tableNames
        );
        response = this.mongodbDatabaseService.executeSQL(
          this.connectionString,
          mongoQuery,
          this.queryName
        );
      } else if (this.selectedDatabaseType === 'postgresql') {
        sqlQuery = this.sqlDatabaseService.convertToSQL(this.tableNames, query);
        response = this.sqlDatabaseService.executeSQL(
          this.queryName,
          sqlQuery,
          JSON.stringify(queryBuilders)
        );
      } else {
        console.error(
          'Invalid selectedDatabaseType:',
          this.selectedDatabaseType
        );
        return;
      }

      response.subscribe(
        async (data) => {
          const yAxisColumnName = this.yAxisColumnNamesArrays[0][0];
          const yAxisColumnNameValues = await this.selectVariableValues(
            response,
            yAxisColumnName
          );

          const maxValue = Math.max(...yAxisColumnNameValues);

          labels.push(yAxisColumnName);
          dataPoints.push(maxValue);

          completedQueries++;

          processQueryBuilders(index + 1);
        },
        (error) => {
          console.error('Error executing QUERY:', error);
        }
      );
    };

    processQueryBuilders(0);
  }
  convertDataToChart() {
    if (this.isPieButtonActivated) {
      this.convertDataToPieChart();
    } else if (this.isLineButtonActivated) {
      this.convertDataToLineChart();
    }
  }
  convertDataToLineChart(): void {
    const canvas = this.initializeChartCanvas();
    if (!canvas) {
      return;
    }

    const labels = Array.from([], () => '');
    let completedQueries = 0;

    let sqlQuery: string; // Declare sqlQuery here
    let mongoQuery: string;
    const allDatasets: {
      label: string;
      data: { x: any; y: any }[];
      backgroundColor: string;
      borderColor: string;
      beginAtZero: boolean;
    }[] = [];

    const queryBuilders: any[] = []; // Create an array to store query builders

    const processQueryBuilder = (index: number) => {
      if (index >= this.queryBuilders.length) {
        this.chartService.processChart(
          allDatasets,
          labels,
          canvas.getContext('2d')
        );
        if (completedQueries === this.queryBuilders.length) {
          if (this.selectedDatabaseType === 'mongodb') {
            this.mongodbDatabaseService.saveQuery(
              this.connectionString,
              JSON.stringify(queryBuilders),
              this.queryName
            );
          } else if (this.selectedDatabaseType === 'postgresql') {
            this.sqlDatabaseService.saveQuery(
              this.queryName,
              sqlQuery,
              JSON.stringify(queryBuilders)
            );
          } else {
            console.error(
              'Invalid selectedDatabaseType:',
              this.selectedDatabaseType
            );
            return;
          }
        }
        return;
      }

      const queryBuilder = this.queryBuilders[index];
      queryBuilders.push(queryBuilder.query);
      const query = queryBuilder.query;
      let response: Observable<any>;

      if (this.selectedDatabaseType === 'mongodb') {
        mongoQuery = this.mongodbDatabaseService.convertRuleToMongoQuery(
          query,
          this.tableNames
        );
        console.log(this.queryName);

        response = this.mongodbDatabaseService.executeSQL(
          this.connectionString,
          mongoQuery,
          this.queryName
        );
      } else if (this.selectedDatabaseType === 'postgresql') {
        sqlQuery = this.sqlDatabaseService.convertToSQL(this.tableNames, query);
        response = this.sqlDatabaseService.executeSQL(
          this.queryName,
          sqlQuery,
          JSON.stringify(queryBuilders)
        );
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

          const allYValues = [];
          const color = this.chartService.getRandomColor(); // Generate a single color

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
              backgroundColor: color, // Use the same color for background
              borderColor: color, // Use the same color for border
              beginAtZero: true,
            });
          }
          completedQueries++;

          processQueryBuilder(index + 1);
        },
        (error) => {
          console.error('Error executing QUERY:', error);
        }
      );
    };

    processQueryBuilder(0);
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

  createQueryBuildersFromQueries(
    queries: any[] | string,
    queryName: string
  ): void {
    console.log(queries);
    const queryArray =
      typeof queries === 'string' ? JSON.parse(queries) : queries;

    if (!Array.isArray(queryArray)) {
      // Handle the case where the input is not an array
      throw new Error(
        'Input must be an array or a valid JSON string representing an array.'
      );
    }

    const uniqueQueries = new Set<any>();
    // Filter out duplicate queries
    queryArray.forEach((query) => {
      const queryStr = JSON.stringify(query);
      uniqueQueries.add(queryStr);
    });

    // Convert the unique queries back to an array
    const uniqueQueriesArray = Array.from(uniqueQueries);

    const queryBuilders = uniqueQueriesArray.map((queryStr) => {
      const query = JSON.parse(queryStr);
      return {
        config: this.config,
        query: query,
      };
    });
    this.queryName = queryName;
    this.queryBuilders = queryBuilders;
  }

  setFieldsForMongoDB(metadata: Metadata): void {
    const { fields: queryBuilderConfigFields } = this.config;

    for (const [tableName, table] of Object.entries(metadata)) {
      const columns = this.getTableNames(table);
      this.tableNames.push(tableName);
      columns.forEach((column: string) => {
        const columnData = table[column];
        const columnType =
          this.sharedDatabasesService.getColumnType(columnData);
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

  setFieldsForPostgreSQL(metadata: Metadata): void {
    const { fields: queryBuilderConfigFields } = this.config;

    for (const [tableName, table] of Object.entries(metadata)) {
      const columns = this.getTableNames(table);
      this.tableNames.push(tableName);

      columns.forEach((column: string) => {
        const columnData = table[column];
        const columnType =
          this.sharedDatabasesService.getColumnType(columnData);
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

  getTableNames(data: any): string[] {
    return Object.keys(data);
  }

  getColumnNamesOfTypeNumber(metadata: Metadata): string[] {
    const numberColumnNames: string[] = [];

    for (const [, table] of Object.entries(metadata)) {
      const columns = this.getTableNames(table);
      columns.forEach((column: string) => {
        const columnData = table[column];
        const columnType =
          this.sharedDatabasesService.getColumnType(columnData);

        const isNumberColumn =
          (this.selectedDatabaseType === 'mongodb' &&
            this.databaseService.getCollectionTypeValue(columnType) ===
              'number') ||
          (this.selectedDatabaseType === 'postgresql' &&
            this.databaseService.mapPostgresTypeToQueryBuilderType(
              columnType
            ) === 'number');

        if (isNumberColumn) {
          numberColumnNames.push(column);
        }
      });
    }

    return numberColumnNames;
  }

  getColumnValues(columnType: any): any[] {
    let values: any[] = [];

    if (Array.isArray(columnType)) {
      values = columnType.length > 0 ? columnType.slice(1) : [];
    } else if (columnType && typeof columnType === 'object') {
      if (columnType.hasOwnProperty('columnValues')) {
        values = columnType.columnValues;
      } else if (columnType.hasOwnProperty('fieldValues')) {
        values = columnType.fieldValues;
      }
    }
    // Remove duplicates by using a Set
    return [...new Set(values)];
  }
  fillConnectionForm(database: any) {
    this.selectedDatabaseType = database.type;
    this.databaseName = database.databaseName;
    this.url = database.url;
  }

  executeQueryBuilder() {
    if (this.yAxisColumnNamesArrays[0].length === 0) {
      this.toastr.error('Error: Select Y Axe and X Axe', 'Error', {
        positionClass: 'toast-top-center',
      });
    }
    this.convertDataToChart();
  }
  toggleButtonActivation(buttonNumber: number) {
    const canvas = document.getElementById('myChart') as HTMLCanvasElement;
    const existingChart = Chart.getChart(canvas);

    if (buttonNumber === 1) {
      this.isPieButtonActivated = !this.isPieButtonActivated;
      this.isLineButtonActivated = false;
    } else if (buttonNumber === 2) {
      this.isLineButtonActivated = !this.isLineButtonActivated;
      this.isPieButtonActivated = false;
    }

    if (existingChart) {
      this.convertDataToChart();
    }
  }
}
