import { Component, OnInit } from "@angular/core";
import { InputDataService } from "../../../../providers/input-data.service";
import { ResultDataService } from "../../../../providers/result-data.service";
import { AfterViewInit } from "@angular/core";
import { JsonpClientBackend } from "@angular/common/http";
import { DataCountService } from "../dataCount.service";
import { ResultCombineReacService } from "src/app/components/result/result-combine-reac/result-combine-reac.service";
import { DataHelperModule } from "src/app/providers/data-helper.module";

@Component({
  selector: "app-print-result-combine-reac",
  templateUrl: "./print-result-combine-reac.component.html",
  styleUrls: [
    "../../../../app.component.scss",
    "../invoice.component.scss",
    "../invoice.component.scss",
  ],
})
export class PrintResultCombineReacComponent implements OnInit, AfterViewInit {
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

  public combReac_dataset = [];
  public combReac_title = [];
  public combReac_case_break = [];
  public combReac_type_break = [];

  public judge: boolean;

  private splen = 5;
  public break_after: number;
  public pagerBl;
  public pagerBr;

  constructor(
    private InputData: InputDataService,
    private ResultData: ResultDataService,
    private countArea: DataCountService,
    private combReac: ResultCombineReacService,
    private helper: DataHelperModule ) {
    this.dimension = this.helper.dimension;
    this.judge = false;
    this.clear();
  }

  public clear(): void {
    this.combReac_dataset = new Array();
    this.combReac_title = new Array();
    this.combReac_case_break = new Array();
    this.combReac_type_break = new Array();
  }

  ngOnInit(): void {
    // const json: {} = this.ResultData.disg.getDisgJson();
    const resultjson: any = this.ResultData.combreac.reacCombine;
    const keys: string[] = Object.keys(resultjson);
    if (keys.length > 0) {
      const tables = this.printCombReact(resultjson);
      this.combReac_dataset = tables.table;
      this.combReac_title = tables.titleSum;
      this.judge = this.countArea.setCurrentY(tables.this, tables.last);
    } else {
      this.isEnable = false;
    }
  }

  ngAfterViewInit() {}

  // 変位量データを印刷する
  private printCombReact(json): any {
    const titleSum: any[] = new Array();
    const body: any[] = new Array();
    const typeSum: any[] = new Array();

    const KEYS = this.combReac.reacKeys
    const TITLES = this.combReac.titles;
    // [
    //   "tx_max",
    //   "tx_min",
    //   "ty_max",
    //   "ty_min",
    //   "tz_max",
    //   "tz_min",
    //   "mx_max",
    //   "mx_min",
    //   "my_max",
    //   "my_min",
    //   "mz_max",
    //   "mz_min",
    // ];
    // const TITLES = ['x方向の支点反力 最大', 'x方向の支点反力 最小', 'y方向の支点反力 最大', 'y方向の支点反力 最小', 'z方向の支点反力 最大', 'Z方向の支点反力 最小',
    //   'x軸回りの回転反力 最大', 'x軸回りの回転反力 最小', 'y軸回りの回転反力 最大', 'y軸回りの回転反力 最小', 'z軸回りの回転反力 最大', 'Z軸回りの回転反力 最小'];

    const keys: string[] = Object.keys(json);

    //　テーブル
    const splid: any[] = new Array();
    let typeData: any[] = new Array();
    let typeName: any[] = new Array();
    let typeDefinition: any[] = new Array();
    let typeAll: any[] = new Array();
    //const titleSum: string[] = new Array();
    this.row = 0;
    for (const index of keys) {
      const elist = json[index]; // 1テーブル分のデータを取り出す

      // 荷重名称
      const title: any[] = new Array();
      let loadName: string = "";
      //const l: any = this.InputData.load.getLoadNameJson(null, index);
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

      let table: any[] = new Array();
      let type: any[] = new Array();
      for (let i = 0; i < KEYS.length; i++) {
        const key = KEYS[i];
        const title2 = TITLES[i];
        const elieli = json[index]; // 1行分のnodeデータを取り出す
        if(!(key in elieli)) continue;

        typeName.push(title2);

        const elist = elieli[key]; // 1行分のnodeデータを取り出す.
        let body: any[] = new Array();
        if (i === 0) {
          this.row = 9;
        } else {
          this.row = 6;
        }

        for (const k of Object.keys(elist)) {
          const item = elist[k];
          // 印刷する1行分のリストを作る
          const line = ["", "", "", "", "", "", "", ""];
          line[0] = k.toString();
          line[1] = item.tx.toFixed(2);
          line[2] = item.ty.toFixed(2);
          line[3] = item.tz.toFixed(2);
          line[4] = item.mx.toFixed(2);
          line[5] = item.my.toFixed(2);
          line[6] = item.mz.toFixed(2);
          line[7] = item.case;

          body.push(line);
          this.row++;
        }
        typeDefinition.push(typeName, body);
        typeAll.push(typeDefinition);
        typeName = [];
        body = [];
        typeDefinition = [];
      }

      splid.push(typeAll);
      typeAll = [];
    }

    if (splid.length > 0) {
      const splidlength = -(splid[0][0][1].length / this.splen);
      this.break_after =
        Math.floor(splidlength + 5) > 0 ? Math.floor(splidlength + 5) : 1;
    }

    return {
      titleSum,
      table:splid,
      typeSum,
    };
  }
}
