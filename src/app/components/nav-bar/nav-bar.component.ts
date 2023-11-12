import { Component, OnInit } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-nav-bar',
  templateUrl: 'nav-bar.component.html',
  styleUrls: ['nav-bar.component.css'],
})
export class NavBarComponent implements OnInit {
  username = '';
  firstName = '';
  lastName = '';
  constructor(private keycloakService: KeycloakService) {}
  getUserAttributes() {
    if (this.keycloakService) {
      this.username =
        this.keycloakService.getKeycloakInstance().tokenParsed?.['name'];
      this.firstName =
        this.keycloakService.getKeycloakInstance().tokenParsed?.['given_name'];
      this.lastName =
        this.keycloakService.getKeycloakInstance().tokenParsed?.['family_name'];
    }
    console.log(this.username, this.firstName, this.lastName);
  }

  ngOnInit(): void {
    this.getUserAttributes();
  }

  logout() {
    this.keycloakService.logout('http://localhost:4200/');
    sessionStorage.clear();
  }
}
