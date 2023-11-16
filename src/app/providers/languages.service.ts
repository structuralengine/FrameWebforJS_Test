import { Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { InputFixNodeService } from "../components/input/input-fix-node/input-fix-node.service";
import { DataHelperModule } from "./data-helper.module";
import { ElectronService } from "./electron.service";
import { forkJoin, merge } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class LanguagesService {
  public browserLang: string;
  public languageIndex = {
    ja: "日本語",
    en: "English",
    cn: "中文",
  };

  constructor(
    public translate: TranslateService,
    private inputFixNode: InputFixNodeService,
    public helper: DataHelperModule,
    public electronService: ElectronService
  ) {
    this.browserLang = translate.getBrowserLang();
    translate.use(this.browserLang);
    if (this.electronService.isElectron) {
      this.electronService.ipcRenderer.send("change-lang", this.browserLang);
    }
  }

  public trans(key: string) {
    this.browserLang = key;
    this.translate.use(this.browserLang);
    this.helper.isContentsDailogShow = false;
    this.addHiddenFromElements();
    if (this.electronService.isElectron) {
      this.electronService.ipcRenderer.send("change-lang", this.browserLang);
    }
    this.tranText();
  }

  public tranText() {
   
    // forkJoin(this.translate.use('en'),this.translate.use('cn'),this.translate.use('ja')).subscribe(()=>{
    //   let domElement: any = document.getElementsByClassName("property-name");
    //   for (var i = 0; i < domElement.length; i++) {
    //     let originValue = domElement[i].id;
    //     switch(originValue){
    //       case "3D":{
    //         domElement[i].innerHTML = this.translate.instant('control.3D');
    //         break;
    //       }
    //       case "GridHelper":{
    //         domElement[i].innerHTML = this.translate.instant('control.GridHelper');
    //         break;
    //       }
    //       case "Perspective":{
    //         domElement[i].innerHTML = this.translate.instant('control.Perspective');
    //         break;
    //       }
    //       case "nodeNo":{
    //         domElement[i].innerHTML = this.translate.instant('control.nodeNo');
    //         break;
    //       }
    //       case "memberNo":{
    //         domElement[i].innerHTML = this.translate.instant('control.memberNo');
    //         break;
    //       }
    //       case "nodeScale":{
    //         domElement[i].innerHTML = this.translate.instant('control.nodeScale');
    //         break;
    //       }
    //       case "fixnodeScale":{
    //         domElement[i].innerHTML = this.translate.instant('control.fixnodeScale');
    //         break;
    //       }
    //       case "memberScale":{
    //         domElement[i].innerHTML = this.translate.instant('control.memberScale');
    //         break;
    //       }
    //       case "LoadScale":{
    //         domElement[i].innerHTML = this.translate.instant('control.LoadScale');
    //         break;
    //       }
    //       // case "dispScale":{
    //       //   domElement[i].innerHTML = this.translate.instant('control.');
    //       //   break;
    //       // }
    //       // case "reactScale":{
    //       //   domElement[i].innerHTML = this.translate.instant('control.');
    //       //   break;
    //       // }
    //     }
    //   }
    // })
  }

  private addHiddenFromElements(): void {
    this.addHiddenFromClass(".panel-element-content-container");
    this.addHiddenFromClass("#my_dock_manager");
    this.addHiddenFromClass(".dialog-floating");
  }

  private addHiddenFromClass(selector: string): void {
    const element = document.querySelector(selector);
    if (element) {
      element.classList.add("hidden");
    }
  }
}
