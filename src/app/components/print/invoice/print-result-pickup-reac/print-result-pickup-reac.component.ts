import { Component, OnInit } from "@angular/core";
import { InputDataService } from "../../../../providers/input-data.service";
import { ResultDataService } from "../../../../providers/result-data.service";
import { AfterViewInit } from "@angular/core";
import { JsonpClientBackend } from "@angular/common/http";
import { DataCountService } from "../dataCount.service";
import { ResultCombineReacService } from "src/app/components/result/result-combine-reac/result-combine-reac.service";
import { DataHelperModule } from "src/app/providers/data-helper.module";

@Component({
  selector: "app-print-result-pickup-reac",
  templateUrl: "./print-result-pickup-reac.component.html",
  styleUrls: [
    "./print-result-pickup-reac.component.scss",
    "../../../../app.component.scss",
    "../invoice.component.scss",
  ],
})
export class PrintResultPickupReacComponent implements OnInit {
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

  public pickReac_datase = [];
  public pickReac_dataset = [];
  public pickReac_title = [];
  public pickReac_type = [];

  public pickReac_case_break = [];
  public pickReac_type_break = [];

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
    this.pickReac_dataset = new Array();
    this.pickReac_title = new Array();
  }

  ngOnInit(): void {
    const resultjson: any = this.ResultData.pickreac.reacPickup;
    const keys: string[] = Object.keys(resultjson);
    if (keys.length > 0) {
      const tables = this.printPickReact(resultjson);
      this.pickReac_dataset = tables.table;
      this.pickReac_title = tables.titleSum;
      this.judge = this.countArea.setCurrentY(tables.this, tables.last);
    } else {
      this.isEnable = false;
    }
  }

  ngAfterViewInit() {}

  private printPickReact(json): any {
    const titleSum: any = [];
    const body: any[] = new Array();
    const typeSum: any = [];

    const KEYS = this.combReac.reacKeys;
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
    const splid: any = [];

    let typeDefinition: any = [];
    let typeName: any = [];
    let typeAll: any = [];
    this.row = 0;
    for (const index of keys) {
      const elist = json[index]; // 1テーブル分のデータを取り出す

      // 荷重名称
      const title: any = [];
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

      let table: any = [];
      let type: any = [];
      for (let i = 0; i < KEYS.length; i++) {
        const key = KEYS[i];
        const title2 = TITLES[i];
        const elieli = json[index]; // 1行分のnodeデータを取り出す
        if(!(key in elieli)) continue;

        typeName.push(title2);

        const elist = elieli[key]; // 1行分のnodeデータを取り出す.
        let body: any = [];
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
