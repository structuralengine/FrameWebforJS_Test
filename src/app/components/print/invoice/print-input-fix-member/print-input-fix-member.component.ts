import { Component, OnInit } from "@angular/core";
import { InputDataService } from "../../../../providers/input-data.service";
import { AfterViewInit } from "@angular/core";
import { DataCountService } from "../dataCount.service";
import { ArrayCamera } from "three";
import { PrintService } from "../../print.service";
import { DataHelperModule } from "src/app/providers/data-helper.module";

@Component({
  selector: "app-print-input-fix-member",
  templateUrl: "./print-input-fix-member.component.html",
  styleUrls: [
    "./print-input-fix-member.component.scss",
    "../../../../app.component.scss",
    "../invoice.component.scss",
  ],
})
export class PrintInputFixMemberComponent implements OnInit, AfterViewInit {
  isEnable = true;
  page: number;
  load_name: string;
  countCell: number  = 0;
  countHead: number  = 0;
  countTotal: number = 0;
  btnPickup: string;
  tableHeight: number;
  invoiceIds: string[];
  invoiceDetails: Promise<any>[];
  reROW : number = 0;
  remainCount : number = 0;
  bottomCell: number = 50;

  public fixMember_table = [];
  public fixMember_break = [];
  public fixMember_typeNum = [];

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
    this.fixMember_table = new Array();
    this.fixMember_break = new Array();
    this.fixMember_typeNum = new Array();
  }

  ngOnInit(): void {
    const inputJson: any = this.printService.inputJson;

    if ("fix_member" in inputJson) {
      const tables = this.printFixmember(inputJson); // {body, title}
      this.fixMember_table = tables.table;
      this.fixMember_break = tables.break_after;
      this.fixMember_typeNum = tables.title;
      this.judge = this.countArea.setCurrentY(tables.this, tables.last);
    } else {
      this.isEnable = false;
    }
  }

  ngAfterViewInit() { }

  // バネデータ fix_member を印刷する
  private printFixmember(inputJson): any {
    const json: {} = inputJson["fix_member"];
    const keys: string[] = Object.keys(json);

    // テーブル
    const splid: any[] = new Array();
    const title: string[] = new Array();

    for (const index of keys) {
      const elist = json[index]; // 1テーブル分のデータを取り出す
      const table: any[] = new Array(); // この時点でリセット、再定義 一旦空にする

      title.push(index.toString());

      let body: any[] = new Array();
      for (const key of Object.keys(elist)) {
        const item = elist[key];

        const line = ["", "", "", "", ""];
        line[0] = item.m;
        line[1] = item.tx.toString();
        line[2] = item.ty.toString();
        line[3] = item.tz.toString();
        line[4] = item.tr.toString();
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
