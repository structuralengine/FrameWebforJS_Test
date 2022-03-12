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
import { ElectronService } from "ngx-electron";

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
    private modalService: NgbModal,
    public electronService: ElectronService,
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
      responseType: 'text',
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
              this.loadind_desable();
              alert(err);
            }
          );
      }
    }
  }

  // finally的な処理
  // loadingの表示終了
  private loadind_desable() {
    document.getElementById("print-loading").style.display = "none";
    const id = document.getElementById("printButton");
    this.id.removeAttribute("disabled");
    this.id.style.opacity = "";
  }

  private showPDF(base64: string) {
    this.loadind_desable();

    if(this.electronService.isElectronApp) {
      // electron の場合
      const byteCharacters = atob(base64);
      let byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      let byteArray = new Uint8Array(byteNumbers);
      let file = new Blob([byteArray], {type: 'application/pdf;base64'});
      let fileURL = URL.createObjectURL(file);
      this.electronService.ipcRenderer.sendSync('printPDF', fileURL);

    } else {
      //Webアプリの場合
      printJS({ printable: base64, type: "pdf", base64: true });
    }

  }
}
