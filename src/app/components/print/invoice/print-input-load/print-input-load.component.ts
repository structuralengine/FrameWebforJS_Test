import { Component, OnInit } from "@angular/core";
import { AfterViewInit } from "@angular/core";
import { DataCountService } from "../dataCount.service";
import { PrintService } from "../../print.service";
import { DataHelperModule } from "src/app/providers/data-helper.module";

@Component({
  selector: "app-print-input-load",
  templateUrl: "./print-input-load.component.html",
  styleUrls: [
    "./print-input-load.component.scss",
    "../../../../app.component.scss",
    "../invoice.component.scss",
  ],
})
export class PrintInputLoadComponent implements OnInit, AfterViewInit {
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
  remainCount: number = 0;
  bottomCell: number = 50;

  public load_title = [];
  public load_member = [];
  public load_node = [];

  public load_data = [];
  public load_break = [];
  public load_typeNum = [];

  public load_titleArray = [];

  public mload: any = [];
  public pload: any = [];

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
    this.load_title = new Array();
    this.load_member = new Array();
    this.load_node = new Array();
    this.load_data = new Array();
    this.load_break = new Array();
    this.load_typeNum = new Array();
    this.load_titleArray = new Array();
    this.mload = new Array();
    this.pload = new Array();
  }

  ngOnInit(): void {
    const inputJson: any = this.printService.inputJson;
    if ("load" in inputJson) {
      const LoadJson: any = this.printService.InputData.load.getLoadJson(); //inputJson.load; // 
      // 実荷重データ
      const tables_actual = this.printLoad(LoadJson);
      this.load_data = tables_actual.tableData;
      this.load_break = tables_actual.break_after;
      this.judge = this.countArea.setCurrentY(
        tables_actual.this,
        tables_actual.last
      );
    } else {
      this.isEnable = false;
    }
  }

  ngAfterViewInit() { }

  // 実荷重データ load 部材荷重 を印刷する
  private printLoad(json): any {
    const keys: string[] = Object.keys(json);

    // 実際のデータを作成する
    let mloadCount: number = 0;
    let ploadCount: number = 0;

    const splidDataTotal: any[] = new Array();

    for (const index of keys) {
      const splidData_node: any[] = new Array();
      const memberTable: any[] = new Array();
      const nodeTable: any[] = new Array();

      let row: number;
      if (index === "1") {
        row = 7;
      } else {
        row = 5;
      }

      const elist = json[index]; // 1テーブル分のデータを取り出す

      // 部材荷重と節点荷重の有無
      if ("load_member" in elist) {
        if (elist["load_member"][0]["m1"] !== void 0) {
          mloadCount = elist.load_member.length;
        }else{
          mloadCount=0;
        }
      } else {
        mloadCount = 0;
      }

      if ("load_node" in elist) {
        ploadCount = elist.load_node.length;
      } else {
        ploadCount = 0;
      }

      // タイトルを表示させる。
      if (mloadCount > 0 || ploadCount > 0) {
        splidDataTotal.push(["Case " + index + ":" + elist.name]);
      }

      // 部材荷重
      this.mload = [];
      if (mloadCount > 0) {
        for (const item of elist.load_member) {
          const line = ["", "", "", "", "", "", "", ""];
          line[0] = item.m1;
          line[1] = item.m2;
          line[2] = item.direction;
          line[3] = item.mark;
          line[4] = item.L1;
          line[5] = item.L2;
          line[6] = item.P1 === null ? "" : item.P1.toFixed(2);
          line[7] = item.P2 === null ? "" : item.P2.toFixed(2);
          this.mload.push(line);
        }
      } else {
        this.mload.push(0);
      }

      // 節点荷重
      this.pload = [];
      if (ploadCount > 0) {
        for (const item of elist.load_node) {
          let tx = this.helper.toNumber(item.tx) !== null ? item.tx : 0;
          let ty = this.helper.toNumber(item.ty) !== null ? item.ty : 0;
          let tz = this.helper.toNumber(item.tz) !== null ? item.tz : 0;
          let rx = this.helper.toNumber(item.rx) !== null ? item.rx : 0;
          let ry = this.helper.toNumber(item.ry) !== null ? item.ry : 0;
          let rz = this.helper.toNumber(item.rz) !== null ? item.rz : 0;

          tx = this.helper.toNumber(item.dx) !== null ? item.dx : tx;
          ty = this.helper.toNumber(item.dy) !== null ? item.dy : ty;
          tz = this.helper.toNumber(item.dz) !== null ? item.dz : tz;
          rx = this.helper.toNumber(item.ax) !== null ? item.ax : rx;
          ry = this.helper.toNumber(item.ay) !== null ? item.ay : ry;
          rz = this.helper.toNumber(item.az) !== null ? item.az : rz;

          const line = ["", "", "", "", "", "", "", ""];
          line[0] = "";
          line[1] = item.n.toString();
          line[2] = tx.toFixed(2);
          line[3] = ty.toFixed(2);
          line[4] = tz.toFixed(2);
          line[5] = rx.toFixed(2);
          line[6] = ry.toFixed(2);
          line[7] = rz.toFixed(2);
          this.pload.push(line);
        }
      } else {
        this.pload.push(0);
      }
      splidDataTotal[Number(index) - 1].push(this.mload, this.pload);
      if (Number(index) === 16) {
        console.log("A")
      }
    }


    return {
      tableData: splidDataTotal, // [タイプ１のテーブルリスト[], タイプ２のテーブルリスト[], ...]
    };
  }
}
