import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
@Injectable({
  providedIn: 'root'
})
export class UserInfoService {
  public deduct_points: number = 0;
  public new_points: number = 0;
  public old_points: number = 0;
  public userProfile: KeycloakProfile | null = null;

  constructor(
    private readonly keycloak: KeycloakService
  ) {
    this.setUesrProfile();
    if(!window.sessionStorage.getItem("client_id")) {
      window.sessionStorage.setItem("client_id", Math.random().toString())
    }
  }

  async setUesrProfile() {
    const isLoggedIn = await this.keycloak.isLoggedIn();
    if (isLoggedIn) {
      this.userProfile = await this.keycloak.loadUserProfile();
    } else {
      this.userProfile = null;
    }
    
    console.log("profile updated: ", this.userProfile);
  }
}
