import { Directionality } from "@angular/cdk/bidi";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { DataHelperModule } from "src/app/providers/data-helper.module";
import { InputDataService } from "src/app/providers/input-data.service";
import { ResultDataService } from "src/app/providers/result-data.service";
import { PrintCustomFsecService } from "./custom/print-custom-fsec/print-custom-fsec.service";
import { PrintCustomThreeService } from "./custom/print-custom-three/print-custom-three.service";

@Injectable({
  providedIn: "root",
})
export class PrintService {
  public isPrinting = false;
  public contentEditable1: boolean[];

  public mode: number;

  public selectedIndex: string;

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
    private ResultData: ResultDataService,
    private customFsec: PrintCustomFsecService,
    private customThree: PrintCustomThreeService,
    private helper: DataHelperModule
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
      false,
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

      if (this.printOption.length > 0 && "id" in this.printOption[0]) {
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

  public getPrintDatas() {
    // データを取得
    let json = {};
    if (
      this.contentEditable1[0] &&
      Object.keys(this.InputData.getInputJson(1)).length !== 0
    ) {
      json = this.InputData.getInputJson(1);
    }
    if (this.ResultData.isCalculated == true) {
      if (
        this.contentEditable1[1] &&
        Object.keys(this.ResultData.disg.disg).length !== 0
      ) {
        json["disg"] = this.ResultData.disg.disg;
        json["disgName"] = this.getNames(json["disg"]);
      }
      if (
        this.contentEditable1[2] &&
        Object.keys(this.ResultData.combdisg.disgCombine).length !== 0
      ) {
        json["disgCombine"] = this.ResultData.combdisg.disgCombine;
        json["disgCombineName"] = this.getNames(json["disgCombine"], "Combine");
      }
      if (
        this.contentEditable1[3] &&
        Object.keys(this.ResultData.pickdisg.disgPickup).length !== 0
      ) {
        json["disgPickup"] = this.ResultData.pickdisg.disgPickup;
        json["disgPickupName"] = this.getNames(json["disgPickup"], "Pickup");
      }
      if (
        this.contentEditable1[7] &&
        Object.keys(this.ResultData.fsec.fsec).length !== 0
      ) {
        json["fsec"] = this.dataChoice(this.ResultData.fsec.fsec);
        json["fsecName"] = this.getNames(json["fsec"]);
      }
      if (
        this.contentEditable1[8] &&
        Object.keys(this.ResultData.combfsec.fsecCombine).length !== 0
      ) {
        json["fsecCombine"] = this.dataChoice(
          this.ResultData.combfsec.fsecCombine
        );
        json["fsecCombineName"] = this.getNames(json["fsecCombine"], "Combine");
      }
      if (
        this.contentEditable1[9] &&
        Object.keys(this.ResultData.pickfsec.fsecPickup).length !== 0
      ) {
        json["fsecPickup"] = this.dataChoice(
          this.ResultData.pickfsec.fsecPickup
        );
        json["fsecPickupName"] = this.getNames(json["fsecPickup"], "Pickup");
      }
      if (
        this.contentEditable1[4] &&
        Object.keys(this.ResultData.reac.reac).length !== 0
      ) {
        json["reac"] = this.ResultData.reac.reac;
        json["reacName"] = this.getNames(json["reac"]);
      }
      if (
        this.contentEditable1[5] &&
        Object.keys(this.ResultData.combreac.reacCombine).length !== 0
      ) {
        json["reacCombine"] = this.ResultData.combreac.reacCombine;
        json["reacCombineName"] = this.getNames(json["reacCombine"], "Combine");
      }
      if (
        this.contentEditable1[6] &&
        Object.keys(this.ResultData.pickreac.reacPickup).length !== 0
      ) {
        json["reacPickup"] = this.ResultData.pickreac.reacPickup;
        json["reacPickupName"] = this.getNames(
          json["reacPickupName"],
          "Pickup"
        );
      }
    }

    if (Object.keys(json).length === 0) {
      alert("データが存在しないため，印刷できませんでした．");
      return;
    }

    json["dimension"] = this.helper.dimension;

    return json;
  }

  private getNames(json, target = "") {
    const keys: string[] = Object.keys(json);
    this.getNamesAll(target);

    var name = new Array();
    for (const index of keys) {
      let loadName = "";
      switch (target) {
        case "Combime":
          if (index in this.combineJson) {
            if ("name" in this.combineJson[index]) {
              loadName = this.combineJson[index].name;
            }
          }
          break;
        case "Pickup":
          if (index in this.pickupJson) {
            if ("name" in this.pickupJson[index]) {
              loadName = this.pickupJson[index].name;
            }
          }
          break;
        default:
          let l: any = this.InputData.load.getLoadNameJson(null, index);
          if (index in l) {
            loadName = l[index].name;
          }
          break;
      }
      var tmp = new Array();
      tmp.push("Case." + index, loadName);
      name.push(tmp);
    }
    return name;
  }

  private getNamesAll(target) {
    switch (target) {
      case "Combine":
        this.combineJson = this.InputData.combine.getCombineJson();
        break;
      case "Pickup":
        this.pickupJson = this.InputData.pickup.getPickUpJson();
        break;
    }
  }

  private dataChoice(json) {
    const choiceMember = this.customFsec.dataset;
    const axis = this.customFsec.fsecEditable;
    let basic: boolean = true;
    let split = {};
    for (const type of Object.keys(json)) {
      let kk = 0;
      let body1 = new Array();
      let body2 = {};

      let i = 0;
      for (const list of Object.keys(json[type])) {
        if (isFinite(Number(Object.keys(json[type])[0]))) {
          const item = json[type][list];
          kk = item.m === "" ? kk : Number(item.m) - 1;
          if (choiceMember[kk].check === true) {
            body1.push(item);
          }
        } else {
          let axisArr = new Array();
          if (axis[i] === true) {
            for (const ax of Object.keys(json[type][list])) {
              basic = false;
              const item = json[type][list][ax];
              kk = item.m === "" ? kk : Number(item.m) - 1;
              if (choiceMember[kk].check === true) {
                axisArr.push(item);
              }
            }
            body2[list] = axisArr;
          }
          i++;
        }
      }
      split[type] = basic ? body1 : body2;
    }
    return split;
  }
}
