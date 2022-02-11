import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class PrintCustomDisgService {
  public disgEditable: boolean[];
  constructor() {
    this.disgEditable = [
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
    ];
  }
}
