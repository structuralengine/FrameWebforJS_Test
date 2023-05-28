import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { ElectronService } from './electron.service';
import { nanoid } from 'nanoid';

const USER_PROFILE = 'userProfile';
const CLIENT_ID = 'clientId';

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
    public electronService: ElectronService,
    private readonly keycloak: KeycloakService,
  ) {
    this.initializeUserProfile();
    if(!window.sessionStorage.getItem(CLIENT_ID)) {
      window.sessionStorage.setItem(CLIENT_ID, nanoid())
    }
  }

  async initializeUserProfile() {
    if (this.electronService.isElectron) {
      const userProfile = window.localStorage.getItem(USER_PROFILE);
      if (userProfile) {
        this.setUserProfile(JSON.parse(userProfile));
      } else {
        this.setUserProfile(null);
      }
    } else {
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
  }

  setUserProfile(userProfile: UserProfile | null) {
    this.userProfile = userProfile;
    window.localStorage.setItem(USER_PROFILE, JSON.stringify(userProfile));
  }
}
