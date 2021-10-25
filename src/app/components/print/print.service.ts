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

  public printOption = [];

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
    ];

    this.printOption = new Array();
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
      id: "7",
      name: "断面力",
    },
    {
      id: "7",
      name: "断面力",
    },
    {
      id: "8",
      name: "画面印刷",
    },
  ];

  public fescIndex = [
    "axialForce",
    "shearForceY",
    "shearForceZ",
    "torsionalMoment",
    "momentY",
    "momentZ",
  ];

  public fescIndexJa = [
    "軸方向力",
    "y軸方向のせん断力",
    "z軸方向のせん断力",
    "ねじりモーメント",
    "y軸方向のモーメント",
    "z軸方向のモーメント",
  ];

  public clear() {
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
      false,
      false,
    ];
  }

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
    this.flg = -1;
    setTimeout(() => {
      for (let i = 0; i < this.contentEditable1.length; i++) {
        if (
          this.contentEditable1[i] === true &&
          (i == 7 || i === 8 || i === 9 || i === 10)
        ) {
          this.printOption[n] = this.optionList[String(i)];
          n += 1;
        }
      }

      this.printOption = this.printOption.filter(
        (element, index, self) =>
          self.findIndex((e) => e.id === element.id) === index
      );

      this.flg = Number(this.printOption[0].id);
      this.selectedIndex = String(this.flg);
    }, 50);
  }
}
