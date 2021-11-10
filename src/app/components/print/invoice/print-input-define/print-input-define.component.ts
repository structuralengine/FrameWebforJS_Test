import { Component, OnInit } from "@angular/core";
import { AfterViewInit } from "@angular/core";
import { DataCountService } from "../dataCount.service";
import { PrintService } from "../../print.service";
import { InputDefineService } from "src/app/components/input/input-define/input-define.service";

@Component({
  selector: "app-print-input-define",
  templateUrl: "./print-input-define.component.html",
  styleUrls: [
    "./print-input-define.component.scss",
    "../../../../app.component.scss",
    "../invoice.component.scss",
  ],
})
export class PrintInputDefineComponent implements OnInit, AfterViewInit {
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
  bottomCell: number = 50;

  public define_dataset = [];

  public judge: boolean;

  constructor(private define: InputDefineService) {
    this.judge = false;
    this.clear();
  }

  public clear(): void {
    this.define_dataset = new Array();
  }

  ngOnInit(): void {
    const defineJson: any = this.define.getDefineJson();
    if (Object.keys(defineJson).length > 0) {
      const tables = this.printDefine(defineJson);
      this.define_dataset = tables;
    } else {
      this.isEnable = false;
    }
  }

  ngAfterViewInit() {}

  // DEFINEデータ  を印刷する
  private printDefine(json): any {
    let body: any[] = new Array();

    const splid: any[] = new Array();
    for (const index of Object.keys(json)) {
      const item = json[index]; // 1行分のnodeデータを取り出す

      // 印刷する1行分のリストを作る
      let line: string[] = new Array();
      // line.push(index); // DefineNo
      let counter: number = 0;
      let kk = Object.keys(item);
      const iid = kk[0];
      line.push(item[iid]);
      kk.sort();

      for (let ii = 0; ii < kk.length - 1; ii++) {
        const key = kk[ii];
        //  if (key === 'row') { continue; }
        line.push(item[key]);
        counter += 1;
        if (counter === 10) {
          body.push(line); // 表の1行 登録
          counter = 0;
          line = new Array();
          line.push(""); // DefineNo
        }
      }
      if (counter > 0) {
        body.push(line); // 表の1行 登録
      }
    }
    if (body.length > 0) {
      splid.push(body);
    }

    return splid;
  }
}
