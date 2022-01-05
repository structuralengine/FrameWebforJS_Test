import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import html2canvas from "html2canvas";
import { InputDataService } from "src/app/providers/input-data.service";
import { ResultDataService } from "src/app/providers/result-data.service";
import { ThreeService } from "../three/three.service";
import { PrintService } from "./print.service";
import printJS from 'print-js'


@Component({
  selector: "app-print",
  templateUrl: "./print.component.html",
  styleUrls: ["./print.component.scss", "../../app.component.scss"],
})
export class PrintComponent implements OnInit {
  public contentEditable2;

  constructor(
    public InputData: InputDataService,
    public printService: PrintService,
    public ResultData: ResultDataService,
    private three: ThreeService,
    private http: HttpClient
  ) {}

  ngOnInit(){
    this.printService.selectRadio(-1);
    this.printService.flg = -1;
  }

  public onPrintInvoice() {
    this.printService.setprintDocument();

    if (this.printService.contentEditable1[10]) {
      // 図の印刷
      this.three.getCaptureImage().then((print_target) => {
        this.printService.print_target = print_target;
        this.printService.printDocument("invoice", [""]);
      });
    } else {
      this.printService.printDocument("invoice", [""]);
    }
  }

  public onPrintPDF(): void {
    if (this.printService.contentEditable1[10]) {
      // 図の印刷
      this.three.getCaptureImage().then((print_target) => {
        this.printService.print_target = print_target;
        this.printService.printDocument("invoice", [""]);
      });
    } else {
      // データを取得
      const inputJson = this.InputData.getInputJson(1);

      // PDFサーバーに送る
      const json = {"body": JSON.stringify(inputJson)};
      const url = 'https://vprk48kosh.execute-api.ap-northeast-1.amazonaws.com/default/FramePrintPDF';

      this.http.post(url, json, {
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        })
      }).subscribe(
        (response) => {
          this.showPDF(response.toString());
        },
        (err) => {
          if('error' in err){
            if('text' in err.error){
              this.showPDF(err.error.text.toString());
              return;
            }
          }
        }
      );

    }
  }

  private showPDF(base64: string){
    printJS({printable: base64, type: 'pdf', base64: true});
  }

}
