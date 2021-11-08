import { Component, OnInit } from "@angular/core";
import { InputDataService } from "../../../../providers/input-data.service";
import { AfterViewInit } from "@angular/core";
import { DataCountService } from "../dataCount.service";
import { ArrayCamera } from "three";
import { PrintService } from "../../print.service";
import { DataHelperModule } from "src/app/providers/data-helper.module";

@Component({
  selector: "app-print-input-elements",
  templateUrl: "./print-input-elements.component.html",
  styleUrls: [
    "./print-input-elements.component.scss",
    "../../../../app.component.scss",
    "../invoice.component.scss",
  ],
})
export class PrintInputElementsComponent implements OnInit, AfterViewInit {
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

  public elements_table = [];
  public elements_break = [];
  public elements_typeNum = [];

  public judge: boolean;
  public dimension: number;

  private splen = 5;
  public break_after:number;

  constructor(private printService: PrintService,
    private countArea: DataCountService,
    private helper: DataHelperModule
  ) {
    this.judge = false;
    this.dimension = this.helper.dimension;
    this.clear();
  }

  public clear(): void {
    this.elements_table = new Array();
    this.elements_break = new Array();
    this.elements_typeNum = new Array();
  }

  ngOnInit(): void {
    const inputJson: any = this.printService.inputJson;

    if ("element" in inputJson) {
      const tables = this.printElement(inputJson);
      this.elements_table = tables.table;
      this.elements_break = tables.break_after;
      this.elements_typeNum = tables.title;
      this.judge = this.countArea.setCurrentY(tables.this, tables.last);
    } else {
      this.isEnable = false;
    }
  }

  ngAfterViewInit() { }

  // 材料データ element を印刷する
  private printElement(inputJson): any {
    const json: {} = inputJson["element"]; // inputJsonからelementだけを取り出す
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

        const line = ["", "", "", "", "", "", "", ""];
        line[0] = key;
        line[1] = item.A.toFixed(4);
        line[2] = item.E.toExponential(2);
        line[3] = item.G.toExponential(2);
        line[4] = item.Xp.toExponential(2);
        line[5] = item.Iy.toFixed(6);
        line[6] = item.Iz.toFixed(6);
        line[7] = item.J.toFixed(4);
        line[8] = item.n;
        body.push(line);
        row++;
      }
      
      splid.push(body);
      body = [];
    }

    if (splid.length > 0) {
      const splidlength = -(splid[0].length / this.splen);
      this.break_after = (Math.floor(splidlength + 5) > 0) ? Math.floor(splidlength + 5) : 1;
    }

    return {
      table: splid, // [タイプ１のテーブルリスト[], タイプ２のテーブルリスト[], ...]
      title: title, // [タイプ１のタイトル, タイプ２のタイトル, ... ]
    };

  }
}
