import { Directionality } from "@angular/cdk/bidi";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { DataHelperModule } from "src/app/providers/data-helper.module";
import { InputDataService } from "src/app/providers/input-data.service";
import { LanguagesService } from "src/app/providers/languages.service";
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
  public pageOver: boolean = false; // printPossibleを超えるようなページ数の場合にtrue
  public printPossible: number = 1000; // ページ数の閾値
  public pageDisplay: boolean = true; //　概算ページ数の表示
  public pageError: boolean = false; // 対象データの存在
  constructor(
    private router: Router,
    public InputData: InputDataService,
    private ResultData: ResultDataService,
    private customFsec: PrintCustomFsecService,
    private customReac: PrintCustomReacService,
    private customDisg: PrintCustomDisgService,
    private customThree: PrintCustomThreeService,
    private helper: DataHelperModule,
    private language: LanguagesService
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

  // ラジオボタン選択時に発動．一旦すべてfalseにしてから，trueにする．
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

    // 変位，反力，断面力の印刷する軸の選択用
    // 初期値true
    // for (let j = 0; j < 12; j++) {
    //   this.customDisg.disgEditable[j] = true;
    //   this.customFsec.fsecEditable[j] = true;
    //   this.customReac.reacEditable[j] = true;
    // }
    this.priCount = 0;

    this.newPrintJson();
  }

  // ページ予想枚数を計算する
  public newPrintJson() {
    setTimeout(() => {
      // pricount:行数をためる
      this.priCount = 0;
      // 画面の印刷であれば行数のカウント
      if (!(this.contentEditable1[10] === true)) {
        this.getPrintDatas(); // サーバーに送るデータをつくる
      } else {
        this.pageError = false; // 画像印刷はエラー対象にしない
      }
      // 50刻みで概算ページ数を計算する
      // 69：1ページ当たりの入る行数
      this.pageCount = Math.ceil((Math.ceil(this.priCount / 69) * 2) / 50) * 50;
      // 概算ページ数が1000ページ(this.printPossible)を超えると，印刷不可
      this.pageOver = this.pageCount > this.printPossible ? true : false;

      // 概算ページ数が50いかない場合と，入力データ，画像データの時には，概算ページ数を非表示にする．
      if (!(this.contentEditable1[0] == true || this.contentEditable1[10] == true)) {
        if(this.pageCount > 50 ){
          this.pageDisplay = true;
        } else {
          this.pageDisplay = false;
        }
      }

      // 印刷するボタンのactive/非active化
      const id = document.getElementById("printButton");
      if (this.pageOver || this.pageError) {
        id.setAttribute("disabled", "true");
        id.style.opacity = "0.7";
      } else {
        id.removeAttribute("disabled");
        id.style.opacity = "";
      }
    }, 100);
  }

  public getPrintDatas() {
    // データを取得，サーバーに送る用のデータをつくる．
    // データを作りながら，行数をカウントする．

    this.json = {}; // サーバーに送るデータ
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
          this.json["reacPickup"],
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
    this.json["language"] = this.language.browserLang;

    return this.json;
  }

  private getNames(json, target = "") {
    const keys: string[] = Object.keys(json);
    this.getNamesAll(target); // combine,pickup時,combineとpickuoデータを取得する
    var name = new Array();
    for (const index of keys) {
      let loadName = "";
      switch (target) {
        // combine名称を取得する
        case "Combime":
          if (index in this.combineJson) {
            if ("name" in this.combineJson[index]) {
              loadName = this.combineJson[index].name;
            }
          }
          break;
        // pickup名称を取得する
        case "Pickup":
          if (index in this.pickupJson) {
            if ("name" in this.pickupJson[index]) {
              loadName = this.pickupJson[index].name;
            }
          }
          break;
        // 基本荷重名称を取得する
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

  // 断面力用
  private dataChoiceFsec(json) {
    //　部材番号指定の一覧データ
    const choiceMember = this.customFsec.dataset;
    //　軸方向指定データ
    const axis = this.customFsec.fsecEditable;
    let split = {};
    this.priCount += 2;
    //case毎
    for (const type of Object.keys(json)) {
      let kk = 0;
      let body1 = new Array();
      let body2 = {};
      let basic: boolean = true;
      this.priCount += 2;

      let i = 0;

      // 各データor軸方向別データ
      for (const list of Object.keys(json[type])) {
        // 各データか軸方向別データかどうかの分岐
        // key：
        // 各データ＝"1",軸方向別データ:"dx_max" 数値に変えられるかどうか
        if (isFinite(Number(Object.keys(json[type])[0]))) {
          const item = json[type][list];
          // 部材番号が空の場合は部材番号が前のものと同じ
          kk = item.m === "" ? kk : Number(item.m) - 1;
          // 指定の部材番号データのみ
          if (choiceMember[kk].check === true) {
            body1.push(item);
            this.priCount += 1;
          }
        } else {
          let axisArr = new Array();
          basic = false;
          if (axis[i] === true) {
            this.priCount += 2;

            for (const ax of Object.keys(json[type][list])) {
              const item = json[type][list][ax];
              // 部材番号が空の場合は部材番号が前のものと同じ
              kk = item.m === "" ? kk : Number(item.m) - 1;
              // 指定の部材番号データのみ
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

  // 反力，変位用
  private dataChoice(json) {
    let split = {}; // まとめのデータ
    this.priCount += 2;

    //case毎
    for (const type of Object.keys(json)) {
      let basic: boolean = true;

      let body1 = new Array(); // 軸指定がないとき
      let body2 = {}; //LL,combine,pickup
      let i = 0;
      this.priCount += 2;

      for (const list of Object.keys(json[type])) {
        if (isFinite(Number(Object.keys(json[type])[0]))) {
          const item = json[type][list];
          body1.push(item);
          this.priCount += 1;
        } else {
          let axisArr = {};
          basic = false;

          // LL,combine,Pickup用，反力か変位かをデータ形式から判断する
          // dx_maxがある時：変位量データ
          const axis =
            Object.keys(json[type])[0] === "dx_max"
              ? this.customDisg.disgEditable
              : this.customReac.reacEditable;

          // 軸方向にチェックがついていた時
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
      split[type] = basic ? body1 : body2;
    }
    return split;
  }
}
