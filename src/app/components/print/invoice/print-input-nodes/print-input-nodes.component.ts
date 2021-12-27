import { Component, OnInit } from "@angular/core";
import { AfterViewInit } from "@angular/core";
import { DataCountService } from "../dataCount.service";
import { PrintService } from "../../print.service";
import { DataHelperModule } from "src/app/providers/data-helper.module";

@Component({
  selector: "app-print-input-nodes",
  templateUrl: "./print-input-nodes.component.html",
  styleUrls: [
    "./print-input-nodes.component.scss",
    "../../../../app.component.scss",
    "../invoice.component.scss",
  ],
})
export class PrintInputNodesComponent implements OnInit, AfterViewInit {
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
  bottomCell: number = 88;
  table: HTMLTableElement;
  private thead: HTMLTableElement;
  private tbody: HTMLTableElement;

  public node_dataset = [];
  public node_page = [];

  public judge: boolean;
  public headerShow: boolean;
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
    this.node_dataset = new Array();
    this.node_page = new Array();
  }

  ngOnInit(): void {
    const inputJson: any = this.printService.inputJson;

    if ("node" in inputJson) {
      const tables = this.printNode(inputJson);
      this.node_dataset = tables.splid;
      this.node_page = tables.page;
      this.headerShow = true;
      if (tables.page === 1) {
        this.headerShow = false;
      }
      this.judge = this.countArea.setCurrentY(tables.this, tables.last);
    } else {
      this.isEnable = false;
    }
  }

  ngAfterViewInit() { }

  // 格子点データ node を印刷する
  private printNode(inputJson): any {

    // const minCount: number = 52; // これ以上なら２行書きとする
    let body: any[] = new Array();
    const splid: any[] = new Array();
    let page: number = 0;
    const json: {} = inputJson["node"]; // inputJsonからnodeだけを取り出す
    const keys: string[] = Object.keys(json);
    let row: number = Object.keys(json).length;

    while (1) {
      if (row > this.bottomCell) {
        // 残りの行数が１ページ内で収まらないとき
        for (let i = 0; i < this.bottomCell/2; i++) {
          const line = ["", "", "", "", "", "", "", ""];

          let j = this.bottomCell * page  + i;
          let k = this.bottomCell * page + this.bottomCell / 2 + i;

          const index1: string = keys[j];
          const item1 = json[index1];
          line[0] = index1;
          line[1] = item1.x.toFixed(3);
          line[2] = item1.y.toFixed(3);
          line[3] = item1.z.toFixed(3);

          const index2: string = keys[k];
          const item2 = json[index2];
          line[4] = index2;
          line[5] = item2.x.toFixed(3);
          line[6] = item2.y.toFixed(3);
          line[7] = item2.z.toFixed(3);

          body.push(line);
        }
        splid.push(body);
        body = [];
        row -= this.bottomCell;
        page++;
      } 
      // 残りの行数で１ページ以内に収まりきるとき
      else {
        row = Math.ceil(row / 2);
        for (let i = 0; i < row; i++) {
          const line = ["", "", "", "", "", "", "", ""];

          let j = this.bottomCell * page + i;
          let k = j + row ;

          const index1: string = keys[j];
          const item1 = json[index1];
          line[0] = index1;
          line[1] = item1.x.toFixed(3);
          line[2] = item1.y.toFixed(3);
          line[3] = item1.z.toFixed(3);

          if(keys[k] !== void 0){
          const index2: string = keys[k];
          const item2 = json[index2];
          line[4] = index2;
          line[5] = item2.x.toFixed(3);
          line[6] = item2.y.toFixed(3);
          line[7] = item2.z.toFixed(3);
          }
          body.push(line);
        }
        splid.push(body);
        body = [];
        break;
      }
    }








    //   while (break_flg) {
    //     for (let i = 0; i < this.bottomCell; i++) {
    //       const line = ["", "", "", "", "", "", "", ""];

    //       const j = page * this.bottomCell * 2 + i ;
    //       const s = j + 1;

    //       if (s > keys.length) {
    //         break_flg = false;
    //         // this.countHead = page;
    //         break;
    //       }
    //       const index1: string = keys[j];
    //       const item1 = json[index1];
    //       line[0] = index1;
    //       line[1] = item1.x.toFixed(3);
    //       line[2] = item1.y.toFixed(3);
    //       line[3] = item1.z.toFixed(3);

    //       const k = j + this.bottomCell;

    //       if (k < keys.length) {
    //         const index2: string = keys[k];
    //         const item2 = json[index2];
    //         line[4] = index2;
    //         line[5] = item2.x.toFixed(3);
    //         line[6] = item2.y.toFixed(3);
    //         line[7] = item2.z.toFixed(3);
    //       }
    //       body.push(line);
    //     }
    //     if (body.length === 0) {
    //       break;
    //     }
    //     splid.push(body);
    //     body = [];
    //     page++;
    //   }
    // } else {
    //   this.bottomCell = keys.length / 2;
    //   const n = Math.ceil(this.bottomCell);

    //   for (let i = 0; i < n; i++) {
    //     const line = ["", "", "", "", "", "", "", ""];

    //     const index1: string = keys[i];
    //     const item1 = json[index1];
    //     line[0] = index1;
    //     line[1] = item1.x.toFixed(3);
    //     line[2] = item1.y.toFixed(3);
    //     line[3] = item1.z.toFixed(3);
    //     if (keys.length < n + i + 1) {
    //       line[4] = "";
    //       line[5] = "";
    //       line[6] = "";
    //       line[7] = "";
    //     } else {
    //       const index2: string = keys[n + i];
    //       const item2 = json[index2];
    //       line[4] = index2;
    //       line[5] = item2.x.toFixed(3);
    //       line[6] = item2.y.toFixed(3);
    //       line[7] = item2.z.toFixed(3);
    //     }

    //     body.push(line);
    //   }
    //   splid.push(body);
    // }

    //最後のページの行数だけ取得している
    const lastArray = splid.slice(-1)[0];
    const lastArrayCount = lastArray.length + 2;

    //全部の行数を取得している。
    if (keys.length === 0) {
      this.countHead = 0;
    } else if (keys.length > 0) {
      this.countHead = Math.floor((keys.length / this.bottomCell) * 3) + 3;
    }
    this.countTotal = keys.length + this.countHead;

    return { page, splid, this: this.countTotal, last: lastArrayCount };
  }
}
