import { Component, OnInit } from "@angular/core";
import { InputDataService } from "../../../../providers/input-data.service";
import { AfterViewInit } from "@angular/core";
import { DataCountService } from "../dataCount.service";


@Component({
  selector: "app-print-input-load-name",
  templateUrl: "./print-input-load-name.component.html",
  styleUrls: [
    "./print-input-load-name.component.scss",
    "../../../../app.component.scss",
    "../invoice.component.scss",
  ],
})
export class PrintInputLoadNameComponent implements OnInit {
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
  empty: number;
  bottomCell: number = 40;

  public loadName_dataset = [];
  public loadName_page = [];

  public judge: boolean;

  constructor(
    private InputData: InputDataService,
    private countArea: DataCountService
  ) {
    this.judge = false;
    this.clear();
  }

  public clear(): void {
    this.loadName_dataset = new Array();
    this.loadName_page = new Array();
  }

  ngOnInit(): void {
    const inputJson: any = this.InputData.getInputJson(0);
    const LoadNameJson: any = this.InputData.load.getLoadNameJson();
    if (Object.keys(LoadNameJson).length > 0) {
      // 基本荷重データ
      const tables_basic = this.printLoadName(LoadNameJson);
      this.loadName_dataset = tables_basic;
  
      // this.countArea.setData(tables_basic.empty);
    } else {
      this.isEnable = false;
    }
  }

  ngAfterViewInit() { }

  // 基本荷重データ load name を印刷する
  private printLoadName(json): any {
    let body: any[] = new Array();
    const splid: any[] = new Array();
    let page: number = 0;
    const keys: string[] = Object.keys(json);

    let break_flg = true;

    for (let i = 0; i < Object.keys(json).length; i++) {
      const line = ["", "", "", "", "", ""];
      let index: string = keys[i];
      const item = json[index]; // 1行分のnodeデータを取り出す

      const rate: number = item.rate !== null ? item.rate : 1;
      const fix_node: number = item.fix_node !== null ? item.fix_node : 1;
      const fix_member: number =
        item.fix_member !== null ? item.fix_member : 1;
      const element: number = item.element !== null ? item.element : 1;
      const joint: number = item.joint !== null ? item.joint : 1;

      line[0] = index;
      line[1] = rate.toFixed(4);
      line[2] = item.symbol;
      line[3] = item.name;
      line[4] = fix_node.toString();
      line[5] = fix_member.toString();
      line[6] = element.toString();
      line[7] = joint.toString();

      body.push(line);
    }


    return body;
  }
}
