import { Component } from '@angular/core';
import { DatabaseService } from '../database.service';

@Component({
  selector: 'app-connect-form',
  templateUrl: 'connect-form.component.html',
})
export class ConnectFormComponent {
  url = '';
  username = '';
  password = '';
  loading = false;
  result: { [key: string]: { [key: string]: any[] } } | null = null;
  error: string | null = null;

  constructor(private databaseService: DatabaseService) {}

  onConnect() {
    this.loading = true;
    this.result = null;
    this.error = null;

    this.databaseService
      .connect(this.url, this.username, this.password)
      .subscribe(
        (data) => {
          console.log('Connect successful!', data);
          this.loading = false;
          this.result = data;
        },
        (error) => {
          console.error('Connect failed!', error);
          this.loading = false;
          this.error = error.message;
        }
      );
  }
  getColumnNames(table: any): string[] {
    return Object.keys(table);
  }

  getTableRows(table: any): any[] {
    const columnNames = this.getColumnNames(table);
    const rowCount = columnNames.length > 0 ? table[columnNames[0]].length : 0;
    const rows = [];
    for (let i = 0; i < rowCount; i++) {
      const row = [];
      for (const columnName of columnNames) {
        row.push(table[columnName][i]);
      }
      rows.push(row);
    }
    return rows;
    console.log(rows);
  }
}
