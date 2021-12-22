import { Injectable } from "@angular/core";
import { InputFixNodeService } from "../../input/input-fix-node/input-fix-node.service";
import { InputLoadService } from "../../input/input-load/input-load.service";
import { ThreeReactService } from "../../three/geometry/three-react.service";
import { ResultCombineReacService } from "../result-combine-reac/result-combine-reac.service";

@Injectable({
  providedIn: "root",
})
export class ResultReacService {
  public isCalculated: boolean;
  public reac: any;
  private worker1: Worker;
  private worker2: Worker;
  private worker3: Worker;
  private worker4: Worker;  
  private columns: any; // 表示用

  public LL_flg = [];

  constructor(
    private fixnode: InputFixNodeService,
    private load: InputLoadService,
    private comb: ResultCombineReacService,
    private three: ThreeReactService
  ) {
    this.clear();
    this.worker1 = new Worker(
      new URL("./result-reac1.worker", import.meta.url),
      { name: "result-reac1", type: "module" }
    );
    this.worker2 = new Worker(
      new URL("./result-reac2.worker", import.meta.url),
      { name: "result-reac2", type: "module" }
    );
    // 連行荷重の集計
    this.worker3 = new Worker(
      new URL("../result-combine-reac/result-combine-reac1.worker", import.meta.url),
      { name: "LL-reac1", type: "module" }
    );
    this.worker4 = new Worker(
      new URL("../result-combine-reac/result-combine-reac2.worker", import.meta.url),
      { name: "LL-reac2", type: "module" }
    );    
  }

  public clear(): void {
    this.reac = {};
    this.isCalculated = false;
  }

  public getReacColumns(typNo: number, mode: string = null): any {

    const key: string = typNo.toString();
    if(!(key in this.columns)) {
      return new Array(); 
    }
    const col = this.columns[key];
    if(mode === null){
      return col;
    } else{
      if(mode in col) {
        return col[mode]; // 連行荷重の時は combine のようになる
      }
    }

    return new Array();
  }

  // three-section-force.service から呼ばれる
  public getReacJson(): object {
    return this.reac;
  }

  // サーバーから受領した 解析結果を集計する
  public setReacJson(
    jsonData: {},
    defList: any,
    combList: any,
    pickList: any
  ): void {
    const startTime = performance.now(); // 開始時間
    // 入力にない反力情報は削除する
    // 2D モードの時 仮に支点を入力することがあった
    const fix_node = this.fixnode.getFixNodeJson(0);
    const load_name = this.load.getLoadNameJson(0);

    for (const k1 of Object.keys(jsonData)) {
      const caseData: any = jsonData[k1];
      if (typeof caseData !== "object") {
        continue;
      }
      if (!("reac" in caseData)) {
        continue;
      }
      const caseLoad: any = load_name[parseInt(k1, 10)];
      const fix_type: string = caseLoad.fix_node.toString();
      if (!(fix_type in fix_node)) {
        caseData.reac = {};
        continue;
      }
      const caseFix: any = fix_node[fix_type];
      const reac = {};
      for (const k2 of Object.keys(caseData.reac)) {
        if (caseFix.find((e) => e.n === k2) !== undefined) {
          reac[k2] = caseData.reac[k2];
        }
      }
      caseData.reac = reac;
    }

    if (typeof Worker !== "undefined") {
      // Create a new

      this.worker1.onmessage = ({ data }) => {
        if (data.error === null) {
          console.log(
            "反力の集計が終わりました",
            performance.now() - startTime
          );
          const reac = data.reac;
          const max_values = data.max_value;

          // 組み合わせの集計処理を実行する
          this.comb.setReacCombineJson(reac, defList, combList, pickList);

          // 反力テーブルの集計
          this.worker2.onmessage = ({ data }) => {
            if (data.error === null) {
              console.log(
                "反力テーブルの集計が終わりました",
                performance.now() - startTime
              );
              this.columns = data.table;
              this.set_LL_columns(reac, Object.keys(jsonData), max_values);
            } else {
              console.log("反力テーブルの集計に失敗しました", data.error);
            }
          };
          // 連行荷重の子データは除外する
          const keys = Object.keys(reac).filter(e => !e.includes('.'));
          for(const k of keys){
            this.reac[k] = reac[k];
          }
          this.worker2.postMessage({ reac: this.reac });
        } else {
          console.log("反力の集計に失敗しました", data.error);
        }
      };
      this.worker1.postMessage({ jsonData });
    } else {
      console.log("反力の生成に失敗しました");
      // Web workers are not supported in this environment.
      // You should add a fallback so that your program still executes correctly.
    }
  }

    // 連行荷重の断面力を集計する
    private set_LL_columns(reac: any, load_keys: string[], org_max_values: {}){

      this.LL_flg = new Array();
  
      const load_name = this.load.getLoadNameJson(0);
      const defList: any = {};
      const combList: any = {};
      const max_values: any = {};
  
      let flg = false;
  
      for (const caseNo of Object.keys(load_name)) {
        const caseLoad: any = load_name[caseNo];
        if(caseLoad.symbol !== "LL"){
          this.LL_flg.push(false);
          max_values[caseNo] = org_max_values[caseNo];
  
        } else {
  
          // 連行荷重の場合 
          flg = true;
          this.LL_flg.push(true);
  
          const target_LL_Keys: string[] = load_keys.filter(e =>{
            return e.indexOf(caseNo + ".") === 0;
          })
          const caseList: string[] = [caseNo]; 
          const tmp_max_values = org_max_values[caseNo];
  
          for(const k of target_LL_Keys){
            // ケースを追加
            caseList.push(k);
  
            // max_valuesを更新
            const target_max_values = org_max_values[k];
            for(const kk of Object.keys(tmp_max_values)){
              if(tmp_max_values[kk] < target_max_values[kk]){
                tmp_max_values[kk] = target_max_values[kk];
              }
            }
          }
          defList[caseNo] = caseList;
          combList[caseNo] = [{ caseNo, coef: 1 }];
          max_values[caseNo] = tmp_max_values;
        }
  
      }
  
      // 集計が終わったら three.js に通知
      this.three.setResultData(reac, max_values);
  
      if(flg === false){
        this.isCalculated = true;
        return; // 連行荷重がなければ ここまで
      }
  
      // combine のモジュールを利用して 連行荷重の組合せケースを集計する
      this.worker3.onmessage = ({ data }) => {
        console.log(data);
        const reacCombine = data.reacCombine;
  
        this.worker4.onmessage = ({ data }) => {
          const LL_columns = data.result;
  
          for(const k of Object.keys(LL_columns)){
            this.columns[k] = LL_columns[k];
            this.reac[k] = reacCombine[k];
          }
          this.isCalculated = true;
        };
        this.worker4.postMessage({reacCombine});
      }
  
      this.worker3.postMessage({ 
        defList, 
        combList, 
        reac: reac, 
        reacKeys: this.comb.reacKeys
      });
    }


}
