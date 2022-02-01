import { Injectable } from '@angular/core';
import { ThreeDisplacementService } from '../../three/geometry/three-displacement.service';

@Injectable({
  providedIn: 'root'
})
export class ResultPickupDisgService {

  public disgPickup: any;
  public value_range: any;
  public isCalculated: boolean;
  private worker1: Worker;
  private worker2: Worker;
  private columns: any;

  constructor(private three: ThreeDisplacementService) { 
    this.clear();
    this.isCalculated = false;
    this.worker1 = new Worker(new URL('./result-pickup-disg1.worker', import.meta.url), { name: 'pickup-disg1', type: 'module' });
    this.worker2 = new Worker(new URL('./result-pickup-disg2.worker', import.meta.url), { name: 'pickup-disg2', type: 'module' });
  }

  public clear(): void {
    this.disgPickup = {};
  }

  // three.js から呼ばれる
  public getFsecJson(): object {
    return this.disgPickup;
  }

  public getPickupDisgColumns(combNo: number, mode: string): any {
    return this.columns[combNo][mode];
  }

  public setDisgPickupJson(pickList: any, disgCombine: any): void {

    this.isCalculated = false;
    const startTime = performance.now(); // 開始時間
    if (typeof Worker !== 'undefined') {
      // Create a new
      this.worker1.onmessage = ({ data }) => {
        this.disgPickup = data.disgPickup;
        this.value_range = data.value_range;
        console.log('変位disg の ピックアップ PickUp 集計が終わりました', performance.now() - startTime);

        // 断面力テーブルの集計
        this.worker2.onmessage = ({ data }) => {
          console.log('変位disg の ピックアップ PickUp テーブル集計が終わりました', performance.now() - startTime);
          this.columns = data.result;
          this.isCalculated = true;
        };
        this.worker2.postMessage({ disgPickup: this.disgPickup });
        this.three.setCombPickResultData(this.value_range, 'pik_disg');

      };
      this.worker1.postMessage({ pickList, disgCombine});
      //const a = this.worker1_test({ pickList, disgCombine});
    } else {
      // Web workers are not supported in this environment.
      // You should add a fallback so that your program still executes correctly.
    }

  }

  private worker1_test (data) {
  }
    // postMessage({ disgPickup, value_range });
  // });
}
