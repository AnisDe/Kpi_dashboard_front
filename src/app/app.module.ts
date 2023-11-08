import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { ConnectFormComponent } from './components/connect-form/connect-form.component';
import { FormsModule } from '@angular/forms';
import { NgxAngularQueryBuilderModule } from 'ngx-angular-query-builder';
import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { ToastrModule } from 'ngx-toastr';
export function Kcfactory(kcService: KeycloakService) {
  return () =>
    kcService
      .init({
        config: {
          url: 'http://localhost:8080',
          realm: 'kpi_dashboard',
          clientId: 'kpi_dashboard',
        },
        initOptions: {
          onLoad: 'login-required',
          checkLoginIframe: false,
        },
      })
      .then((authenticated) => {
        if (authenticated) {
          // Get the Keycloak instance
          const keycloakInstance = kcService.getKeycloakInstance();

          // Check if the Keycloak instance and token are defined
          if (keycloakInstance && keycloakInstance.token) {
            // Store the token in sessionStorage
            sessionStorage.setItem('token', keycloakInstance.token);

            // Check if tokenParsed exists
            if (keycloakInstance.tokenParsed) {
              // Store other user information if needed
              sessionStorage.setItem(
                'logged_username',
                keycloakInstance.tokenParsed['name']
              );
            }
          }
        }
      });
}
@NgModule({
  declarations: [AppComponent, ConnectFormComponent, NavBarComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    NgxAngularQueryBuilderModule,
    KeycloakAngularModule,
    NgbModule,
    BrowserAnimationsModule, // required animations module
    ToastrModule.forRoot(),
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
