import { Component, OnInit } from "@angular/core";
import { InputDataService } from "../../../../providers/input-data.service";
import { AfterViewInit } from "@angular/core";
import { DataCountService } from "../dataCount.service";
import { PrintService } from "../../print.service";
import { DataHelperModule } from "src/app/providers/data-helper.module";

@Component({
  selector: "app-print-input-fix-node",
  templateUrl: "./print-input-fix-node.component.html",
  styleUrls: [
    "./print-input-fix-node.component.scss",
    "../../../../app.component.scss",
    "../invoice.component.scss",
  ],
})
export class PrintInputFixNodeComponent implements OnInit, AfterViewInit {
  isEnable = true;
  page: number;
  load_name: string;
  countCell: number = 0;
  countHead: number = 0;
  countTotal: number = 0;
  fixNode_countArea: number;
  btnPickup: string;
  tableHeight: number;
  invoiceIds: string[];
  invoiceDetails: Promise<any>[];
  reROW: number = 0;
  remainCount: number = 0;
  bottomCell: number = 50;

  public fixNode_table = [];
  public fixNode_break = [];
  public fixNode_typeNum = [];

  public judge: boolean;
  public dimension: number;

  private splen = 5;
  public break_after:number;


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
    this.fixNode_table = new Array();
    this.fixNode_break = new Array();
    this.fixNode_typeNum = new Array();
  }

  ngOnInit(): void {
    const inputJson: any = this.printService.inputJson;

    if ("fix_node" in inputJson) {
      const tables = this.printFixnode(inputJson); // {body, title}
      this.fixNode_table = tables.table;
      this.fixNode_break = tables.break_after;
      this.fixNode_typeNum = tables.title;
      this.judge = this.countArea.setCurrentY(tables.this, tables.last);
    } else {
      this.isEnable = false;
    }
  }

  ngAfterViewInit() {}

  // 支点データ fix_node を印刷する
  private printFixnode(inputJson): any {
    const json: {} = inputJson["fix_node"];
    const keys: string[] = Object.keys(json);

    // テーブル
    const splid: any[] = new Array();
    const title: string[] = new Array();
    let row: number = 8;
    for (const index of keys) {
      const elist = json[index]; // 1テーブル分のデータを取り出す
      const table: any[] = new Array(); // この時点でリセット、再定義 一旦空にする

      title.push(index.toString());

      let body: any[] = new Array();

      for (const key of Object.keys(elist)) {
        const item = elist[key];

        const line = ["", "", "", "", "", "", ""];
        line[0] = item.n.toString();
        line[1] = item.tx.toString();
        line[2] = item.ty.toString();
        line[3] = item.tz.toString();
        line[4] = item.rx.toString();
        line[5] = item.ry.toString();
        line[6] = item.rz.toString();
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
