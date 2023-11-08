import { Component, OnInit } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-nav-bar',
  templateUrl: 'nav-bar.component.html',
  styleUrls: ['nav-bar.component.css'],
})
export class NavBarComponent implements OnInit {
  username = '';

  constructor(private keycloakService: KeycloakService) {}
  getUserAttributes() {
    if (this.keycloakService) {
      const userName =
        this.keycloakService.getKeycloakInstance().tokenParsed?.['name'];

      if (userName) {
        const details = {
          userName: userName,
        };
        this.username = userName;
      }
    }
  }

  ngOnInit(): void {
    this.getUserAttributes();
  }

  logout() {
    this.keycloakService.logout('http://localhost:4200/');
    sessionStorage.clear();
  }
}
