import { Component, OnInit } from "@angular/core";
import { PrintService } from "../print.service";

@Component({
  selector: "app-print-custom",
  templateUrl: "./print-custom.component.html",
  styleUrls: ["./print-custom.component.scss", "../print.component.scss"],
})
export class PrintCustomComponent implements OnInit {
  // public flg: number;

  constructor(public printService: PrintService) {}

  ngOnInit(): void {
    this.onSelectChange("0");
  }

  public onSelectChange(value) {
    this.printService.flg = Number(value);
    //  let v = parseInt(value);
    //  const data = this.fileIndex.FEMlist[v - 1];
    //  this.InputData.initModel(data.file);　//FemMainServiceのinitModel()にdata.fileを送る
  }
}
