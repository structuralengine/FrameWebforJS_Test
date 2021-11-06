import { Injectable } from "@angular/core";
import { ThreeDisplacementService } from "../../three/geometry/three-displacement.service";
import { ResultCombineDisgService } from "../result-combine-disg/result-combine-disg.service";

@Injectable({
  providedIn: "root",
})
export class ResultDisgService {

  public isCalculated: boolean;
  public disg: any;
  private worker1: Worker;
  private worker2: Worker;
  private columns: any; // 表示用

  constructor(private comb: ResultCombineDisgService,
              private three: ThreeDisplacementService
              ){
    this.clear();
    this.worker1 = new Worker(new URL('./result-disg1.worker', import.meta.url), { name: 'result-disg1', type: 'module' });
    this.worker2 = new Worker(new URL('./result-disg2.worker', import.meta.url), { name: 'result-disg2', type: 'module' });
  }

  public clear(): void {
    this.disg = {};
    this.isCalculated = false;
  }

  public getDisgColumns(typNo: number): any {
    const key: string = typNo.toString();
    return (key in this.columns) ? this.columns[key] : new Array();
  }

    // three-section-force.service から呼ばれる
    public getDisgJson(): object {
      return this.disg;
    }

  public setDisgJson(jsonData: {}, defList: any, combList: any, pickList: any): void {

    const startTime = performance.now(); // 開始時間
    if (typeof Worker !== 'undefined') {
      // Create a new

      this.worker1.onmessage = ({ data }) => {
        if (data.error === null) {
          console.log('変位量の集計が終わりました', performance.now() - startTime);
          this.disg = data.disg;

          // 組み合わせの集計処理を実行する
          this.comb.setDisgCombineJson(this.disg, defList, combList, pickList);
          
          // 変位量テーブルの集計
          this.worker2.onmessage = ({ data }) => {
            if (data.error === null) {
              console.log('変位量テーブルの集計が終わりました', performance.now() - startTime);
              this.columns = data.table;
              this.isCalculated = true;
            } else {
              console.log('変位量テーブルの集計に失敗しました', data.error);
            }
          };
          this.worker2.postMessage({ disg: this.disg });
          this.three.setResultData(this.disg);

        } else {
          console.log('変位量の集計に失敗しました', data.error);
        }
      };
      this.worker1.postMessage({ jsonData });

    } else {
      console.log('変位量の生成に失敗しました');
      // Web workers are not supported in this environment.
      // You should add a fallback so that your program still executes correctly.
    }

  }

}
