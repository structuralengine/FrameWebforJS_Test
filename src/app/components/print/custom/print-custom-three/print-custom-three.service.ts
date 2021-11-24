import { Injectable } from "@angular/core";
import { ResultDataService } from "src/app/providers/result-data.service";
import { Router } from "@angular/router";

@Injectable({
  providedIn: "root",
})
export class PrintCustomThreeService {
  public contentEditable2: boolean[];

  constructor(private ResultData: ResultDataService) {
    this.contentEditable2 = [
      false, // 0-軸方向力
      false, // 1-y軸方向のせん断力
      false, // 2-z軸方向のせん断力
      false, // 3-ねじりモーメント
      false, // 4-y軸回りのモーメント
      false, // 5-z軸周りのモーメント
    ];
  }

  // clear(){
  //   this.contentEditable2 = [];
  // }
}
