import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class PrintCustomReacService {
  public reacEditable: boolean[];
  constructor() {
    this.reacEditable = [
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ];
  }
}
