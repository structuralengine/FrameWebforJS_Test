import { Component, OnInit } from "@angular/core";
import { InputDataService } from "../../../../providers/input-data.service";
import { AfterViewInit } from "@angular/core";
import { DataCountService } from "../dataCount.service";
import { PrintService } from "../../print.service";
import { InputPickupService } from "src/app/components/input/input-pickup/input-pickup.service";

@Component({
  selector: "app-print-input-pickup",
  templateUrl: "./print-input-pickup.component.html",
  styleUrls: [
    "./print-input-pickup.component.scss",
    "../../../../app.component.scss",
    "../invoice.component.scss",
  ],
})
export class PrintInputPickupComponent implements OnInit, AfterViewInit {
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

  public pickup_dataset = [];

  public judge: boolean;

  constructor(
    private printService: PrintService,
    private countArea: DataCountService,
    private pickup: InputPickupService
  ) {
    this.judge = false;
    this.clear();
  }

  public clear(): void {
    this.pickup_dataset = new Array();
  }

  ngOnInit(): void {
    const pickupJson: any = this.pickup.getPickUpJson();
    if (Object.keys(pickupJson).length > 0) {
      const tables = this.printPickup(pickupJson);
      this.pickup_dataset = tables;
    } else {
      this.isEnable = false;
    }
  }

  ngAfterViewInit() {}

  // PICKUEデータ  を印刷する
  private printPickup(json): any {
    const keys: string[] = Object.keys(json);
    let body: any[] = new Array();
    const splid: any[] = new Array();
    let row: number;

    for (const index of keys) {
      const item = json[index]; // 1行分のnodeデータを取り出す

      // 印刷する1行分のリストを作る
      let line: string[] = new Array();
      line.push(index); // PickUpNo
      if ("name" in item) {
        line.push(item.name); // 荷重名称
      } else {
        line.push("");
      }

      let counter: number = 0;
      for (const key of Object.keys(item)) {
        if (!key.startsWith("C")) {
          continue;
        }
        line.push(item[key]);
        counter += 1;
        if (counter === 10) {
          body.push(line); // 表の1行 登録
          counter = 0;
          line = new Array();
          line.push(""); // PickUpNo
          line.push(""); // 荷重名称
          row++;
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
