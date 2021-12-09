import { Component, OnInit } from "@angular/core";
import { InputDataService } from "../../../../providers/input-data.service";
import { ResultDataService } from "../../../../providers/result-data.service";
import { AfterViewInit } from "@angular/core";
import { DataCountService } from "../dataCount.service";
import { ResultCombineFsecService } from "src/app/components/result/result-combine-fsec/result-combine-fsec.service";
import { DataHelperModule } from "src/app/providers/data-helper.module";
import { PrintCustomFsecService } from "../../custom/print-custom-fsec/print-custom-fsec.service";
import { element } from "protractor";

@Component({
  selector: "app-print-result-combine-fsec",
  templateUrl: "./print-result-combine-fsec.component.html",
  styleUrls: ["../../../../app.component.scss", "../invoice.component.scss"],
})
export class PrintResultCombineFsecComponent implements OnInit, AfterViewInit {
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

  public combFsec_dataset = [];
  public combFsec_title = [];
  public combFsec_case_break = [];
  public combFsec_type_break = [];

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
    private printCustomFsec: PrintCustomFsecService
  ) {
    this.dimension = this.helper.dimension;
    this.judge = false;
    this.clear();
  }

  public clear(): void {
    this.combFsec_dataset = new Array();
    this.combFsec_title = new Array();
    this.combFsec_case_break = new Array();
    this.combFsec_type_break = new Array();
  }

  ngOnInit(): void {
    // const json: {} = this.ResultData.disg.getDisgJson();
    const resultjson: any = this.ResultData.combfsec.fsecCombine;
    const keys: string[] = Object.keys(resultjson);
    if (keys.length > 0) {
      this.custom.clear();
      const jud = this.custom.dataset;
      const tables = this.printCombForce(resultjson, jud);
      this.combFsec_dataset = tables.table;
      this.combFsec_title = tables.titleSum;
      this.judge = this.countArea.setCurrentY(tables.this, tables.last);
    } else {
      this.isEnable = false;
    }
  }

  ngAfterViewInit() {}

  // 変位量データを印刷する
  private printCombForce(json, jud): any {
    const titleSum: any[] = new Array();
    const body: any[] = new Array();
    const typeSum: any[] = new Array();
    let target_flg = false;

    const KEYS = this.combFsec.fsecKeys;
    const TITLES = this.combFsec.titles;
    const keys: string[] = Object.keys(json);

    //　テーブル
    const splid: any[] = new Array();
    let typeName: any = [];
    let typeDefinition: any = [];
    let typeAll: any = [];
    this.row = 0;

    for (let i = 0; i < jud.length; i++) {
      if (jud[i].check === true) {
        this.flg = true;
        continue;
      }
    }

    if (!this.printCustomFsec.fsecEditable.includes(true)) {
      for (let i = 0; i < this.printCustomFsec.fsecEditable.length; i++) {
        this.printCustomFsec.fsecEditable[i] = true;
      }
    }

    for (let i = 0; i < jud.length; i++) {
      if ("check" in jud[i]) {
        if (jud[i].check === true) {
          target_flg = true;
          break;
        }
      }
    }

    if (target_flg === false) {
      for (let i = 0; i < jud.length; i++) {
        jud[i].check = true;
      }
    }

    for (const index of keys) {
      const elist = json[index]; // 1テーブル分のデータを取り出す
      // 荷重名称
      const title: any[] = new Array();
      let loadName: string = "";
      const combineJson: any = this.InputData.combine.getCombineJson();
      if (index in combineJson) {
        if ("name" in combineJson[index]) {
          loadName = combineJson[index].name;
          title.push(["Case" + index, loadName]);
        } else {
          title.push(["Case" + index]);
        }
      }
      titleSum.push(title);

      for (let i = 0; i < KEYS.length; i++) {
        if (this.printCustomFsec.fsecEditable[i] === true) {
          const key = KEYS[i];
          const title2 = TITLES[i];
          const elieli = json[index]; // 1行分のnodeデータを取り出す
          if (!(key in elieli)) {
            continue;
          }

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
              line[9] = item.case;

              body.push(line);
              this.row++;
            }
          }

          typeDefinition.push(typeName, body);
          typeAll.push(typeDefinition);
          typeName = [];
          body = [];
          typeDefinition = [];
        }
      }
      splid.push(typeAll);
      typeAll = [];
    }

    // if (splid.length > 0) {
    //   const splidlength = splid[0][0][1].length/this.splen;
    //   this.break_after = Math.floor(2/splidlength)+1;
    // }
    if (splid.length > 0) {
      const splidlength = -(splid[0][0][1].length / this.splen);
      this.break_after =
        Math.floor(splidlength + 5) > 0 ? Math.floor(splidlength + 5) : 1;
    }

    return {
      titleSum,
      table: splid,
      typeSum,
    };
  }
}
