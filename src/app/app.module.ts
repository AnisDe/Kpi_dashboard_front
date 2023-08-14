import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { ConnectFormComponent } from './components/connect-form/connect-form.component';
import { FormsModule } from '@angular/forms';
import { NgxAngularQueryBuilderModule } from 'ngx-angular-query-builder';
import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular';

export function Kcfactory(kcService: KeycloakService) {
  return () =>
    kcService.init({
      config: {
        url: 'http://localhost:8080',
        realm: 'kpi_dashboard',
        clientId: 'kpi_dashboard',
      },
      initOptions: {
        onLoad: 'login-required',
        checkLoginIframe: false,
      },
    });
}
@NgModule({
  declarations: [AppComponent, ConnectFormComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    NgxAngularQueryBuilderModule,
    KeycloakAngularModule,
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      deps: [KeycloakService],
      useFactory: Kcfactory,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
