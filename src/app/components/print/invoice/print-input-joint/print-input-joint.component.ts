import { Component, OnInit } from "@angular/core";
import { InputDataService } from "../../../../providers/input-data.service";
import { AfterViewInit } from "@angular/core";
import { DataCountService } from "../dataCount.service";
import { Data } from "@angular/router";
import { PrintService } from "../../print.service";
import { DataHelperModule } from "src/app/providers/data-helper.module";

@Component({
  selector: "app-print-input-joint",
  templateUrl: "./print-input-joint.component.html",
  styleUrls: [
    "./print-input-joint.component.scss",
    "../../../../app.component.scss",
    "../invoice.component.scss",
  ],
})
export class PrintInputJointComponent implements OnInit, AfterViewInit {
  isEnable = true;
  page: number;
  load_name: string;
  countCell: number = 0;
  countHead: number = 0;
  countTotal: number = 0;
  btnPickup: string;
  tableHeight: number;
  invoiceIds: string[];
  invoiceDetails: Promise<any>[];
  reROW: number = 0;
  remainCount: number = 0;
  bottomCell: number = 50;

  public joint_table = [];
  public joint_break = [];
  public joint_typeNum = [];

  public judge: boolean;
  public dimension: number;

  constructor(
    private printService: PrintService,
    private countArea: DataCountService,
    private helper: DataHelperModule
  ) {
    this.judge = false;
    this.dimension = this.helper.dimension;
    this.clear();
  }

  public clear(): void {
    this.joint_table = new Array();
    this.joint_break = new Array();
    this.joint_typeNum = new Array();
  }

  ngOnInit(): void {
    const inputJson: any = this.printService.inputJson;

    if ("joint" in inputJson) {
      const tables = this.printjoint(inputJson); // {body, title}
      this.joint_table = tables.table;
      this.joint_break = tables.break_after;
      this.joint_typeNum = tables.title;
      this.judge = this.countArea.setCurrentY(tables.this, tables.last);
    } else {
      this.isEnable = false;
    }
  }

  ngAfterViewInit() { }

  // 結合データ を印刷する
  private printjoint(inputJson): any {
    const json: {} = inputJson["joint"]; // inputJsonからjointだけ取り出す
    const keys: string[] = Object.keys(json);

    // テーブル
    const splid: any[] = new Array();
    const title: string[] = new Array();
    let row: number = 7;
    for (const index of keys) {
      const elist = json[index]; // 1テーブル分のデータを取り出す
      
      title.push(index.toString());

      let body: any[] = new Array();

      for (const key of Object.keys(elist)) {
        const item = elist[key];

        const line = ["", "", "", "", "", "", ""];
        line[0] = item.m;
        line[1] = item.xi.toFixed(0);
        line[2] = item.yi.toFixed(0);
        line[3] = item.zi.toFixed(0);
        line[4] = item.xj.toFixed(0);
        line[5] = item.yj.toFixed(0);
        line[6] = item.zj.toFixed(0);
        body.push(line);
      }

      splid.push(body);
      body = [];
    }

    return {
      table: splid, // [タイプ１のテーブルリスト[], タイプ２のテーブルリスト[], ...]
      title: title, // [タイプ１のタイトル, タイプ２のタイトル, ... ]
    };
  }
}
