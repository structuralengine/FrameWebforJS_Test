import { Injectable } from '@angular/core';
import { ResultDisgService } from '../result-disg/result-disg.service';
import { ResultPickupDisgService } from '../result-pickup-disg/result-pickup-disg.service';
import { ThreeDisplacementService } from '../../three/geometry/three-displacement.service';
import { DataHelperModule } from '../../../providers/data-helper.module';
import { data } from 'jquery';

@Injectable({
  providedIn: 'root'
})
export class ResultCombineDisgService {

  public disgCombine: any;
  public value_range: any;
  public isCalculated: boolean;
  private worker1: Worker;
  private worker2: Worker;
  public disgKeys3D = [
    "dx_max",
    "dx_min",
    "dy_max",
    "dy_min",
    "dz_max",
    "dz_min",
    "rx_max",
    "rx_min",
    "ry_max",
    "ry_min",
    "rz_max",
    "rz_min",
  ];
  public disgKeys2D = [
    "dx_max",
    "dx_min",
    "dy_max",
    "dy_min",
    "rz_max",
    "rz_min",
  ];
  public titles3D = [
    "x方向の移動量 最大",
    "x方向の移動量 最小",
    "y方向の移動量 最大",
    "y方向の移動量 最小",
    "z方向の移動量 最大",
    "Z方向の移動量 最小",
    "x軸回りの回転角 最大",
    "x軸回りの回転角 最小",
    "y軸回りの回転角 最大",
    "y軸回りの回転角 最小",
    "z軸回りの回転角 最大",
    "Z軸回りの回転角 最小",
  ];
  public titles2D = [
    "x方向の移動量 最大",
    "x方向の移動量 最小",
    "y方向の移動量 最大",
    "y方向の移動量 最小",
    "z軸回りの回転角 最大",
    "Z軸回りの回転角 最小",
  ];
  public disgKeys = this.disgKeys3D || this.disgKeys2D;
  public titles = this.titles3D || this.titles2D

  private columns: any;

  constructor(private pickdisg: ResultPickupDisgService,
              private three: ThreeDisplacementService,
              private helper: DataHelperModule,) {
    this.clear();
    this.isCalculated = false;
    this.worker1 = new Worker(new URL('./result-combine-disg1.worker', import.meta.url), { name: 'combine-disg1', type: 'module' });
    this.worker2 = new Worker(new URL('./result-combine-disg2.worker', import.meta.url), { name: 'combine-disg2', type: 'module' });
  }

  public clear(): void {
    this.disgCombine = {};
  }

  // three.js で必要
  public getDisgJson(): object {
    return this.disgCombine;
  }

  public getCombineDisgColumns(combNo: number, mode: string): any {
    return this.columns[combNo][mode];
  }

  public setDisgCombineJson(disg: any, defList: any, combList: any, pickList: any): void {

    this.disgKeys = (this.helper.dimension === 3) ? this.disgKeys3D : this.disgKeys2D ;
    this.titles = (this.helper.dimension === 3) ? this.titles3D : this.titles2D ;

    const startTime = performance.now(); // 開始時間
    if (typeof Worker !== 'undefined') {
      // Create a new
      this.worker1.onmessage = ({ data }) => {
        this.disgCombine = data.disgCombine;
        this.value_range = data.value_range;
        console.log('変位disg の 組み合わせ Combine 集計が終わりました', performance.now() - startTime);

        // ピックアップの集計処理を実行する
        this.pickdisg.setDisgPickupJson(pickList, this.disgCombine);

        // 断面力テーブルの集計
        this.worker2.onmessage = ({ data }) => {
          console.log('変位disg の 組み合わせ Combine テーブル集計が終わりました', performance.now() - startTime);
          this.columns = data.result;
          this.isCalculated = true;
        };
        this.worker2.postMessage({ disgCombine: this.disgCombine });
        this.three.setCombPickResultData(this.value_range, 'comb_disg');

      };
      // this.disgCombine = this.worker1_test(defList, combList, disg, this.disgKeys );
      this.worker1.postMessage({ defList, combList, disg, disgKeys: this.disgKeys });
    } else {
      // Web workers are not supported in this environment.
      // You should add a fallback so that your program still executes correctly.
    }

  }
/* 
  private worker1_test(defList: any, combList: any, disg: any, disgKeys: string[]) {


  }*/


}
