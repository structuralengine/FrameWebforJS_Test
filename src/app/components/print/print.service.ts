import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { InputDataService } from "src/app/providers/input-data.service";

@Injectable({
  providedIn: "root",
})
export class PrintService {
  
  public isPrinting = false;
  public contentEditable1: boolean[];

  public inputJson: any;
  public combineJson: any;
  public defineJson: any;
  public pickupJson: any;

  public imgList: any[]; // Three.js 印刷 の図のデータ

  constructor(private router: Router,
              public InputData: InputDataService,) {
    this.contentEditable1 = [
      false,  // 0-入力データ
      false,  // 1-変位量
      false,  // 2-COMBINE 変位量
      false,  // 3-PICKUP 変位量
      false,  // 4-反力
      false,  // 5-COMBINE 反力
      false,  // 6-PICKUP 反力
      false,  // 7-断面力
      false,  // 8-COMBINE 断面力
      false,  // 9-PICKUP 断面力
      false   // 10-Three.js 印刷
    ];
  }

  public setprintDocument() {
    // 入力データを取得する
    this.inputJson = this.InputData.getInputJson(0);
    this.combineJson = this.InputData.combine.getCombineJson();
    this.defineJson = this.InputData.define.getDefineJson();
    this.pickupJson = this.InputData.pickup.getPickUpJson();
  }

  public printDocument(documentName: string, documentData: string[]) {
    this.isPrinting = true;
    this.router.navigate(["/", {
        outlets: {
          print: ["print", documentName, documentData.join()],
        },
      },
    ]);
  }

  public onDataReady() {
    setTimeout(() => {
      window.print();
      this.isPrinting = false;
      this.router.navigate([{ outlets: { print: null } }]);
    });
  }
}
