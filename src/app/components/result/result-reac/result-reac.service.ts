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
  }

  public clear(): void {
    this.reac = {};
    this.isCalculated = false;
  }

  public getReacColumns(typNo: number): any {
    const key: string = typNo.toString();
    return key in this.columns ? this.columns[key] : new Array();
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
    this.LL_flg = new Array();
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
      this.LL_flg.push(caseLoad.symbol == "LL" ? true : false);

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
          this.reac = data.reac;

          // 組み合わせの集計処理を実行する
          this.comb.setReacCombineJson(this.reac, defList, combList, pickList);

          // 反力テーブルの集計
          this.worker2.onmessage = ({ data }) => {
            if (data.error === null) {
              console.log(
                "反力テーブルの集計が終わりました",
                performance.now() - startTime
              );
              this.columns = data.table;
              this.isCalculated = true;
            } else {
              console.log("反力テーブルの集計に失敗しました", data.error);
            }
          };
          this.worker2.postMessage({ reac: this.reac });
          this.three.setResultData(this.reac);
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
}
