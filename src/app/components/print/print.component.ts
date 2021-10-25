import { Component, OnInit } from "@angular/core";
import html2canvas from "html2canvas";
import { ResultDataService } from "src/app/providers/result-data.service";
import { ThreeService } from "../three/three.service";
import { PrintCustomThreeService } from "./custom/print-custom-three/print-custom-three.service";
import { PrintService } from "./print.service";

@Component({
  selector: "app-print",
  templateUrl: "./print.component.html",
  styleUrls: ["./print.component.scss", "../../app.component.scss"],
})
export class PrintComponent implements OnInit {
  public contentEditable2;

  constructor(
    public printService: PrintService,
    public ResultData: ResultDataService,
    private three: ThreeService,
    private customThree: PrintCustomThreeService
  ) {}

  ngOnInit(): void {}

  public onPrintInvoice() {
    this.printService.setprintDocument();

    if (this.printService.contentEditable1[10]) {
      // 図の印刷
      this.contentEditable2 = this.customThree.contentEditable2;
      this.three.getCaptureImage().then((print_target) => {
        this.printService.print_target = print_target;
        this.printService.printDocument("invoice", [""]);
      });
    } else {
      this.printService.printDocument("invoice", [""]);
    }
  }
}
