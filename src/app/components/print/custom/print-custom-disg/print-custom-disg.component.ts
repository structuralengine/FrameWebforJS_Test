import { Component, OnInit } from "@angular/core";
import { PrintService } from "../../print.service";
import { PrintCustomDisgService } from "./print-custom-disg.service";

@Component({
  selector: "app-print-custom-disg",
  templateUrl: "./print-custom-disg.component.html",
  styleUrls: [
    "./print-custom-disg.component.scss",
    "../print-custom.component.scss",
  ],
})
export class PrintCustomDisgComponent implements OnInit {
  constructor(
    public printCustomDisgService: PrintCustomDisgService,
    public printService: PrintService
  ) {}

  ngOnInit(): void {}
}
