import { Component, OnInit } from "@angular/core";
import { PrintService } from "../print.service";
import { DataCountService } from "./dataCount.service";
import { AfterViewInit } from "@angular/core";

@Component({
  selector: "app-invoice",
  templateUrl: "./invoice.component.html",
  styleUrls: ["./invoice.component.scss", "../../../app.component.scss"],
})
export class InvoiceComponent implements OnInit, AfterViewInit {
    constructor(
      public printService: PrintService,
      private countArea: DataCountService) { }

  ngOnInit() {
    this.countArea.clear();
  }

  ngAfterViewInit() {
    this.printService.onDataReady();
  }

}
