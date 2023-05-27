import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';

interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
}
 
@Injectable({
  providedIn: 'root'
})
export class UserInfoService {
  public deduct_points: number = 0;
  public new_points: number = 0;
  public old_points: number = 0;
  public userProfile: UserProfile | null = null;

  constructor(
    private readonly keycloak: KeycloakService
  ) {
    this.initializeUserProfile();
    if(!window.sessionStorage.getItem("client_id")) {
      window.sessionStorage.setItem("client_id", Math.random().toString())
    }
  }

  async initializeUserProfile() {
    const isLoggedIn = await this.keycloak.isLoggedIn();
    if (isLoggedIn) {
      const keycloakProfile = await this.keycloak.loadUserProfile();
      this.setUserProfile({
        uid: keycloakProfile.id,
        email: keycloakProfile.email,
        firstName: keycloakProfile.firstName,
        lastName: keycloakProfile.lastName,
      });
    } else {
      this.setUserProfile(null);
    }
  }

  setUserProfile(userProfile: UserProfile | null) {
    this.userProfile = userProfile;
    window.localStorage.setItem('userProfile', JSON.stringify(userProfile));
  }
}
