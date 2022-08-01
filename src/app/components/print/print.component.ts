import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { InputDataService } from "src/app/providers/input-data.service";
import { ResultDataService } from "src/app/providers/result-data.service";
import { ThreeService } from "../three/three.service";
import { PrintService } from "./print.service";
import printJS from "print-js";
import * as pako from "pako";
import { ElectronService } from "ngx-electron";
import { MaxMinService } from "../three/max-min/max-min.service";
import { DataHelperModule } from "src/app/providers/data-helper.module";

@Component({
  selector: "app-print",
  templateUrl: "./print.component.html",
  styleUrls: ["./print.component.scss", "../../app.component.scss"],
})
export class PrintComponent implements OnInit, OnDestroy {
  public contentEditable2;
  public combineJson: any;
  public pickupJson: any;
  public id;
  private url = "https://frameprintpdf.azurewebsites.net/api/Function1";

  constructor(
    public InputData: InputDataService,
    public printService: PrintService,
    public ResultData: ResultDataService,
    private three: ThreeService,
    private http: HttpClient,
    public max_min: MaxMinService,
    public electronService: ElectronService,
    private helper: DataHelperModule
  ) {}

  private a: boolean;
  ngOnInit() {
    this.printService.selectRadio(0);
    this.printService.flg = 0;
    this.id = document.getElementById("printButton");
    this.a = this.max_min.visible;
    this.max_min.visible = false;
  }

  ngOnDestroy(): void {
    this.max_min.visible = this.a;
  }

  public options = {
    headers: new HttpHeaders({
      "Content-Type": "application/json",
      responseType: 'text',
      Accept: "*/*",
    }),
  };

  public onPrintPDF(): void {

    if (this.printService.optionList['captur'].value ) {
      // 画面印刷
      if( this.helper.dimension === 2 && 
        ( this.three.mode=='fsec' || this.three.mode==='comb_fsec' || this.three.mode==='pick_fsec')){

        // loadingの表示
        this.loadind_enable();

        // データの集計
        this.printService.optionList['input'].value = true;
        this.printService.optionList[this.three.mode].value = true;
        this.printService.getPrintDatas();

        // PDFサーバーに送る
        const json = {};
        for(var key of ["node", "member", "load", "dimension", "language"] ){
          json[key] = this.printService.json[key];
        }
        json[this.three.mode] = this.printService.json[this.three.mode];
        const output = [];
        if(this.printService.customThree.threeEditable[5])
          output.push("mz");
        if(this.printService.customThree.threeEditable[1])
          output.push("fy");
        if(this.printService.customThree.threeEditable[0])
          output.push("fx");
        output.push("disg");
        json["diagramResult"] = {
          layout: this.printService.customThree.print2DThreeLayout,
          output
        }
        const base64Encoded = this.getPostJson(json);
        this.pdfPreView(base64Encoded);


      } else {
        // 3D図の印刷
        this.three.getCaptureImage().then((print_target) => {
          this.printService.print_target = print_target;
          this.printService.printDocument("invoice", [""]);
        });
      }

    } else {

      const json = this.printService.json;
      if (Object.keys(json).length !== 0) {
        // loadingの表示
        this.loadind_enable();
        // PDFサーバーに送る
        this.pdfPreView(this.getPostJson(json));
      }
    }
  }

  private pdfPreView(base64Encoded: string): void{

    this.http
    .post(this.url, base64Encoded, this.options)
    .subscribe(
      (response) => {
        this.showPDF(response.toString());
      },
      (err) => {
        try{
          if ("error" in err) {
            if ("text" in err.error) {
              this.showPDF(err.error.text.toString());
              return;
            }
          }
        } catch(e) { }
        this.loadind_desable();
        alert(err['message']);
      }
    );
  }

  private getPostJson(json: any): string{
    const jsonStr = JSON.stringify(json);

    // pako を使ってgzip圧縮する
    const compressed = pako.gzip(jsonStr);
    //btoa() を使ってBase64エンコードする
    const base64Encoded = btoa(compressed);

    return base64Encoded
  }

  private loadind_enable(): void {
      // loadingの表示
      document.getElementById("print-loading").style.display = "block";
      this.id.setAttribute("disabled", "true");
      this.id.style.opacity = "0.7";  
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
      window.open(fileURL, "_blank");

    } else {
      //Webアプリの場合
      printJS({ printable: base64, type: "pdf", base64: true });
    }

  }
}
