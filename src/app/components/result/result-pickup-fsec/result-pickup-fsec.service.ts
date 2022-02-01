import { Injectable } from "@angular/core";
import { ThreeSectionForceService } from "../../three/geometry/three-section-force/three-section-force.service";

@Injectable({
  providedIn: "root",
})
export class ResultPickupFsecService {
  public fsecPickup: any;
  public value_range: any;
  public isCalculated: boolean;
  private worker1: Worker;
  private worker2: Worker;
  public fsecKeys3D = [
    "fx_max",
    "fx_min",
    "fy_max",
    "fy_min",
    "fz_max",
    "fz_min",
    "mx_max",
    "mx_min",
    "my_max",
    "my_min",
    "mz_max",
    "mz_min",
  ];
  public fsecKeys2D = [
    "fx_max",
    "fx_min",
    "fy_max",
    "fy_min",
    "mz_max",
    "mz_min",
  ];
  public titles3D = [
    "軸方向力 最大",
    "軸方向力 最小",
    "y方向のせん断力 最大",
    "y方向のせん断力 最小",
    "z方向のせん断力 最大",
    "z方向のせん断力 最小",
    "ねじりモーメント 最大",
    "ねじりモーメント 最小",
    "y軸回りの曲げモーメント 最大",
    "y軸回りの曲げモーメント力 最小",
    "z軸回りの曲げモーメント 最大",
    "z軸回りの曲げモーメント 最小",
  ];
  public titles2D = [
    "軸方向力 最大",
    "軸方向力 最小",
    "y方向のせん断力 最大",
    "y方向のせん断力 最小",
    "z軸回りの曲げモーメント 最大",
    "z軸回りの曲げモーメント 最小",
  ];
  public fsecKeys = this.fsecKeys3D || this.fsecKeys2D;
  public titles = this.titles3D || this.titles2D;
  private columns: any;

  constructor(private three: ThreeSectionForceService) {
    this.clear();
    this.isCalculated = false;
    this.worker1 = new Worker(
      new URL("./result-pickup-fsec1.worker", import.meta.url),
      { name: "pickup-fsec1", type: "module" }
    );
    this.worker2 = new Worker(
      new URL("./result-pickup-fsec2.worker", import.meta.url),
      { name: "pickup-fsec2", type: "module" }
    );
  }

  public clear(): void {
    this.fsecPickup = {};
  }

  // three.js から呼ばれる
  public getFsecJson(): object {
    return this.fsecPickup;
  }

  public getPickupFsecColumns(combNo: number, mode: string): any {
    return this.columns[combNo][mode];
  }

  public setFsecPickupJson(pickList: any, fsecCombine: any): void {
    this.isCalculated = false;
    const startTime = performance.now(); // 開始時間
    if (typeof Worker !== "undefined") {
      // Create a new
      this.worker1.onmessage = ({ data }) => {
        console.log(
          "断面力fsec の ピックアップ PickUp 集計が終わりました",
          performance.now() - startTime
        );
        this.fsecPickup = data.fsecPickup;
        const max_values = data.max_values;
        this.value_range = data.value_range;

        // 断面力テーブルの集計
        this.worker2.onmessage = ({ data }) => {
          console.log(
            "断面fsec の ピックアップ PickUp テーブル集計が終わりました",
            performance.now() - startTime
          );
          this.columns = data.result;
          this.isCalculated = true;
        };
        // this.columns = this.worker2_test(this.fsecPickup );
        this.worker2.postMessage({ fsecPickup: this.fsecPickup });
        this.three.setPickupResultData(this.fsecPickup, max_values, this.value_range);
      };
      this.worker1.postMessage({ pickList, fsecCombine });
      // this.worker1_test({ pickList, fsecCombine });
    } else {
      // Web workers are not supported in this environment.
      // You should add a fallback so that your program still executes correctly.
    }
  }

  private worker1_test(data) {
  }
}
