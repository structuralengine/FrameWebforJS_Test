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

  public mode:number;

  public selectedIndex :string;

  public inputJson: any;
  public combineJson: any;
  public defineJson: any;
  public pickupJson: any;

  public flg: number = -1;

  public print_target: any; // Three.js 印刷 の図のデータ

  public printOption = [];

  public printRadio: any;

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
      false,
      false
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
      id: "8",
      name: "COMBINE 断面力",
    },
    {
      id: "9",
      name: "PICKUP 断面力",
    },
    {
      id: "10",
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

      false, // 6-PICKUP 反力a
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

      if (this.printOption.length > 0 && 'id' in this.printOption[0]) {
        this.flg = Number(this.printOption[0].id);
        this.selectedIndex = String(this.flg);
      }
    }, 50);
  }

  public selectRadio(id: number) {
    this.printOption = new Array();
    for (let i = 0; i < this.contentEditable1.length; i++) {
      this.contentEditable1[i] = false;
      if (i == id) {
        this.contentEditable1[i] = true;
        this.flg = i;
        this.selectedIndex = String(i);
      }
    }
  }

  
}
