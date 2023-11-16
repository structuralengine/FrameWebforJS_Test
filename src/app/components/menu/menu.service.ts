import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class MenuService {
  public fileName = "";
  constructor(
  ) {
    this.fileName = '';
  }
}
