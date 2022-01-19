import { Component, OnInit } from "@angular/core";
import { PrintService } from "../../print.service";
import { PrintCustomReacService } from "./print-custom-reac.service";

@Component({
  selector: "app-print-custom-reac",
  templateUrl: "./print-custom-reac.component.html",
  styleUrls: [
    "./print-custom-reac.component.scss",
    "../print-custom.component.scss",
  ],
})
export class PrintCustomReacComponent implements OnInit {
  constructor(
    public printCustomReacService: PrintCustomReacService,
    public printService: PrintService
  ) {}

  ngOnInit(): void {
    // this.printCustomReacService.clear();
  }
}
