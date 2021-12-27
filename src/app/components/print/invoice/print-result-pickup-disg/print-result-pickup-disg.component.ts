import { Component, OnInit } from "@angular/core";
import { InputDataService } from "../../../../providers/input-data.service";
import { ResultDataService } from "../../../../providers/result-data.service";
import { AfterViewInit } from "@angular/core";
import { JsonpClientBackend } from "@angular/common/http";
import { DataCountService } from "../dataCount.service";
import { ResultCombineDisgService } from "src/app/components/result/result-combine-disg/result-combine-disg.service";
import { DataHelperModule } from "src/app/providers/data-helper.module";

@Component({
  selector: "app-print-result-pickup-disg",
  templateUrl: "./print-result-pickup-disg.component.html",
  styleUrls: [
    "./print-result-pickup-disg.component.scss",
    "../../../../app.component.scss",
    "../invoice.component.scss",
  ],
})
export class PrintResultPickupDisgComponent implements OnInit, AfterViewInit {
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

  public pickDisg_dataset = [];
  public pickDisg_title = [];
  public pickDisg_case_break = [];
  public pickDisg_type_break = [];

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
    private helper: DataHelperModule
  ) {
    this.dimension = this.helper.dimension;
    this.clear();
  }

  public clear(): void {
    this.pickDisg_dataset = new Array();
    this.pickDisg_title = new Array();
    this.pickDisg_case_break = new Array();
    this.pickDisg_type_break = new Array();
  }

  ngOnInit(): void {
    const resultjson: any = this.ResultData.pickdisg.disgPickup;
    const keys: string[] = Object.keys(resultjson);
    if (keys.length > 0) {
      const tables = this.printPickDisg(resultjson);
      this.pickDisg_dataset = tables.table;
      this.pickDisg_title = tables.titleSum;
      this.judge = this.countArea.setCurrentY(tables.this, tables.last);
    } else {
      this.isEnable = false;
    }
  }

  ngAfterViewInit() {}

  // 変位量データを印刷する
  private printPickDisg(json): any {
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
    const splid: any[] = new Array();
    let typeData: any[] = new Array();
    let typeDefinition: any[] = new Array();
    let typeName: any[] = new Array();
    let typeAll: any[] = new Array();
    this.row = 0;
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

      let table: any[] = new Array();
      let type: any[] = new Array();
      for (let i = 0; i < KEYS.length; i++) {
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
      typeSum,
    };
  }
}
