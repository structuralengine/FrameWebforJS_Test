import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Component, OnInit } from "@angular/core";
import html2canvas from "html2canvas";
import { InputDataService } from "src/app/providers/input-data.service";
import { ResultDataService } from "src/app/providers/result-data.service";
import { ThreeService } from "../three/three.service";
import { PrintService } from "./print.service";
import printJS from "print-js";
import * as FileSaver from "file-saver";
import { DataHelperModule } from "src/app/providers/data-helper.module";
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
  constructor(
    public InputData: InputDataService,
    public printService: PrintService,
    public ResultData: ResultDataService,
    private three: ThreeService,
    private http: HttpClient,
    private helper: DataHelperModule,
    private modalService: NgbModal
  ) {}

  ngOnInit() {
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
      // データを取得
      let json = {};
      if (
        this.printService.contentEditable1[0] &&
        Object.keys(this.InputData.getInputJson(1)).length !== 0
      ) {
        json = this.InputData.getInputJson(1);
      }
      if (this.ResultData.isCalculated == true) {
        if (
          this.printService.contentEditable1[1] &&
          Object.keys(this.ResultData.disg.disg).length !== 0
        ) {
          json["disg"] = this.ResultData.disg.disg;
          this.getNames(json["disg"], "basic");
        }
        if (
          this.printService.contentEditable1[2] &&
          Object.keys(this.ResultData.combdisg.disgCombine).length !== 0
        ) {
          json["disgCombine"] = this.ResultData.combdisg.disgCombine;
          this.getNames(json["disgCombine"], "comb");
        }
        if (
          this.printService.contentEditable1[3] &&
          Object.keys(this.ResultData.pickdisg.disgPickup).length !== 0
        ) {
          json["disgPickup"] = this.ResultData.pickdisg.disgPickup;
          this.getNames(json["disgPickup"], "pick");
        }
        if (
          this.printService.contentEditable1[7] &&
          Object.keys(this.ResultData.fsec.fsec).length !== 0
        ) {
          json["fsec"] = this.ResultData.fsec.fsec;
          this.getNames(json["fsec"], "basic");
        }
        if (
          this.printService.contentEditable1[8] &&
          Object.keys(this.ResultData.combfsec.fsecCombine).length !== 0
        ) {
          json["fsecCombine"] = this.ResultData.combfsec.fsecCombine;
          this.getNames(json["fsecCombine"], "comb");
        }
        if (
          this.printService.contentEditable1[9] &&
          Object.keys(this.ResultData.pickfsec.fsecPickup).length !== 0
        ) {
          json["fsecPickup"] = this.ResultData.pickfsec.fsecPickup;
          this.getNames(json["fsecPickup"], "pick");
        }
        if (
          this.printService.contentEditable1[4] &&
          Object.keys(this.ResultData.reac.reac).length !== 0
        ) {
          json["reac"] = this.ResultData.reac.reac;
          this.getNames(json["reac"], "reac");
        }
        if (
          this.printService.contentEditable1[5] &&
          Object.keys(this.ResultData.combreac.reacCombine).length !== 0
        ) {
          json["reacCombine"] = this.ResultData.combreac.reacCombine;
          this.getNames(json["reacCombine"], "comb");
        }
        if (
          this.printService.contentEditable1[6] &&
          Object.keys(this.ResultData.pickreac.reacPickup).length !== 0
        ) {
          json["reacPickup"] = this.ResultData.pickreac.reacPickup;
          this.getNames(json["reacPickup"], "pick");
        }
      }

      if (Object.keys(json).length === 0) {
        alert("データが存在しないため，印刷できませんでした．");
        return;
      }

      json["dimension"] = this.helper.dimension;

      // resultデータの印刷
      // const blob = new window.Blob([JSON.stringify(json)], {
      //   type: "text/plain",
      // });
      // FileSaver.saveAs(blob, "test.json");

      const modalRef = this.modalService.open(WaitDialogComponent);

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
          modalRef.close();
        });
    }
  }

  private getNames(jsonData, target) {
    const keys: string[] = Object.keys(jsonData);
    this.getNamesAll(target);

    for (const index of keys) {
      let loadName = "";
      switch (target) {
        case "basic":
          let l: any = this.InputData.load.getLoadNameJson(null, index);
          if (index in l) {
            loadName = l[index].name;
          }
          break;
        case "comb":
          if (index in this.combineJson) {
            if ("name" in this.combineJson[index]) {
              loadName = this.combineJson[index].name;
            }
          }
          break;
        case "pick":
          if (index in this.pickupJson) {
            if ("name" in this.pickupJson[index]) {
              loadName = this.pickupJson[index].name;
            }
          }
          break;
      }
      jsonData[index]["name"] = ["Case." + index, loadName];
    }
  }

  private getNamesAll(target) {
    switch (target) {
      case "comb":
        this.combineJson = this.InputData.combine.getCombineJson();
        break;
      case "pick":
        this.pickupJson = this.InputData.pickup.getPickUpJson();
        break;
    }
  }

  private showPDF(base64: string) {
    printJS({ printable: base64, type: "pdf", base64: true });
  }
}
