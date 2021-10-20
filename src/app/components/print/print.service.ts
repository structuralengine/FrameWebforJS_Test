import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { InputDataService } from "src/app/providers/input-data.service";
import { ResultDataService } from "src/app/providers/result-data.service";

@Injectable({
  providedIn: "root",
})
export class PrintService {
  public isPrinting = false;
  public contentEditable1: boolean[];

  public selectedIndex = "1";

  public inputJson: any;
  public combineJson: any;
  public defineJson: any;
  public pickupJson: any;

  public flg: number;

  public print_target: any; // Three.js 印刷 の図のデータ

  public printOption = [{ id: "0", name: "入力データ" }];

  constructor(
    private router: Router,
    public InputData: InputDataService,
    private ResultData: ResultDataService
  ) {
    this.contentEditable1 = [
      false, // 0-入力データ
      false, // 1-変位量
      false, // 2-COMBINE 変位量
      false, // 3-PICKUP 変位量
      false, // 4-反力
      false, // 5-COMBINE 反力
      false, // 6-PICKUP 反力
      false, // 7-断面力
      false, // 8-COMBINE 断面力
      false, // 9-PICKUP 断面力
      false, // 10-Three.js 印刷
    ];
  }

  public optionList: any[] = [
    { id: "0", name: "入力データ" },
    {
      id: "1",
      name: "変位量",
    },
    { id: "2", name: "COMBINE 変位量" },
    {
      id: "3",
      name: "PICKUP　変位量",
    },
    {
      id: "4",
      name: "反力",
    },
    {
      id: "5",
      name: "COMBINE 反力",
    },
    {
      id: "6",
      name: "PICKUP　反力",
    },
    {
      id: "7",
      name: "断面力",
    },
    {
      id: "8",
      name: "COMBINE　断面力",
    },
    {
      id: "9",
      name: "PICKUP　断面力",
    },
    {
      id: "10",
      name: "画面印刷",
    },
  ];

  public setprintDocument() {
    // 入力データを取得する
    this.inputJson = this.InputData.getInputJson(1);
    this.combineJson = this.ResultData.getCombineJson();
    this.defineJson = this.ResultData.getDefineJson();
    this.pickupJson = this.ResultData.getPickUpJson();
  }

  public printDocument(documentName: string, documentData: string[]) {
    this.isPrinting = true;
    this.router.navigate([
      "/",
      {
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

  public select() {
    // const option = this.optionList;
    // const id = this.contentEditable1;
    let n = 0;
    this.printOption = new Array();
    setTimeout(() => {
      for (let i = 0; i < this.contentEditable1.length; i++) {
        if (this.contentEditable1[i] === true) {
          this.printOption[n] = this.optionList[String(i)];
          n += 1;
        }
      }
      this.flg = Number(this.printOption[n - 1].id);
      console.timeLog("S");
    }, 50);
  }
}
