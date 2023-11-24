import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class PresetService {
  public dataPreset: any[] = [];
  public fileSelected : any;
  public presetLink = "./assets/preset/";
  constructor(
  ) {
    this.fileSelected = {};
  }

  public isDisabled : boolean = true;

  bindData(){
    this.dataPreset = [];
    this.dataPreset.push({
      title: "3DTest03_A",
      fileThumb: this.presetLink + "thumbnail-image/3DTest03_A.png",
      fileName: "3DTest03_A.json",
      order: 1,
    });
    this.dataPreset.push({
      title: "Concrete T-beam bridge",
      fileThumb: this.presetLink + "thumbnail-image/ConcreteT-beam.png",
      fileName: "ConcreteT-beam.json",
      order: 2,
    });
    this.dataPreset.push({
      title: "U-shaped retaining wall",
      fileThumb: this.presetLink + "thumbnail-image/U-shapedWall.png",
      fileName: "U-shapedWall.json",
      order: 3,
    });
    this.dataPreset.push({
      title: "Portal bracing",
      fileThumb: this.presetLink + "thumbnail-image/PortalBracing.png",
      fileName: "PortalBracing.json",
      order: 4,
    });
  }

  sortBy(prop: string) {
    return this.dataPreset.sort((a, b) =>
      a[prop] > b[prop] ? 1 : a[prop] === b[prop] ? 0 : -1
    );
  }
  selectRadio(item: any){
    this.fileSelected = {};
    this.fileSelected = {...item};
    this.isDisabled = false;
  }
}
