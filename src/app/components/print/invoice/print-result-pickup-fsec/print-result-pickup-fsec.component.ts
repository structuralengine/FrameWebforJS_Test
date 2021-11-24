import { Component, OnInit } from "@angular/core";
import { InputDataService } from "../../../../providers/input-data.service";
import { ResultDataService } from "../../../../providers/result-data.service";
import { AfterViewInit } from "@angular/core";
import { DataCountService } from "../dataCount.service";
import { ResultCombineFsecService } from "src/app/components/result/result-combine-fsec/result-combine-fsec.service";
import { DataHelperModule } from "src/app/providers/data-helper.module";
import { PrintCustomFsecService } from "../../custom/print-custom-fsec/print-custom-fsec.service";
import { PrintCustomThreeService } from "../../custom/print-custom-three/print-custom-three.service";

@Component({
  selector: "app-print-result-pickup-fsec",
  templateUrl: "./print-result-pickup-fsec.component.html",
  styleUrls: [
    "./print-result-pickup-fsec.component.scss",
    "../../../../app.component.scss",
    "../invoice.component.scss",
  ],
})
export class PrintResultPickupFsecComponent implements OnInit, AfterViewInit {
  isEnable = true;
  page: number;
  load_name: string;
  btnPickup: string;
  tableHeight: number;
  invoiceIds: string[];
  invoiceDetails: Promise<any>[];
  row: number = 0;
  dimension: number;
  bottomCell: number = 50;

  public pickFsec_dataset = [];
  public pickFsec_title = [];
  public pickFsec_case_break = [];
  public pickFsec_type_break = [];

  public judge: boolean;

  private kk = 0;
  private flg: boolean = false;

  private splen = 5;
  public break_after: number;
  public pagerBl;
  public pagerBr;

  constructor(
    private InputData: InputDataService,
    private ResultData: ResultDataService,
    private countArea: DataCountService,
    private combFsec: ResultCombineFsecService,
    private custom: PrintCustomFsecService,
    private helper: DataHelperModule,
    private printCustomThree: PrintCustomThreeService,
  ) {
    this.dimension = this.helper.dimension;
    this.judge = false;
    this.clear();
  }

  public clear(): void {
    this.pickFsec_dataset = new Array();
    this.pickFsec_title = new Array();
    this.pickFsec_case_break = new Array();
    this.pickFsec_type_break = new Array();
  }

  ngOnInit(): void {
    const resultjson: any = this.ResultData.pickfsec.fsecPickup;
    const keys: string[] = Object.keys(resultjson);
    if (keys.length > 0) {
      this.custom.clear();
      const jud = this.custom.dataset;
      const tables = this.printPickForce(resultjson, jud);
      this.pickFsec_dataset = tables.table;
      this.pickFsec_title = tables.titleSum;
      this.judge = this.countArea.setCurrentY(tables.this, tables.last);
    } else {
      this.isEnable = false;
    }
  }

  ngAfterViewInit() { }

  private printPickForce(json, jud): any {
    const titleSum: any = [];
    const body: any[] = new Array();
    const typeSum: any = [];

    const KEYS = this.combFsec.fsecKeys;
    const TITLES = this.combFsec.titles;
    const keys: string[] = Object.keys(json);

    //　テーブル
    const splid: any = [];
    let typeDefinition: any = [];
    let typeName: any = [];
    let typeAll: any = [];
    this.row = 0;

    for (let i = 0; i < jud.length; i++) {
      if (jud[i].check === true) {
        this.flg = true;
        continue;
      }
    }

    for (const index of keys) {
      const elist = json[index]; // 1テーブル分のデータを取り出す
      // 荷重名称
      const title: any = [];
      let loadName: string = "";
      const pickupJson: any = this.InputData.pickup.getPickUpJson();
      if (index in pickupJson) {
        if ("name" in pickupJson[index]) {
          loadName = pickupJson[index].name;
          title.push(["Case" + index, loadName]);
        } else {
          title.push(["Case" + index]);
        }
      }
      titleSum.push(title);

      let n = 0;

      for (let i = 0; i < KEYS.length; i++) {
        if (this.printCustomThree.contentEditable2[n] === true) {
          const key = KEYS[i];
          const title2 = TITLES[i];
          const elieli = json[index]; // 1行分のnodeデータを取り出す
          if (!(key in elieli)) continue;

          typeName.push(title2);

          const elist = elieli[key]; // 1行分のnodeデータを取り出す.
          let body: any[] = new Array();
          if (i === 0) {
            this.row = 10;
          } else {
            this.row = 7;
          }
          this.kk = 0;

          for (const k of Object.keys(elist)) {
            const item = elist[k];
            this.kk = item.m === "" ? this.kk : Number(item.m) - 1;
            if (jud[this.kk].check === true || this.flg === false) {
              // 印刷する1行分のリストを作る
              const line = ["", "", "", "", "", "", "", "", "", ""];
              line[0] = item.m.toString();
              line[1] = item.n.toString();
              line[2] = item.l.toFixed(3);
              line[3] = item.fx.toFixed(2);
              line[4] = item.fy.toFixed(2);
              line[5] = item.fz.toFixed(2);
              line[6] = item.mx.toFixed(2);
              line[7] = item.my.toFixed(2);
              line[8] = item.mz.toFixed(2);
              line[9] = item.comb + ":" + item.case;

              body.push(line);
              this.row++;

              //１テーブルでthis.bottomCell行以上データがあるならば
              // if (this.row > this.bottomCell) {
              //   table.push(body);
              //   body = [];
              //   this.row = 3;
              // }
            }
          }
          // if (body.length > 0) {
          //   table.push(body);
          // }

          // if (table.length > 0) {
          //   typeData.push(table);
          //   table = [];
          // }
          typeDefinition.push(typeName, body);
          typeAll.push(typeDefinition);
          typeName = [];
          body = [];
          typeDefinition = [];
        }
        (i + 1) % 2 == 0 ? n += 1 : n;
      }
      splid.push(typeAll);
      typeAll = [];
    }

    if (splid.length > 0) {
      const splidlength = -(splid[0][0][1].length / this.splen);
      this.break_after =
        Math.floor(splidlength + 5) > 0 ? Math.floor(splidlength + 5) : 1;
    }

    this.flg = false;

    return {
      titleSum,
      table: splid,
      typeSum,
    };
  }
}
