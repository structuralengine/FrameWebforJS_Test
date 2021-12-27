import { Component, OnInit } from "@angular/core";
import { InputDataService } from "../../../../providers/input-data.service";
import { ResultDataService } from "../../../../providers/result-data.service";
import { AfterViewInit } from "@angular/core";
import { JsonpClientBackend } from "@angular/common/http";
import { DataCountService } from "../dataCount.service";
import { DataHelperModule } from "src/app/providers/data-helper.module";
import { PrintCustomFsecService } from "../../custom/print-custom-fsec/print-custom-fsec.service";

@Component({
  selector: "app-print-result-fsec",
  templateUrl: "./print-result-fsec.component.html",
  styleUrls: [
    "../../../../app.component.scss",
    "../invoice.component.scss",
    "../invoice.component.scss",
  ],
})
export class PrintResultFsecComponent implements OnInit, AfterViewInit {
  isEnable = true;
  page: number;
  load_name: string;
  btnPickup: string;
  tableHeight: number;
  invoiceIds: string[];
  invoiceDetails: Promise<any>[];
  reROW: number = 0;
  remainCount: number = 0;
  dimension: number;
  bottomCell: number = 50;

  public fsec_table = [];
  public fsec_break = [];
  public fsec_typeNum = [];

  public judge: boolean;

  private kk = 0;
  private flg: boolean = false;

  private splen = 5;
  public break_after:number;

  constructor(
    private InputData: InputDataService,
    private ResultData: ResultDataService,
    private countArea: DataCountService,
    private custom: PrintCustomFsecService,
    private helper: DataHelperModule) {
    this.dimension = this.helper.dimension;
    this.clear();
  }

  public clear(): void {
    this.fsec_table = new Array();
    this.fsec_break = new Array();
    this.fsec_typeNum = new Array();
  }

  ngOnInit(): void {
    // const json: {} = this.ResultData.fsec.getDisgJson();
    const jud = this.custom.dataset;
    const resultjson: any = this.ResultData.fsec.getFsecJson();
    const tables = this.printForce(resultjson, jud);
    this.fsec_table = tables.table;
    this.fsec_typeNum = tables.title;
    this.judge = this.countArea.setCurrentY(tables.this, tables.last);
  }

  ngAfterViewInit() { }

  // 断面力データを印刷する
  private printForce(json, jud): any {
    const keys: string[] = Object.keys(json);

    for (let i = 0; i < jud.length; i++) {
      if (jud[i].check === true) {
        this.flg = true;
        continue;
      }
    }

    // テーブル
    const splid: any[] = new Array();
    const titleSum: string[] = new Array();
    let row: number = 0;
    for (const index of keys) {
      if (index === "1") {
        row = 8;
      } else {
        row = 5;
      }
      const elist = json[index]; // 1テーブル分のデータを取り出す
      const table: any[] = new Array(); // この時点でリセット、再定義 一旦空にする

      // 荷重名称
      const title: any = [];
      let loadName: string = "";
      const l: any = this.InputData.load.getLoadNameJson(null, index);
      if (index in l) {
        loadName = l[index].name;
        title.push(["Case" + index, loadName]);
      }
      titleSum.push(title);

      let body: any[] = new Array();

      for (const key of Object.keys(elist)) {
        const item = elist[key];
        this.kk = item.m === "" ? this.kk : Number(item.m) - 1;
        if (jud[this.kk].check === true || this.flg === false) {
          const line = ["", "", "", "", "", "", "", ""];
          line[0] = item.m;
          line[1] = item.n;
          line[2] = item.l.toFixed(3);
          line[3] = item.fx.toFixed(2);
          line[4] = item.fy.toFixed(2);
          line[5] = item.fz.toFixed(2);
          line[6] = item.mx.toFixed(2);
          line[7] = item.my.toFixed(2);
          line[8] = item.mz.toFixed(2);
          body.push(line);
          row++;

          // //１テーブルでthis.bottomCell行以上データがあるならば
          // if (row > this.bottomCell) {
          //   table.push(body);
          //   body = [];
          //   row = 3;
          // }
        }
      }

      // if (body.length > 0) {
      //   table.push(body);
      // }
      splid.push(body);
      body = [];
    }

    // if (splid.length > 0) {
    //   const splidlength = Math.floor((splid[0].length)/this.splen);
    //   this.break_after = Math.floor(2/splidlength)+1;
    // }

    if (splid.length > 0) {
      const splidlength = -(splid[0].length / this.splen);
      this.break_after = (Math.floor(splidlength + 5) > 0) ? Math.floor(splidlength + 5) : 1;
    }

    return {
      table: splid, // [タイプ１のテーブルリスト[], タイプ２のテーブルリスト[], ...]
      title: titleSum, // [タイプ１のタイトル, タイプ２のタイトル, ... ]
    };
  }
}
