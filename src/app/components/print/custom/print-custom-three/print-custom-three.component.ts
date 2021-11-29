import { Component, OnInit } from "@angular/core";
import { ResultDataService } from "src/app/providers/result-data.service";
import { PrintCustomThreeService } from "./print-custom-three.service";

@Component({
  selector: "app-print-custom-three",
  templateUrl: "./print-custom-three.component.html",
  styleUrls: [
    "../../../../app.component.scss",
    "./print-custom-three.component.scss",
    "../print-custom.component.scss",
  ],
})
export class PrintCustomThreeComponent implements OnInit {
  constructor(
    public printCustomThreeService: PrintCustomThreeService,
    public ResultData: ResultDataService
  ) {}

  ngOnInit(): void {
    // this.printCustomThreeService.clear();
  }
}
