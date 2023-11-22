import { Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { InputFixNodeService } from "../components/input/input-fix-node/input-fix-node.service";
import { DataHelperModule } from "./data-helper.module";
import { ElectronService } from "./electron.service";

@Injectable({
  providedIn: "root",
})
export class LanguagesService {
  public browserLang: string;
  public languageIndex = {
    ja: "日本語",
    en: "English",
    cn: "中文"
  };

  constructor(
    public translate: TranslateService,
    private inputFixNode: InputFixNodeService,
    public helper: DataHelperModule,
    public electronService: ElectronService,
  ) {
    this.browserLang = translate.getBrowserLang();
    // translate.use(this.browserLang);
    // if (this.electronService.isElectron) {
    //   this.electronService.ipcRenderer.send('change-lang', this.browserLang);
    // }
    translate.use(this.browserLang).subscribe(
      () => {
        this.tranText();
      },
      (error: any) => {
        this.browserLang = 'ja';
        translate.use(this.browserLang).subscribe(() => {
          this.tranText();
        });
        console.log(error);
      }
    );
    if (this.electronService.isElectron) {
      this.electronService.ipcRenderer.send('change-lang', this.browserLang);
    }
  }

  // public trans(key: string) {
  //   this.browserLang = key;
  //   this.translate.use(this.browserLang);
  //   this.helper.isContentsDailogShow = false;
  //   this.addHiddenFromElements();
  //   if (this.electronService.isElectron) {
  //     this.electronService.ipcRenderer.send('change-lang', this.browserLang);
  //   }
  // }

  public trans(key: string) {
    this.browserLang = key;
    this.translate.use(this.browserLang).subscribe(() => {
      this.tranText();
    });
    this.helper.isContentsDailogShow = false;
    this.addHiddenFromElements();
    if (this.electronService.isElectron) {
      this.electronService.ipcRenderer.send('change-lang', this.browserLang);
    }
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
  public tranText() {
    let domElement: any = document.getElementsByClassName('property-name');

    for (var i = 0; i < domElement.length; i++) {
      let originValue = domElement[i].id;
      switch (originValue) {
        case '3D': {
          domElement[i].innerHTML = this.translate.instant('control.3D');
          break;
        }
        case 'GridHelper': {
          domElement[i].innerHTML =
            this.translate.instant('control.GridHelper');
          break;
        }
        case 'Perspective': {
          domElement[i].innerHTML = this.translate.instant(
            'control.Perspective'
          );
          break;
        }
        case 'nodeNo': {
          domElement[i].innerHTML = this.translate.instant('control.nodeNo');
          break;
        }
        case 'memberNo': {
          domElement[i].innerHTML = this.translate.instant('control.memberNo');
          break;
        }
        case 'nodeScale': {
          domElement[i].innerHTML = this.translate.instant('control.nodeScale');
          break;
        }
        case 'fixnodeScale': {
          domElement[i].innerHTML = this.translate.instant(
            'control.fixnodeScale'
          );
          break;
        }
        case 'memberScale': {
          domElement[i].innerHTML = this.translate.instant(
            'control.memberScale'
          );
          break;
        }
        case 'LoadScale': {
          domElement[i].innerHTML = this.translate.instant('control.LoadScale');
          break;
        }
        case 'dispScale': {
          domElement[i].innerHTML = this.translate.instant('control.dispScale');
          break;
        }
        case 'reactScale': {
          domElement[i].innerHTML =
            this.translate.instant('control.reactScale');
          break;
        }
        case 'fixmenberScale': {
          domElement[i].innerHTML = this.translate.instant(
            'control.fixmenberScale'
          );
          break;
        }
        case 'forceScale': {
          domElement[i].innerHTML =
            this.translate.instant('control.forceScale');
          break;
        }
        case 'axialForce': {
          domElement[i].innerHTML =
            this.translate.instant('control.axialForce');
          break;
        }
        case 'meshScale': {
          domElement[i].innerHTML = this.translate.instant('control.meshScale');
          break;
        }
        case 'shearForceX': {
          domElement[i].innerHTML = this.translate.instant(
            'control.shearForceX'
          );
          break;
        }
        case 'shearForceY': {
          domElement[i].innerHTML = this.translate.instant(
            'control.shearForceY'
          );
          break;
        }
        case 'shearForceZ': {
          domElement[i].innerHTML = this.translate.instant(
            'control.shearForceZ'
          );
          break;
        }
        case 'momentX': {
          domElement[i].innerHTML = this.translate.instant('control.momentX');
          break;
        }
        case 'momentY': {
          domElement[i].innerHTML = this.translate.instant('control.momentY');
          break;
        }
        case 'momentZ': {
          domElement[i].innerHTML = this.translate.instant('control.momentZ');
          break;
        }
        case 'torsionalMoment': {
          domElement[i].innerHTML = this.translate.instant(
            'control.torsionalMoment'
          );
          break;
        }
      }
    }
  }
}
