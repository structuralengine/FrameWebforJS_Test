import { Component, OnInit } from "@angular/core";
import { InputDataService } from "../../../../providers/input-data.service";
import { ResultDataService } from "../../../../providers/result-data.service";
import { AfterViewInit } from "@angular/core";
import { JsonpClientBackend } from "@angular/common/http";
import { DataCountService } from "../dataCount.service";
import { DataHelperModule } from "src/app/providers/data-helper.module";

@Component({
  selector: "app-print-result-reac",
  templateUrl: "./print-result-reac.component.html",
  styleUrls: [
    "../../../../app.component.scss",
    "../invoice.component.scss",
    "../invoice.component.scss",
  ],
})
export class PrintResultReacComponent implements OnInit, AfterViewInit {
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

  public reac_table = [];
  public reac_break = [];
  public reac_typeNum = [];

  public judge: boolean;

  private kk = 0;
  private flg: boolean = false;

  private splen = 5;
  public break_after:number;

  constructor(
    private InputData: InputDataService,
    private ResultData: ResultDataService,
    private countArea: DataCountService,
    private helper: DataHelperModule ) {
    this.dimension = this.helper.dimension;
    this.clear();
  }

  public clear(): void {
    this.reac_table = new Array();
    this.reac_break = new Array();
    this.reac_typeNum = new Array();
  }

  ngOnInit(): void {
    // const json: {} = this.ResultData.reac.getDisgJson();
    const resultjson: any = this.ResultData.reac.getReacJson();
    const tables = this.printReact(resultjson);
    this.reac_table = tables.table;
    this.reac_break = tables.break_after;
    this.reac_typeNum = tables.title;
    this.judge = this.countArea.setCurrentY(tables.this, tables.last);
  }

  ngAfterViewInit() {}

  private printReact(json): any {
    const keys: string[] = Object.keys(json);

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
        const line = ["", "", "", "", "", "", "", ""];
        line[0] = item.id.toString();
        line[1] = (Math.round(item.tx *100 )/100).toFixed(2);
        line[2] = (Math.round(item.ty *100 )/100).toFixed(2);
        line[3] = (Math.round(item.tz *100 )/100).toFixed(2);
        line[4] = (Math.round(item.mx *100 )/100).toFixed(2);
        line[5] = (Math.round(item.my *100 )/100).toFixed(2);
        line[6] = (Math.round(item.mz *100 )/100).toFixed(2);
        body.push(line);
        row++;

        // //１テーブルでthis.bottomCell行以上データがあるならば
        // if (row > this.bottomCell) {
        //   table.push(body);
        //   body = [];
        //   row = 2;
        // }
      }

      // if (body.length > 0) {
      //   table.push(body);
      // }
      splid.push(body);
      body = [];
    }

    // // 全体の高さを計算する
    // let countCell = 0;
    // for (const index of keys) {
    //   const elist = json[index]; // 1テーブル分のデータを取り出す
    //   countCell += Object.keys(elist).length;
    // }
    // const countHead = keys.length * 2;
    // const countSemiHead = splid.length * 2;
    // const countTotal = countCell + countHead + countSemiHead + 3;

    // //　各タイプの前に改ページ(break_after)が必要かどうかを判定する。
    // const break_after: boolean[] = new Array();
    // let ROW = 7;
    // for (const index of keys) {
    //   this.reROW = 0;
    //   const elist = json[index]; // 1テーブル分のデータを取り出す
    //   let countCell = Object.keys(elist).length;
    //   ROW += countCell;

    //   if (ROW < this.bottomCell) {
    //     break_after.push(false);
    //     this.reROW = ROW + 4;
    //     ROW = ROW + 4;
    //   } else {
    //     if (index === "1") {
    //       break_after.push(false);
    //     } else {
    //       break_after.push(true);
    //       ROW = 0;
    //     }
    //     let countHead_break = Math.floor((countCell / this.bottomCell) * 2 + 2);
    //     this.reROW = ROW % (this.bottomCell+1);
    //     ROW += countHead_break + countCell;
    //     ROW = ROW % this.bottomCell;
    //     ROW += 4;
    //   }
    // }

    // this.remainCount = this.reROW;

    if (splid.length > 0) {
      const splidlength = -(splid[0].length / this.splen);
      this.break_after = (Math.floor(splidlength + 6) > 0) ? Math.floor(splidlength + 6) : 1;
    }

    //最後のページにどれだけデータが残っているかを求める
    let lastArrayCount: number = this.remainCount;

    return {
      table: splid, // [タイプ１のテーブルリスト[], タイプ２のテーブルリスト[], ...]
      title: titleSum, // [タイプ１のタイトル, タイプ２のタイトル, ... ]
    };
  }
}
