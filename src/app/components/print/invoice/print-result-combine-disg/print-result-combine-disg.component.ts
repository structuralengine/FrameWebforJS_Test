import { Component, OnInit } from "@angular/core";
import { InputDataService } from "../../../../providers/input-data.service";
import { ResultDataService } from "../../../../providers/result-data.service";
import { AfterViewInit } from "@angular/core";
import { DataCountService } from "../dataCount.service";
import { ResultCombineDisgService } from "src/app/components/result/result-combine-disg/result-combine-disg.service";
import { DataHelperModule } from "src/app/providers/data-helper.module";

@Component({
  selector: "app-print-result-combine-disg",
  templateUrl: "./print-result-combine-disg.component.html",
  styleUrls: [
    "../../../../app.component.scss",
    "../invoice.component.scss",
    "../invoice.component.scss",
  ],
})
export class PrintResultCombineDisgComponent implements OnInit, AfterViewInit {
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

  public combDisg_dataset = [];
  public combDisg_title = [];
  public combDisg_case_break = [];
  public combDisg_type_break = [];

  public judge: boolean;

  private splen = 5;
  public break_after: number;
  public pagerBl;
  public pagerBr;

  constructor(
    private InputData: InputDataService,
    private ResultData: ResultDataService,
    private countArea: DataCountService,
    private combDisg: ResultCombineDisgService,
    private helper: DataHelperModule ) {
    this.dimension = this.helper.dimension;
    this.judge = false;
    this.clear();
  }

  public clear(): void {
    this.combDisg_dataset = new Array();
    this.combDisg_title = new Array();
    this.combDisg_case_break = new Array();
    this.combDisg_type_break = new Array();
  }

  ngOnInit(): void {
    // const json: {} = this.ResultData.disg.getDisgJson();
    const resultjson: any = this.ResultData.combdisg.disgCombine;
    const keys: string[] = Object.keys(resultjson);
    if (keys.length > 0) {
      const tables = this.printCombDisg(resultjson);
      this.combDisg_dataset = tables.table;
      this.combDisg_title = tables.titleSum;
      this.judge = this.countArea.setCurrentY(tables.this, tables.last);
    } else {
      this.isEnable = false;
    }
  }

  ngAfterViewInit() {}

  // 変位量データを印刷する
  private printCombDisg(json): any {
    const titleSum: any[] = new Array();
    let body: any[] = new Array();
    const typeSum: any[] = new Array();

    const KEYS = this.combDisg.disgKeys;
    const TITLES = this.combDisg.titles;
    
    // [
    //   "dx_max",
    //   "dx_min",
    //   "dy_max",
    //   "dy_min",
    //   "dz_max",
    //   "dz_min",
    //   "rx_max",
    //   "rx_min",
    //   "ry_max",
    //   "ry_min",
    //   "rz_max",
    //   "rz_min",
    // ];

    const keys: string[] = Object.keys(json);

    //　テーブル
    const splid: any = [];
    let typeData: any = [];
    let typeName:  any = [];
    let typeDefinition: any = [];
    let typeAll: any = [];
    this.row = 0;
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
     
      let table: any = [];
      for (let i = 0; i < KEYS.length; i++) {
        const key = KEYS[i];
        const title2 = TITLES[i];
        const elieli = json[index]; // 1行分のnodeデータを取り出す
        if(!(key in elieli)) continue;

        typeName.push(title2);

        const elist = elieli[key]; // 1行分のnodeデータを取り出す.
        let body: any[] = new Array();
        if (i === 0) {
          this.row = 10;
        } else {
          this.row = 7;
        }

        for (const k of Object.keys(elist)) {
          const item = elist[k];

          // 印刷する1行分のリストを作る
          const line = ["", "", "", "", "", "", "", ""];
          line[0] = k.toString();
          line[1] = item.dx.toFixed(4);
          line[2] = item.dy.toFixed(4);
          line[3] = item.dz.toFixed(4);
          line[4] = item.rx.toFixed(4);
          line[5] = item.ry.toFixed(4);
          line[6] = item.rz.toFixed(4);
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
      table: splid,
      typeSum
    };
  }
}
