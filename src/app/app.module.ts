import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { ConnectFormComponent } from './connect-form/connect-form.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [AppComponent, ConnectFormComponent],
  imports: [BrowserModule, HttpClientModule, FormsModule],
  providers: [],

  bootstrap: [AppComponent],
})
export class AppModule {}
