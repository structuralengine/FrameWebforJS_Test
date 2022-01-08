import { Injectable } from "@angular/core";
import { DataHelperModule } from "../../../providers/data-helper.module";
import { InputLoadService } from "../../input/input-load/input-load.service";
import { InputMembersService } from "../../input/input-members/input-members.service";
import { ThreeSectionForceService } from "../../three/geometry/three-section-force/three-section-force.service";
import { ResultCombineFsecService } from "../result-combine-fsec/result-combine-fsec.service";

@Injectable({
  providedIn: "root",
})
export class ResultFsecService {
  public isCalculated: boolean;
  public fsec: any;
  private worker1: Worker;
  private worker2: Worker;
  private worker3: Worker;
  private worker4: Worker;
  private columns: any;

  public LL_flg = [];

  constructor(
    public member: InputMembersService,
    private load: InputLoadService,
    public comb: ResultCombineFsecService,
    private three: ThreeSectionForceService,
    private helper: DataHelperModule
  ) {
    this.clear();
    this.worker1 = new Worker(
      new URL("./result-fsec1.worker", import.meta.url),
      { name: "result-fsec1", type: "module" }
    );
    this.worker2 = new Worker(
      new URL("./result-fsec2.worker", import.meta.url),
      { name: "result-fsec2", type: "module" }
    );
    // 連行荷重の集計
    this.worker3 = new Worker(
      new URL(
        "../result-combine-fsec/result-combine-fsec1.worker",
        import.meta.url
      ),
      { name: "LL-fsec1", type: "module" }
    );
    this.worker4 = new Worker(
      new URL(
        "../result-combine-fsec/result-combine-fsec2.worker",
        import.meta.url
      ),
      { name: "LL-fsec2", type: "module" }
    );
    this.LL_flg = new Array();
  }

  public clear(): void {
    this.fsec = {};
    this.isCalculated = false;
  }

  public getFsecColumns(typNo: number, mode: string = null): any {
    const key: string = typNo.toString();
    if (!(key in this.columns)) {
      return new Array();
    }
    const col = this.columns[key];
    if (mode === null) {
      return col;
    } else {
      if (mode in col) {
        return col[mode]; // 連行荷重の時は combine のようになる
      }
    }

    return new Array();
  }

  // three-section-force.service から呼ばれる
  public getFsecJson(): object {
    return this.fsec;
  }

  // サーバーから受領した 解析結果を集計する
  public setFsecJson(
    jsonData: {},
    defList: any,
    combList: any,
    pickList: any
  ): void {
    const startTime = performance.now(); // 開始時間

    if (typeof Worker !== "undefined") {
      // Create a new

      this.worker1.onmessage = ({ data }) => {
        if (data.error === null) {
          console.log(
            "断面力の集計が終わりました",
            performance.now() - startTime
          );
          const fsec = data.fsec;
          const max_values = data.max_values;
          // 組み合わせの集計処理を実行する
          this.comb.setFsecCombineJson(fsec, defList, combList, pickList);

          // 断面力テーブルの集計
          this.worker2.onmessage = ({ data }) => {
            if (data.error === null) {
              console.log(
                "断面力テーブルの集計が終わりました",
                performance.now() - startTime
              );
              this.columns = data.table;
              this.set_LL_columns(fsec, Object.keys(jsonData), max_values);
            } else {
              console.log("断面力テーブルの集計に失敗しました", data.error);
            }
          };
          // 連行荷重の子データは除外する
          const keys = Object.keys(fsec).filter((e) => !e.includes("."));
          for (const k of keys) {
            this.fsec[k] = fsec[k];
          }
          this.worker2.postMessage({ fsec: this.fsec });
        } else {
          console.log("断面力の集計に失敗しました", data.error);
        }
      };

      this.worker1.postMessage({
        jsonData,
        member: this.member.member,
        dimension: this.helper.dimension,
      });
    } else {
      console.log("断面力の生成に失敗しました");
      // Web workers are not supported in this environment.
      // You should add a fallback so that your program still executes correctly.
    }
  }

  // 連行荷重の断面力を集計する
  private set_LL_columns(fsec: any, load_keys: string[], org_max_values: {}) {
    this.LL_flg = new Array();

    const load_name = this.load.getLoadNameJson(0);
    const defList: any = {};
    const combList: any = {};
    const max_values: any = {};

    let flg = false;

    for (const caseNo of Object.keys(load_name)) {
      const caseLoad: any = load_name[caseNo];
      if (caseLoad.symbol !== "LL") {
        this.LL_flg.push(false);
        max_values[caseNo] = org_max_values[caseNo];
      } else {
        // 連行荷重の場合
        flg = true;
        this.LL_flg.push(true);

        const target_LL_Keys: string[] = load_keys.filter((e) => {
          return e.indexOf(caseNo + ".") === 0;
        });

        const caseList: string[] = [caseNo];
        const tmp_max_values = org_max_values[caseNo];

        for (const k of target_LL_Keys) {
          // ケースを追加
          caseList.push(k);

          // max_valuesを更新
          const target_max_values = org_max_values[k];
          for (const kk of Object.keys(tmp_max_values)) {
            if (tmp_max_values[kk] < target_max_values[kk]) {
              tmp_max_values[kk] = target_max_values[kk];
            }
          }
        }
        defList[caseNo] = caseList;
        combList[caseNo] = [{ caseNo, coef: 1 }];
        max_values[caseNo] = tmp_max_values;
      }
    }

    if (flg === false) {
      this.three.setResultData(this.fsec, max_values);
      this.isCalculated = true;
      return; // 連行荷重がなければ ここまで
    }

    // combine のモジュールを利用して 連行荷重の組合せケースを集計する
    this.worker3.onmessage = ({ data }) => {
      console.log(data);
      const fsecCombine = data.fsecCombine;

      this.worker4.onmessage = ({ data }) => {
        const LL_columns = data.result;

        for (const k of Object.keys(LL_columns)) {
          this.columns[k] = LL_columns[k];
          this.fsec[k] = fsecCombine[k];
        }
        // 集計が終わったら three.js に通知
        this.three.setResultData(this.fsec, max_values);
        this.isCalculated = true;
      };

      this.worker4.postMessage({ fsecCombine });
    };

    this.worker3.postMessage({
      defList,
      combList,
      fsec: fsec,
      fsecKeys: this.comb.fsecKeys,
    });
  }
}
