import { Component, OnInit } from "@angular/core";
import html2canvas from "html2canvas";
import { ResultDataService } from "src/app/providers/result-data.service";
import { ThreeService } from "../three/three.service";
import { PrintService } from "./print.service";

@Component({
  selector: "app-print",
  templateUrl: "./print.component.html",
  styleUrls: ["./print.component.scss", "../../app.component.scss"],
})
export class PrintComponent implements OnInit {

  constructor(
    public printService: PrintService,
    public ResultData: ResultDataService,
    private three: ThreeService
  ) {
  }

  ngOnInit(): void {}

  public onPrintInvoice() {

    if(this.printService.contentEditable1[10]){
      // 図の印刷
      this.three.getCaptureImage().then(imgs =>{
        this.printService.imgList = imgs;
        this.printService.printDocument("invoice", [""]);
      })

    } else {
      this.printService.printDocument("invoice", [""]);
    }
  }
}
