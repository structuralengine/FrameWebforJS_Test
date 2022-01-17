import { Injectable } from "@angular/core";
import { ResultDataService } from "src/app/providers/result-data.service";
import { Router } from "@angular/router";

@Injectable({
  providedIn: "root",
})
export class PrintCustomThreeService {
  public threeEditable: boolean[];

  constructor(private ResultData: ResultDataService) {
    for (let i = 0; i < 6; i++) {
      this.threeEditable = [true, true, true, true, true, true];
    }
  }

  // clear(){
  //   this.contentEditable2 = [];
  // }
}
