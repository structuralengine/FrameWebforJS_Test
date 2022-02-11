import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import html2canvas from "html2canvas";
import { InputDataService } from "src/app/providers/input-data.service";
import { ResultDataService } from "src/app/providers/result-data.service";
import { ThreeService } from "../three/three.service";
import { PrintService } from "./print.service";
import printJS from "print-js";
import * as FileSaver from "file-saver";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { WaitDialogComponent } from "../wait-dialog/wait-dialog.component";
import * as pako from "pako";
import { throwIfEmpty } from "rxjs/operators";

@Component({
  selector: "app-print",
  templateUrl: "./print.component.html",
  styleUrls: ["./print.component.scss", "../../app.component.scss"],
})
export class PrintComponent implements OnInit {
  public contentEditable2;
  public combineJson: any;
  public pickupJson: any;
  public id;
  constructor(
    public InputData: InputDataService,
    public printService: PrintService,
    public ResultData: ResultDataService,
    private three: ThreeService,
    private http: HttpClient,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
    this.printService.selectRadio(0);
    this.printService.flg = 0;
    this.id = document.getElementById("printButton");
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

  public options = {
    headers: new HttpHeaders({
      "Content-Type": "application/json",
      Accept: "*/*",
    }),
  };

  public onPrintPDF(): void {
    if (this.printService.contentEditable1[10]) {
      // 図の印刷
      this.three.getCaptureImage().then((print_target) => {
        this.printService.print_target = print_target;
        this.printService.printDocument("invoice", [""]);
      });
    } else {
      const json = this.printService.json;
      if (Object.keys(json).length !== 0) {
        // resultデータの印刷
        // const blob = new window.Blob([JSON.stringify(json)], {
        //   type: "text/plain",
        // });
        // FileSaver.saveAs(blob, "test.json");

        // loadingの表示
        document.getElementById("print-loading").style.display = "block";
        this.id.setAttribute("disabled", "true");
        this.id.style.opacity = "0.7";

        // PDFサーバーに送る
        const url = "https://frameprintpdf.azurewebsites.net/api/Function1";

        const jsonStr = JSON.stringify(json);

        // pako を使ってgzip圧縮する
        const compressed = pako.gzip(jsonStr);
        //btoa() を使ってBase64エンコードする
        const base64Encoded = btoa(compressed);

        this.http
          .post(url, base64Encoded, this.options)
          .subscribe(
            (response) => {
              this.showPDF(response.toString());
            },
            (err) => {
              if ("error" in err) {
                if ("text" in err.error) {
                  this.showPDF(err.error.text.toString());
                  return;
                }
              }
              alert(err);
            }
          )
          .add(() => {
            // finally的な処理
            // loadingの表示終了
            document.getElementById("print-loading").style.display = "none";
            const id = document.getElementById("printButton");
            this.id.removeAttribute("disabled");
            this.id.style.opacity = "";
          });
      }
    }
  }

  private showPDF(base64: string) {
    printJS({ printable: base64, type: "pdf", base64: true });
  }
}
