import { Directionality } from "@angular/cdk/bidi";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { DataHelperModule } from "src/app/providers/data-helper.module";
import { InputDataService } from "src/app/providers/input-data.service";
import { ResultDataService } from "src/app/providers/result-data.service";
import { PrintCustomDisgService } from "./custom/print-custom-disg/print-custom-disg.service";
import { PrintCustomFsecService } from "./custom/print-custom-fsec/print-custom-fsec.service";
import { PrintCustomReacService } from "./custom/print-custom-reac/print-custom-reac.service";
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
  public json = {};
  public priCount: number = 0;
  public pageCount: number = 0;
  public pageOver: boolean = false;
  public pageDisplay: boolean = true;
  public pageError: boolean = false;

  constructor(
    private router: Router,
    public InputData: InputDataService,
    private ResultData: ResultDataService,
    private customFsec: PrintCustomFsecService,
    private customReac: PrintCustomReacService,
    private customDisg: PrintCustomDisgService,
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
    for (let j = 0; j < 12; j++) {
      this.customDisg.disgEditable[j] = true;
      this.customFsec.fsecEditable[j] = true;
      this.customReac.reacEditable[j] = true;
    }
    this.priCount = 0;
    this.customFsec.checkReverse();
    this.newPrintJson();
  }

  public newPrintJson() {
    setTimeout(() => {
      this.priCount = 0;
      if (!(this.contentEditable1[10] === true)) this.getPrintDatas();
      this.pageCount = Math.ceil((Math.ceil(this.priCount / 69) * 2) / 50) * 50;
      this.pageOver = this.pageCount > 1500 ? true : false;

      if (
        this.pageCount > 50 &&
        !(this.contentEditable1[0] == true || this.contentEditable1[13] == true)
      ) {
        this.pageDisplay = true;
      } else {
        this.pageDisplay = false;
      }
    }, 50);
  }

  public getPrintDatas() {
    // データを取得
    this.json = {};
    if (
      this.contentEditable1[0] &&
      Object.keys(this.InputData.getInputJson(1)).length !== 0
    ) {
      this.json = this.InputData.getInputJson(1);
    }
    if (this.ResultData.isCalculated == true) {
      if (
        this.contentEditable1[1] &&
        Object.keys(this.ResultData.disg.disg).length !== 0
      ) {
        this.json["disg"] = this.dataChoice(this.ResultData.disg.disg);
        this.json["disgName"] = this.getNames(this.json["disg"]);
      }
      if (
        this.contentEditable1[2] &&
        Object.keys(this.ResultData.combdisg.disgCombine).length !== 0
      ) {
        this.json["disgCombine"] = this.dataChoice(
          this.ResultData.combdisg.disgCombine
        );
        this.json["disgCombineName"] = this.getNames(
          this.json["disgCombine"],
          "Combine"
        );
      }
      if (
        this.contentEditable1[3] &&
        Object.keys(this.ResultData.pickdisg.disgPickup).length !== 0
      ) {
        this.json["disgPickup"] = this.dataChoice(
          this.ResultData.pickdisg.disgPickup
        );
        this.json["disgPickupName"] = this.getNames(
          this.json["disgPickup"],
          "Pickup"
        );
      }
      if (
        this.contentEditable1[7] &&
        Object.keys(this.ResultData.fsec.fsec).length !== 0
      ) {
        this.json["fsec"] = this.dataChoiceFsec(this.ResultData.fsec.fsec);
        this.json["fsecName"] = this.getNames(this.json["fsec"]);
      }
      if (
        this.contentEditable1[8] &&
        Object.keys(this.ResultData.combfsec.fsecCombine).length !== 0
      ) {
        this.json["fsecCombine"] = this.dataChoiceFsec(
          this.ResultData.combfsec.fsecCombine
        );
        this.json["fsecCombineName"] = this.getNames(
          this.json["fsecCombine"],
          "Combine"
        );
      }
      if (
        this.contentEditable1[9] &&
        Object.keys(this.ResultData.pickfsec.fsecPickup).length !== 0
      ) {
        this.json["fsecPickup"] = this.dataChoiceFsec(
          this.ResultData.pickfsec.fsecPickup
        );
        this.json["fsecPickupName"] = this.getNames(
          this.json["fsecPickup"],
          "Pickup"
        );
      }
      if (
        this.contentEditable1[4] &&
        Object.keys(this.ResultData.reac.reac).length !== 0
      ) {
        this.json["reac"] = this.dataChoice(this.ResultData.reac.reac);
        this.json["reacName"] = this.getNames(this.json["reac"]);
      }
      if (
        this.contentEditable1[5] &&
        Object.keys(this.ResultData.combreac.reacCombine).length !== 0
      ) {
        this.json["reacCombine"] = this.dataChoice(
          this.ResultData.combreac.reacCombine
        );
        this.json["reacCombineName"] = this.getNames(
          this.json["reacCombine"],
          "Combine"
        );
      }
      if (
        this.contentEditable1[6] &&
        Object.keys(this.ResultData.pickreac.reacPickup).length !== 0
      ) {
        this.json["reacPickup"] = this.dataChoice(
          this.ResultData.pickreac.reacPickup
        );
        this.json["reacPickupName"] = this.getNames(
          this.json["reacPickupName"],
          "Pickup"
        );
      }
    }
    if (Object.keys(this.json).length === 0) {
      this.pageError = true;
      return;
    }
    this.pageError = false;

    this.json["dimension"] = this.helper.dimension;

    return this.json;
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

  private dataChoiceFsec(json) {
    const choiceMember = this.customFsec.dataset;
    const axis = this.customFsec.fsecEditable;
    let basic: boolean = true;
    let split = {};
    this.priCount += 2;
    for (const type of Object.keys(json)) {
      let kk = 0;
      let body1 = new Array();
      let body2 = {};
      this.priCount += 2;

      let i = 0;
      for (const list of Object.keys(json[type])) {
        if (isFinite(Number(Object.keys(json[type])[0]))) {
          const item = json[type][list];
          kk = item.m === "" ? kk : Number(item.m) - 1;
          if (choiceMember[kk].check === true) {
            body1.push(item);
            this.priCount += 1;
          }
        } else {
          let axisArr = new Array();
          if (axis[i] === true) {
            this.priCount += 2;

            for (const ax of Object.keys(json[type][list])) {
              basic = false;
              const item = json[type][list][ax];
              kk = item.m === "" ? kk : Number(item.m) - 1;
              if (choiceMember[kk].check === true) {
                axisArr.push(item);
                this.priCount += 1;
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

  private dataChoice(json) {
    const axis =
      Object.keys(json["1"])[0] === "dx_max"
        ? this.customDisg.disgEditable
        : this.customReac.reacEditable;
    let split = {};
    this.priCount += 2;

    for (const type of Object.keys(json)) {
      let LL: boolean = false;

      let body1 = new Array();
      let body2 = {};

      let i = 0;
      this.priCount += 2;

      for (const list of Object.keys(json[type])) {
        if (isFinite(Number(Object.keys(json[type])[0]))) {
          LL = true;
          const item = json[type][list];
          body1.push(item);
          this.priCount += 1;
        } else {
          let axisArr = {};
          if (axis[i] === true) {
            this.priCount += 2;

            for (const ax of Object.keys(json[type][list])) {
              const item = json[type][list][ax];
              axisArr[ax] = item;
              this.priCount += 1;
            }
            body2[list] = axisArr;
          }
          i++;
        }
      }
      split[type] = LL ? body1 : body2;
    }
    return split;
  }
}
