import { Injectable } from "@angular/core";
import { PrintComponent } from "../print.component";

@Injectable({
  providedIn: "root",
})
export class PrintCustomService {
  constructor(public print: PrintComponent) {}

  public select(id) {
    let i = id;
  }
}
