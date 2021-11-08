import { Component, OnInit } from "@angular/core";
import { InputDataService } from "../../../../providers/input-data.service";
import { AfterViewInit } from "@angular/core";
import { DataCountService } from "../dataCount.service";
import { PrintService } from "../../print.service";
import { DataHelperModule } from "src/app/providers/data-helper.module";

@Component({
  selector: "app-print-input-members",
  templateUrl: "./print-input-members.component.html",
  styleUrls: [
    "./print-input-members.component.scss",
    "../../../../app.component.scss",
    "../invoice.component.scss",
  ],
})
export class PrintInputMembersComponent implements OnInit, AfterViewInit {
  isEnable = true;
  load_name: string;
  countCell: number  = 0;
  countHead: number  = 0;
  countTotal: number = 0;
  btnPickup: string;
  tableHeight: number;
  invoiceIds: string[];
  invoiceDetails: Promise<any>[];
  bottomCell: number = 45;

  public member_dataset = [];
  public member_page: number;

  public judge: boolean;
  public dimension: number;

  constructor(
    private InputData: InputDataService,
    private printService: PrintService,
    private countArea: DataCountService,
    private helper: DataHelperModule
  ) {
    this.judge = false;
    this.dimension = this.helper.dimension;
    this.clear();
  }

  public clear(): void {
    this.member_dataset = new Array();
    this.member_page = 0;
  }

  ngOnInit(): void {
    const inputJson: any = this.printService.inputJson;

    if ("member" in inputJson) {
      const tables = this.printMember(inputJson);
      this.member_dataset = tables;
      // this.member_page = tables.page;
      // this.judge = this.countArea.setCurrentY(tables.this, tables.last);
    } else {
      this.isEnable = false;
    }
  }

  ngAfterViewInit() { }

  //要素データ member を印刷する
  private printMember(inputJson): any {
    let body: any[] = new Array();
    const splid: any[] = new Array();
    // let page: number = 0;
    const json: {} = inputJson["member"]; // inputJsonからnodeだけを取り出す
    const keys: string[] = Object.keys(json);

    let break_flg = true;

      for (let i = 0; i <Object.keys(json).length; i++) {

        const line = ["", "", "", "", "", "", ""];
        let index: string = keys[i];

        const item = json[index]; // 1行分のnodeデータを取り出す

        const len: number = this.InputData.member.getMemberLength(index); // 部材長さ
        const name: string = this.InputData.element.getElementName(item.e); // 材料名称

        line[0] = index;
        line[1] = item.ni.toString();
        line[2] = item.nj.toString();
        line[3] = len.toFixed(3);
        line[4] = item.e.toString();
        line[5] = item.cg.toString();
        line[6] = name;

        body.push(line);
      }
    

    // //最後のページの行数だけ取得している
    // const lastArray = splid.slice(-1)[0];
    // const lastArrayCount = lastArray.length + 2;

    // //全部の行数を取得している。
    // this.countTotal = keys.length + this.countHead + 3;

    // return { page, splid, this: this.countTotal, last: lastArrayCount };
    return body;
  }
}
