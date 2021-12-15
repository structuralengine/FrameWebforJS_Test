import { Injectable } from "@angular/core";
import { SceneService } from "../../scene.service";
import { InputNodesService } from "../../../input/input-nodes/input-nodes.service";
import { InputMembersService } from "../../../input/input-members/input-members.service";
import { InputLoadService } from "../../../input/input-load/input-load.service";
import { ThreeNodesService } from "../three-nodes.service";

import * as THREE from "three";
import { Text } from "troika-three-text";

import { ThreeMembersService } from "../three-members.service";

import { ThreeLoadText } from "./three-load-text";
import { ThreeLoadDimension } from "./three-load-dimension";
import { ThreeLoadPoint } from "./three-load-point";
import { ThreeLoadDistribute } from "./three-load-distribute";
import { ThreeLoadAxial } from "./three-load-axial";
import { ThreeLoadTorsion } from "./three-load-torsion";
import { ThreeLoadMoment } from "./three-load-moment";
import { ThreeLoadTemperature } from "./three-load-temperature";
import { ThreeLoadMemberPoint } from "./three-load-member-point";
import { ThreeLoadMemberMoment } from "./three-load-member-moment";
import { DataHelperModule } from "src/app/providers/data-helper.module";
import { connectableObservableDescriptor } from "rxjs/internal/observable/ConnectableObservable";
import { withLatestFrom } from "rxjs-compat/operator/withLatestFrom";

@Injectable({
  providedIn: "root",
})
export class ThreeLoadService {
  private isVisible = { object: false, gui: false };

  // 全ケースの荷重を保存
  private AllCaseLoadList: {};
  private currentIndex: string; // 現在 表示中のケース番号
  private currentRow: number; // 現在 選択中の行番号
  private currentCol: number; // 現在 選択中の列番号

  // 荷重のテンプレート
  private loadEditor: {};

  // 大きさを調整するためのスケール
  private LoadScale: number;
  private params: any; // GUIの表示制御
  private gui: any;

  private nodeData: any; // 荷重図作成時の 節点データ
  private memberData: any; // 荷重図作成時の 要素データ

  private newNodeData: any; // 変更された 節点データ
  private newMemberData: any; // 変更された 要素データ

  // 選択中のオブジェクト
  private selecteddObject: any;

  // アニメーションのオブジェクト
  private animationObject: any;

  // 初期化
  constructor(
    private scene: SceneService,
    private helper: DataHelperModule,
    private nodeThree: ThreeNodesService,
    private node: InputNodesService,
    private member: InputMembersService,
    private load: InputLoadService,
    private three_member: ThreeMembersService
  ) {
    // 荷重の雛形をあらかじめ生成する
    this.loadEditor = {};
    // フォントをロード
    const loader = new THREE.FontLoader();
    loader.load("./assets/fonts/helvetiker_regular.typeface.json", (font) => {
      const text = new ThreeLoadText(font);
      this.loadEditor[ThreeLoadAxial.id] = new ThreeLoadAxial(text); // 軸方向荷重のテンプレート
      this.loadEditor[ThreeLoadDistribute.id] = new ThreeLoadDistribute(text); // 分布荷重のテンプレート
      this.loadEditor[ThreeLoadMemberPoint.id] = new ThreeLoadMemberPoint(text); // 部材の途中にある節点荷重のテンプレート
      this.loadEditor[ThreeLoadPoint.id] = new ThreeLoadPoint(text); // 節点荷重のテンプレート
      this.loadEditor[ThreeLoadMoment.id] = new ThreeLoadMoment(text); // 節点モーメントのテンプレート
      this.loadEditor[ThreeLoadMemberMoment.id] = new ThreeLoadMemberMoment(
        text
      ); // 部材の途中にある節点モーメントのテンプレート
      this.loadEditor[ThreeLoadTemperature.id] = new ThreeLoadTemperature(text); // 温度荷重のテンプレート
      this.loadEditor[ThreeLoadTorsion.id] = new ThreeLoadTorsion(text); // ねじり分布荷重のテンプレート
    });
    // 全てのケースの荷重情報
    this.AllCaseLoadList = {};
    this.currentIndex = null;
    this.currentRow = null;
    this.currentCol = null;

    // 節点、部材データ
    this.nodeData = null;
    this.memberData = null;
    this.newNodeData = null;
    this.newMemberData = null;

    // gui
    this.LoadScale = 100;
    this.params = {
      LoadScale: this.LoadScale,
    };
    this.gui = {};

    // 選択中のオブジェクト
    this.selecteddObject = null;

    // アニメーションのオブジェクト
    this.animationObject = null;
  }

  // 荷重を再設定する
  public ClearData(): void {
    // 荷重を全部削除する
    for (const id of Object.keys(this.AllCaseLoadList)) {
      this.removeCase(id);
    }

    this.AllCaseLoadList = {};
    this.currentIndex = null;

    // 節点、部材データ
    this.nodeData = null;
    this.memberData = null;
    this.newNodeData = null;
    this.newMemberData = null;

    // 選択中のオブジェクト
    this.selecteddObject = null;
  }

  // ファイルを読み込むなど、りセットする
  public ResetData(): void {
    this.ClearData();

    // ファイルを開いたときの処理
    // 荷重を作成する
    const loadData = this.load.getLoadJson(0);
    for (const id of Object.keys(loadData)) {
      this.addCase(id);
    }

    // データを入手
    this.nodeData = this.node.getNodeJson(0);
    this.memberData = this.member.getMemberJson(0);

    // 格点データ
    this.newNodeData = null;
    if (Object.keys(this.nodeData).length <= 0) {
      return; // 格点がなければ 以降の処理は行わない
    }

    // 節点荷重データを入手
    // const nodeLoadData = this.load.getNodeLoadJson(0);
    const nodeLoadData = {};
    // 要素荷重データを入手
    // const memberLoadData = this.load.getMemberLoadJson(0);
    const memberLoadData = {};
    for (const id of Object.keys(loadData)) {
      const tmp = loadData[id];
      if ("load_member" in tmp && tmp.load_member.length > 0) {
        memberLoadData[id] = tmp.load_member;
      }
      if ("load_node" in tmp && tmp.load_node.length > 0) {
        nodeLoadData[id] = tmp.load_node;
      }
    }

    // 荷重図を非表示のまま作成する
    for (const id of Object.keys(this.AllCaseLoadList)) {
      const LoadList = this.AllCaseLoadList[id];
      this.currentIndex = id; // カレントデータをセット

      // 節点荷重 --------------------------------------------
      if (id in nodeLoadData) {
        const targetNodeLoad = nodeLoadData[id];
        // 節点荷重の最大値を調べる
        this.setMaxNodeLoad(targetNodeLoad);
        // 節点荷重を作成する
        this.createPointLoad(
          targetNodeLoad,
          this.nodeData,
          LoadList.ThreeObject,
          LoadList.pointLoadList
        );
      }

      // 要素荷重 --------------------------------------------
      // 要素データを入手
      this.newMemberData = null;
      if (Object.keys(this.memberData).length > 0) {
        if (id in memberLoadData) {
          const targetMemberLoad = memberLoadData[id];
          // 要素荷重の最大値を調べる
          this.setMaxMemberLoad(targetMemberLoad);
          // 要素荷重を作成する
          this.createMemberLoad(
            targetMemberLoad,
            this.nodeData,
            this.memberData,
            LoadList.ThreeObject,
            LoadList.memberLoadList
          );
        }
      }

      // 重なりを調整する
      this.setOffset(id);
      // 重なりを調整する
      this.onResize(id);
    }

    this.currentIndex = "-1";
  }

  // 表示ケースを変更する
  public changeCase(changeCase: number, empty = null): void {
    if (!this.visibleCaseChange(changeCase, empty)) {
      return;
    }

    // 連行荷重が完成したら 以下のアニメーションを有効にする
    // 荷重名称を調べる
    const symbol: string = this.load.getLoadName(changeCase, "symbol");
    if (symbol === "LL") {
      const LL_list = this.load.getMemberLoadJson(0, this.currentIndex);
      const LL_keys: string[] = Object.keys(LL_list);
      if (LL_keys.length > 0) {
        const keys = LL_keys.map((value) => {
          return Number(value);
        });
        this.animation(keys);
        return;
      }
    }

    if (this.animationObject !== null) {
      cancelAnimationFrame(this.animationObject);
      this.animationObject = null;
    }

    this.scene.render();
  }

  private visibleCaseChange(changeCase: number, empty = null): boolean {
    const id: string = changeCase.toString();
    if (empty == 1) {
      this.currentIndex = String(this.load.LL_length * this.load.LL_pitch);
    }

    if (this.currentIndex === id) {
      // 同じなら何もしない
      return false;
    }

    if (changeCase < 1) {
      // 非表示にして終わる
      for (const key of Object.keys(this.AllCaseLoadList)) {
        const targetLoad = this.AllCaseLoadList[key];
        const ThreeObject: THREE.Object3D = targetLoad.ThreeObject;
        ThreeObject.visible = false;
      }
      this.scene.render();
      this.currentIndex = id;
      return false;
    }

    // 初めての荷重ケースが呼び出された場合
    if (!(id in this.AllCaseLoadList)) {
      this.addCase(id);
    }

    // 荷重の表示非表示を切り替える
    for (const key of Object.keys(this.AllCaseLoadList)) {
      const targetLoad = this.AllCaseLoadList[key];
      const ThreeObject: THREE.Object3D = targetLoad.ThreeObject;
      ThreeObject.visible = key === id ? true : false;
    }

    // カレントデータをセット
    this.currentIndex = id;

    return true;
  }

  // 連行移動荷重のアニメーションを開始する
  public animation(keys: number[], k: number = 0) {
    const i: number = Math.floor(k / 10); // 10フレームに１回位置を更新する

    const j = i < keys.length ? k + 1 : 0; // 次のフレーム

    // 次のフレームを要求
    this.animationObject = requestAnimationFrame(() => {
      this.animation(keys, j);
    });

    const g = i < keys.length ? keys[i] : keys[0];
    if (this.visibleCaseChange(g)) {
      // レンダリングする
      this.scene.render();
    }
  }

  // ケースを追加する
  private addCase(id: string): void {
    const ThreeObject = new THREE.Object3D();
    ThreeObject.name = id;
    ThreeObject.visible = false; // ファイルを読んだ時点では、全ケース非表示
    this.AllCaseLoadList[id] = {
      ThreeObject,
      pointLoadList: {},
      memberLoadList: {},
      pMax: 0, // 最も大きい集中荷重値
      mMax: 0, // 最も大きいモーメント
      wMax: 0, // 最も大きい分布荷重
      rMax: 0, // 最も大きいねじり分布荷重
      qMax: 0, // 最も大きい軸方向分布荷重
    };

    this.scene.add(ThreeObject); // シーンに追加
  }

  //シートの選択行が指すオブジェクトをハイライトする
  public selectChange(index_row: number, index_column: number): void {
    // mode: string = "value"): void {
    const id: string = this.currentIndex;

    if (index_row > 0 && this.currentRow === index_row) {
      if (this.currentCol === index_column) {
        //選択行の変更がないとき，何もしない
        return;
      }
    }

    if (this.AllCaseLoadList[id] === undefined) return;
    const ThreeObject: THREE.Object3D = this.AllCaseLoadList[id].ThreeObject;

    for (let child of ThreeObject.children) {
      const item: any = child;
      if (!("editor" in item)) continue;

      const editor: any = item["editor"];

      let column = ``;
      if (index_column > 7) {
        const keys =
          this.helper.dimension === 3
            ? ["", "tx", "ty", "tz", "rx", "ry", "rz"]
            : ["", "tx", "ty", "rz"];
        column = keys[index_column - 8];
      }

      const key = editor.id + "-" + index_row.toString() + "-" + column;

      if (index_column < 8) {
        if (editor.id !== "PointLoad" && editor.id !== "MomentLoad") {
          if (item.name.indexOf(key) !== -1) {
            editor.setColor(item, "select");
          } else {
            editor.setColor(item, "clear");
          }
        } else {
          editor.setColor(item, "clear");
        }
      } else {
        if (editor.id === "PointLoad" || editor.id === "MomentLoad") {
          if (item.name.indexOf(key) !== -1) {
            editor.setColor(item, "select");
          } else {
            editor.setColor(item, "clear");
          }
        } else {
          editor.setColor(item, "clear");
        }
      }
    }

    this.currentRow = index_row;
    this.currentCol = index_column;

    this.scene.render();
  }

  // ケースの荷重図を消去する
  public removeCase(id: string, option: boolean = true): void {
    if (!(id in this.AllCaseLoadList)) {
      return;
    }

    const data = this.AllCaseLoadList[id];
    this.removeMemberLoadList(data);
    this.removePointLoadList(data);

    const ThreeObject = data.ThreeObject;
    this.scene.remove(ThreeObject);

    delete this.AllCaseLoadList[id];

    if(option){
      this.scene.render();
    }
  }

  // 節点の入力が変更された場合 新しい入力データを保持しておく
  public changeNode(jsonData): void {
    this.newNodeData = jsonData;
  }

  // 要素の入力が変更された場合 新しい入力データを保持しておく
  public changeMember(jsonData): void {
    this.newMemberData = jsonData;
  }

  // 節点や要素が変更された部分を描きなおす
  public reDrawNodeMember(): void {
    if (this.newNodeData === null && this.newMemberData === null) {
      return;
    }

    // 格点の変わった部分を探す
    const changeNodeList = {};
    if (this.nodeData !== null) {
      if (this.newNodeData !== null) {
        for (const key of Object.keys(this.nodeData)) {
          if (!(key in this.newNodeData)) {
            // 古い情報にあって新しい情報にない節点
            changeNodeList[key] = "delete";
          }
        }
        for (const key of Object.keys(this.newNodeData)) {
          if (!(key in this.nodeData)) {
            // 新しい情報にあって古い情報にない節点
            changeNodeList[key] = "add";
            continue;
          }
          const oldNode = this.nodeData[key];
          const newNode = this.newNodeData[key];
          if (
            oldNode.x !== newNode.x ||
            oldNode.y !== newNode.y ||
            oldNode.z !== newNode.z
          ) {
            changeNodeList[key] = "change";
          }
        }
      }
    }

    const changeMemberList = {};
    if (this.memberData !== null) {
      // 部材の変わった部分を探す
      if (this.newMemberData !== null) {
        for (const key of Object.keys(this.memberData)) {
          if (!(key in this.newMemberData)) {
            // 古い情報にあって新しい情報にない節点
            changeMemberList[key] = "delete";
          }
        }
        for (const key of Object.keys(this.newMemberData)) {
          if (!(key in this.memberData)) {
            // 新しい情報にあって古い情報にない節点
            changeMemberList[key] = "add";
            continue;
          }
          const oldMember = this.memberData[key];
          const newMember = this.newMemberData[key];
          if (oldMember.ni !== newMember.ni || oldMember.nj !== newMember.nj) {
            changeMemberList[key] = "change";
          }
        }
      }
    }
    // 格点の変更によって影響のある部材を特定する
    const targetMemberData =
      this.newMemberData !== null ? this.newMemberData : this.memberData;
    if (targetMemberData !== null) {
      for (const key of Object.keys(targetMemberData)) {
        const newMember = targetMemberData[key];
        if (newMember.ni in changeNodeList || newMember.nj in changeNodeList) {
          changeMemberList[key] = "node change";
        }
      }
    }

    // 荷重を変更する
    const oldIndex = this.currentIndex;
    this.nodeData =
      this.newNodeData !== null ? this.newNodeData : this.nodeData;
    this.memberData =
      this.newMemberData !== null ? this.newMemberData : this.memberData;
    // 荷重データを入手
    const nodeLoadData = this.load.getNodeLoadJson(0);
    const memberLoadData = this.load.getMemberLoadJson(0);
    // 荷重を修正
    for (const id of Object.keys(this.AllCaseLoadList)) {
      this.currentIndex = id;
      let editFlg = false;
      if (this.currentIndex in nodeLoadData) {
        for (const load of nodeLoadData[this.currentIndex]) {
          if (load.n.toString() in changeNodeList)
            this.changeNodeLode(load.row, nodeLoadData);
          editFlg = true;
        }
      }
      if (this.currentIndex in memberLoadData) {
        for (const load of memberLoadData[this.currentIndex]) {
          if (load.m.toString() in changeMemberList) {
            this.changeMemberLode(load.row, memberLoadData);
            editFlg = true;
          }
        }
      }
      if (editFlg === true) {
        this.setOffset();
        this.onResize();
      }
    }

    this.newNodeData = null;
    this.newMemberData = null;
    this.currentIndex = oldIndex;
  }

  // 荷重の入力が変更された場合
  public changeData(row: number): void {
    // this.currentIndexを'1.3'等から'1'に直す
    const strNo = this.currentIndex.indexOf(".");
    if (strNo >= 0) {
      this.currentIndex = this.currentIndex.slice(0, strNo - this.currentIndex.length);
    }
    // データになカレントデータがなければ
    if (!(this.currentIndex in this.load.load)) {
      this.removeCase(this.currentIndex);
      return;
    }

    // 格点データを入手
    if (this.nodeData === null) {
      return; // 格点がなければ 以降の処理は行わない
    }
    if (Object.keys(this.nodeData).length <= 0) {
      return; // 格点がなければ 以降の処理は行わない
    }

    // 節点荷重データを入手
    const nodeLoadData = this.load.getNodeLoadJson(0, this.currentIndex);
    // 節点荷重を変更
    this.changeNodeLode(row, nodeLoadData);

    // 要素データを入手
    if (this.memberData === null) {
      return; //要素がなければ 以降の処理は行わない
    }
    if (Object.keys(this.memberData).length <= 0) {
      return; //要素がなければ 以降の処理は行わない
    }

    const tempMemberLoad = this.load.getMemberLoadJson(null, this.currentIndex); // 簡易版
    if (this.currentIndex in tempMemberLoad) {
      // 要素荷重データを入手
      const memberLoadData = this.load.getMemberLoadJson(0, this.currentIndex); //計算に使う版：直後に同じ関数を呼んでいる
      // キーに小数点があるケース（連行荷重）を削除する
      const keys = Object.keys(this.AllCaseLoadList);
      for (const key of keys) {
        if(key.includes('.')) {
          this.removeCase(key, false);
        }
      }
      // 要素荷重を変更
      this.changeMemberLode(row, memberLoadData); //実際に荷重として使っているのは　memberLoadData こっち
      row++;

      // 対象行以下の行について
      const memberLoads = tempMemberLoad[this.currentIndex];
      let i = memberLoads.findIndex((e) => e.row === row);
      while (i >= 0) {
        const targetMemberLoad = memberLoads[i];
        if (targetMemberLoad.L1 == null) {
          break;
        }
        if (!targetMemberLoad.L1.includes("-")) {
          break;
        }
        // 要素荷重を変更
        this.changeMemberLode(targetMemberLoad.row, memberLoadData); //実際に荷重として使っているのは　memberLoadData こっち
        row++;
        i = memberLoads.findIndex((e) => e.row === row);
      }
    }

    // 重なりを調整する
    this.setOffset();
    // サイズを調整する
    this.onResize();
    // レンダリング
    this.scene.render();
    // 表示フラグを ON にする
    this.isVisible.object = true;
  }

  // 節点荷重を変更
  private changeNodeLode(row: number, nodeLoadData: any): void {
    const LoadList = this.AllCaseLoadList[this.currentIndex];

    if (this.currentIndex in nodeLoadData) {
      // 節点荷重の最大値を調べる
      const tempNodeLoad = nodeLoadData[this.currentIndex];
      this.setMaxNodeLoad(tempNodeLoad);

      // 対象行(row) に入力されている部材番号を調べる
      const targetNodeLoad = tempNodeLoad.filter((load) => load.row === row);

      this.removePointLoadList(LoadList, row);

      this.createPointLoad(
        targetNodeLoad,
        this.nodeData,
        LoadList.ThreeObject,
        LoadList.pointLoadList
      );
    } else {
      // ケースが存在しなかった
      this.removePointLoadList(LoadList);
      for (const key of Object.keys(LoadList.pointLoadList)) {
        LoadList.pointLoadList[key] = {
          tx: [],
          ty: [],
          tz: [],
          rx: [],
          ry: [],
          rz: [],
        };
      }
    }
  }

  // 節点荷重を削除する
  private removePointLoadList(LoadList, row = null): void {
    for (const key of Object.keys(LoadList.pointLoadList)) {
      //格点node
      const list = LoadList.pointLoadList[key];
      for (const key2 of ["tx", "ty", "tz", "rx", "ry", "rz"]) {
        for (let i = list[key2].length - 1; i >= 0; i--) {
          const item = list[key2][i];
          if (row !== null && item.row !== row) {
            continue;
          }
          LoadList.ThreeObject.remove(item);
          list[key2].splice(i, 1);
        }
      }
    }
  }

  // 要素荷重を変更
  private changeMemberLode(row: number, memberLoadData: any): void {
    for (const key of Object.keys(memberLoadData)) {

      // "LL"（連行荷重）の時に発生する
      if (this.AllCaseLoadList[key] === undefined) {
        this.addCase(key)
      }
      const LoadList = this.AllCaseLoadList[key];

      if (this.currentIndex in memberLoadData) {
        // 対象業(row) に入力されている部材番号を調べる
        const tempMemberLoad = memberLoadData[key];
        // 要素荷重の最大値を調べる
        this.setMaxMemberLoad(tempMemberLoad, key);

        // 対象行(row) に入力されている部材番号を調べる
        const targetMemberLoad = tempMemberLoad.filter(
          (load) => load.row === row
        );
        // 同じ行にあった荷重を一旦削除
        this.removeMemberLoadList(LoadList, row);

        this.createMemberLoad(
          targetMemberLoad,
          this.nodeData,
          this.memberData,
          LoadList.ThreeObject,
          LoadList.memberLoadList
        );
      } else {
        // ケースが存在しなかった
        this.removeMemberLoadList(LoadList);
        for (const key of Object.keys(LoadList.memberLoadList)) {
          LoadList.memberLoadList[key] = {
            gx: [],
            gy: [],
            gz: [],
            x: [],
            y: [],
            z: [],
            t: [],
            r: [],
          };
        }
      }
    }
  }

  // 要素荷重を削除する
  private removeMemberLoadList(LoadList, row = null): void {
    for (const key of Object.keys(LoadList.memberLoadList)) {
      const list = LoadList.memberLoadList[key];
      for (const key2 of ["gx", "gy", "gz", "x", "y", "z", "t", "r"]) {
        for (let i = list[key2].length - 1; i >= 0; i--) {
          const item = list[key2][i];
          if (row !== null && item.row !== row) {
            continue;
          }
          LoadList.ThreeObject.remove(item);
          list[key2].splice(i, 1);
        }
      }
    }
  }

  // 節点荷重の矢印を描く
  private createPointLoad(
    targetNodeLoad: any[],
    nodeData: object,
    ThreeObject: THREE.Object3D,
    pointLoadList: any
  ): void {
    if (targetNodeLoad === undefined) {
      return;
    }

    // 集中荷重の矢印をシーンに追加する
    for (const load of targetNodeLoad) {
      const n = load.n.toString();

      // 節点座標 を 取得する
      if (!(n in nodeData)) {
        continue;
      }
      const node = nodeData[n];

      // リストに登録する
      const target =
        n in pointLoadList
          ? pointLoadList[n]
          : { tx: [], ty: [], tz: [], rx: [], ry: [], rz: [] };

      // 集中荷重 ---------------------------------

      for (let key of ["tx", "ty", "tz"]) {
        if (!(key in load)) continue;
        if (load[key] === 0) continue;

        const value = load[key];

        // 荷重を編集する
        // 長さを決める
        // scale = 1 の時 長さlength = maxLengthとなる
        const arrow = this.loadEditor[ThreeLoadPoint.id].create(
          node,
          0,
          value,
          1,
          key,
          load.row
        );

        // リストに登録する
        arrow["row"] = load.row;
        target[key].push(arrow);
        ThreeObject.add(arrow);
      }
      // 強制変位(仮：集中荷重と同じとしている) ---------------------------------
      for (let k of ["x", "y", "z"]) {
        const key1 = "d" + k;
        if (!(key1 in load)) continue;
        if (load[key1] === 0) continue;

        const value = load[key1] * 1000;

        const key = "t" + k;
        // 荷重を編集する
        // 長さを決める
        // scale = 1 の時 長さlength = maxLengthとなる
        const arrow = this.loadEditor[ThreeLoadPoint.id].create(
          node,
          0,
          value,
          1,
          key,
          load.row
        );

        // リストに登録する
        arrow["row"] = load.row;
        target[key].push(arrow);
        ThreeObject.add(arrow);
      }

      // 曲げモーメント荷重 -------------------------
      for (let key of ["rx", "ry", "rz"]) {
        if (!(key in load)) continue;
        if (load[key] === 0) continue;

        const value = load[key];

        // 配置位置（その他の荷重とぶつからない位置）を決定する
        let offset = 0;
        for (const a of target[key]) {
          if (a.visible === false) {
            continue;
          }
          offset += 0.1;
        }
        // 荷重を編集する
        // 長さを決める
        // scale = 1 の時 直径Radius = maxLengthとなる
        const scale = 1; //Math.abs(value) * 0.1;
        const Radius: number = scale;
        const arrow = this.loadEditor[ThreeLoadMoment.id].create(
          node,
          offset,
          value,
          Radius,
          key,
          load.row
        );

        // リストに登録する
        arrow["row"] = load.row;
        target[key].push(arrow);
        ThreeObject.add(arrow);
      }
      // 強制変位(仮：集中荷重と同じとしている) ---------------------------------
      for (let k of ["x", "y", "z"]) {
        const key1 = "a" + k;

        if (!(key1 in load)) continue;
        if (load[key1] === 0) continue;

        const value = load[key1] * 1000;

        const key = "r" + k;
        // 配置位置（その他の荷重とぶつからない位置）を決定する
        let offset = 0;
        for (const a of target[key]) {
          if (a.visible === false) {
            continue;
          }
          offset += 0.1;
        }
        // 荷重を編集する
        // 長さを決める
        // scale = 1 の時 直径Radius = maxLengthとなる
        const scale = 1; //Math.abs(value) * 0.1;
        const Radius: number = scale;
        const arrow = this.loadEditor[ThreeLoadMoment.id].create(
          node,
          offset,
          value,
          Radius,
          key,
          load.row
        );

        // リストに登録する
        arrow["row"] = load.row;
        target[key].push(arrow);
        ThreeObject.add(arrow);
      }
      pointLoadList[n] = target;
    }
  }

  // 節点荷重の最大値を調べる
  private setMaxNodeLoad(targetNodeLoad = null): void {
    const LoadList = this.AllCaseLoadList[this.currentIndex];
    LoadList.pMax = 0; // 最も大きい集中荷重値
    LoadList.mMax = 0; // 最も大きいモーメント

    if (targetNodeLoad === null) {
      const nodeLoadData = this.load.getNodeLoadJson(0, this.currentIndex);
      if (this.currentIndex in nodeLoadData) {
        targetNodeLoad = nodeLoadData[this.currentIndex];
      } else {
        return;
      }
    }

    targetNodeLoad.forEach((load) => {
      for (const k of ["tx", "ty", "tz"]) {
        if (k in load) {
          LoadList.pMax = Math.max(LoadList.pMax, Math.abs(load[k]));
        }
      }
      for (const k of ["dx", "dy", "dz"]) {
        if (k in load) {
          LoadList.pMax = Math.max(LoadList.pMax, Math.abs(load[k] * 1000));
        }
      }
    });
    targetNodeLoad.forEach((load) => {
      for (const k of ["rx", "ry", "rz"]) {
        if (k in load) {
          LoadList.mMax = Math.max(LoadList.mMax, Math.abs(load[k]));
        }
      }
      for (const k of ["ax", "ay", "az"]) {
        if (k in load) {
          LoadList.mMax = Math.max(LoadList.mMax, Math.abs(load[k] * 1000));
        }
      }
    });
  }

  // 要素荷重の最大値を調べる
  private setMaxMemberLoad(targetMemberLoad = null, index: string = this.currentIndex): void {
    // スケールを決定する 最大の荷重を 1とする
    const LoadList = this.AllCaseLoadList[index];
    LoadList.wMax = 0;
    LoadList.rMax = 0;
    LoadList.qMax = 0;

    if (targetMemberLoad === null) {
      const memberLoadData = this.load.getMemberLoadJson(0, index);
      if (index in memberLoadData) {
        targetMemberLoad = memberLoadData[index];
      } else {
        return;
      }
    }

    // 値をスケールの決定に入れると入力を変更する度に全部書き直さなくてはならない
    for (const load of targetMemberLoad) {
      const value = Math.max(Math.abs(load.P1), Math.abs(load.P2));

      const direction = load.direction.trim().toLowerCase();

      if (load.mark === 2) {
        if (direction === "r") {
          LoadList.rMax = Math.max(LoadList.rMax, value);
        } else if (direction === "x") {
          LoadList.qMax = Math.max(LoadList.qMax, value);
        } else {
          LoadList.wMax = Math.max(LoadList.wMax, value);
        }
      } else if (load.mark === 1) {
        LoadList.pMax = Math.max(LoadList.pMax, value);
      } else if (load.mark === 11) {
        LoadList.mMax = Math.max(LoadList.mMax, value);
      }
    }
  }

  // 要素荷重の矢印を描く
  private createMemberLoad(
    memberLoadData: any[],
    nodeData: object,
    memberData: object,
    ThreeObject: THREE.Object3D,
    memberLoadList: any
  ): void {
    if (memberLoadData === undefined) {
      return;
    }

    // memberLoadData情報を書き換える可能性があるので、複製する
    const targetMemberLoad = JSON.parse(
      JSON.stringify({
        temp: memberLoadData,
      })
    ).temp;

    // 分布荷重の矢印をシーンに追加する
    for (const load of targetMemberLoad) {
      // 部材データを集計する
      if (!(load.m in memberData)) {
        continue;
      }
      const mNo: string = load.m.toString();
      const m = memberData[mNo];
      // 節点データを集計する
      if (!(m.ni in nodeData && m.nj in nodeData)) {
        continue;
      }

      if (load.P1 === 0 && load.P2 === 0) {
        continue;
      }

      // 部材の座標軸を取得
      const i = nodeData[m.ni];
      const j = nodeData[m.nj];
      const nodei = new THREE.Vector3(i.x, i.y, i.z);
      const nodej = new THREE.Vector3(j.x, j.y, j.z);
      const localAxis = this.three_member.localAxis(
        i.x,
        i.y,
        i.z,
        j.x,
        j.y,
        j.z,
        m.cg
      );

      // リストに登録する
      const target =
        mNo in memberLoadList
          ? memberLoadList[mNo]
          : {
              localAxis,
              x: [],
              y: [],
              z: [],
              gx: [],
              gy: [],
              gz: [],
              r: [],
              t: [],
            };

      // 荷重値と向き -----------------------------------
      let P1: number = load.P1;
      let P2: number = load.P2;
      let direction: string = load.direction;
      if (direction === null || direction === undefined) {
        direction = "";
      } else {
        direction = direction.trim().toLowerCase();
      }
      if (localAxis.x.y === 0 && localAxis.x.z === 0) {
        //console.log(load.m, m, 'は x軸に平行な部材です')
        if (direction === "gx") direction = "x";
        if (direction === "gy") direction = "y";
        if (direction === "gz") direction = "z";
      } else if (localAxis.x.x === 0 && localAxis.x.z === 0) {
        //console.log(load.m, m, 'は y軸に平行な部材です')
        if (direction === "gx") {
          direction = "y";
          P1 = -P1;
          P2 = -P2;
        }
        if (direction === "gy") direction = "x";
        if (direction === "gz") direction = "z";
      } else if (localAxis.x.x === 0 && localAxis.x.y === 0) {
        //console.log(load.m, m, 'は z軸に平行な部材です')
        if (direction === "gx") {
          direction = "y";
          P1 = -P1;
          P2 = -P2;
        }
        if (direction === "gy") direction = "z";
        if (direction === "gz") {
          direction = "x";
          P1 = -P1;
          P2 = -P2;
        }
      }

      let arrow: THREE.Group = null;

      // 分布荷重 y, z -------------------------------
      // mark=2, direction=x
      if (load.mark === 2) {
        if (
          direction === "y" ||
          direction === "z" ||
          direction === "gx" ||
          direction === "gy" ||
          direction === "gz"
        ) {
          // 分布荷重
          arrow = this.loadEditor[ThreeLoadDistribute.id].create(
            nodei,
            nodej,
            localAxis,
            direction,
            load.L1,
            load.L2,
            P1,
            P2,
            load.row
          );
        } else if (direction === "r") {
          // ねじり布荷重
          arrow = this.loadEditor[ThreeLoadTorsion.id].create(
            nodei,
            nodej,
            localAxis,
            direction,
            load.L1,
            load.L2,
            P1,
            P2,
            load.row
          );
        } else if (direction === "x") {
          // 軸方向分布荷重
          arrow = this.loadEditor[ThreeLoadAxial.id].create(
            nodei,
            nodej,
            localAxis,
            direction,
            load.L1,
            load.L2,
            P1,
            P2,
            load.row
          );
        }
      } else if (load.mark === 9) {
        // 温度荷重
        arrow = this.loadEditor[ThreeLoadTemperature.id].create(
          nodei,
          nodej,
          localAxis,
          P1,
          load.row
        );
        direction = "t";
      } else if (load.mark === 1) {
        // 集中荷重荷重
        if (["x", "y", "z", "gx", "gy", "gz"].includes(direction)) {
          arrow = this.loadEditor[ThreeLoadMemberPoint.id].create(
            nodei,
            nodej,
            localAxis,
            direction,
            load.L1,
            load.L2,
            P1,
            P2,
            load.row
          );
        }
      } else if (load.mark === 11) {
        // モーメント荷重
        if (["x", "y", "z", "gx", "gy", "gz"].includes(direction)) {
          arrow = this.loadEditor[ThreeLoadMemberMoment.id].create(
            nodei,
            nodej,
            localAxis,
            direction,
            load.L1,
            load.L2,
            P1,
            P2,
            load.row
          );
          direction = "r";
        }
      }

      // リストに登録する
      if (arrow === null) {
        continue;
      }

      arrow["row"] = load.row;
      target[direction].push(arrow);
      ThreeObject.add(arrow);
      memberLoadList[mNo] = target;
    }
  }

  // three.service から呼ばれる 表示・非表示の制御
  public visibleChange(flag: boolean, gui: boolean): void {
    // 非表示にする
    if (flag === false) {
      this.guiDisable();
      this.changeCase(-1);
      this.isVisible.object = false;
      return;
    }

    // gui の表示を切り替える
    if (gui === true) {
      this.guiEnable();
      //console.log('荷重強度の入力です。')
    } else {
      // 黒に戻す
      this.guiDisable();
      // setColor を初期化する
      //console.log('荷重名称の入力です。')
      this.selectChange(-1, 0);
    }
    this.isVisible.gui = gui;

    // すでに表示されていたら変わらない
    if (this.isVisible.object === true) {
      return;
    }

    // 表示する
    this.changeCase(1);
    this.isVisible.object = true;
  }

  // guiを表示する
  private guiEnable(): void {
    console.log("three load!", "guiEnable");

    if (!("LoadScale" in this.gui)) {
      const gui_step: number = 1;
      this.gui["LoadScale"] = this.scene.gui
        .add(this.params, "LoadScale", 0, 400)
        .step(gui_step)
        .onChange((value) => {
          this.LoadScale = value;
          this.onResize();
          this.scene.render();
        });
    }
  }

  // guiを非表示にする
  private guiDisable(): void {
    console.log("three load!", "guiDisable");
    for (const key of Object.keys(this.gui)) {
      this.scene.gui.remove(this.gui[key]);
    }
    this.gui = {};
  }

  private baseScale(): number {
    return this.nodeThree.baseScale * 10;
  }

  // スケールを反映する
  private onResize(id: string = this.currentIndex): void {
    if (!(id in this.AllCaseLoadList)) {
      return;
    }
    // 節点荷重は通さなくていい？
    for (const _id of [
      id,
      id + ".1",
      id + ".2",
      id + ".3",
      id + ".4",
      id + ".5",
    ]) {
      const loadList = this.AllCaseLoadList[_id];
      if (loadList === undefined) {
        continue;
        //break; でもよい
      }

      const scale1: number = this.LoadScale / 100;
      const scale2: number = this.baseScale();
      const scale: number = scale1 * scale2;

      // 節点荷重のスケールを変更する
      for (const n of Object.keys(loadList.pointLoadList)) {
        const dict = loadList.pointLoadList[n];
        for (let k of Object.keys(dict)) {
          for (const item of dict[k]) {
            const editor = item.editor;
            editor.setScale(item, scale);
          }
        }
      }

      // 要素荷重のスケールを変更する
      for (const m of Object.keys(loadList.memberLoadList)) {
        const dict = loadList.memberLoadList[m];
        for (const direction of ["gx", "gy", "gz", "r", "x", "y", "z"]) {
          for (const item of dict[direction]) {
            const editor = item.editor;
            editor.setScale(item, scale);
          }
        }
      }
    }
    //this.scene.render(); //コメントアウト：レンダリング不要の場合があるため、レンダリングはこの関数の外側で行う
  }

  // 重なりを調整する
  private setOffset(id: string = this.currentIndex): void {
    if (!(id in this.AllCaseLoadList)) {
      return;
    }
    const loadList = this.AllCaseLoadList[id];

    // 配置位置（その他の荷重とぶつからない位置）を決定する
    for (const n of Object.keys(loadList.pointLoadList)) {
      const list = loadList.pointLoadList[n];
      // 集中荷重:ThreeLoadPoint
      ["tx", "ty", "tz"].forEach((k) => {
        let offset1 = 0;
        let offset2 = 0;
        for (const item of list[k]) {
          const editor = item.editor;
          // 大きさを変更する
          const scale: number =
            4 * this.helper.getScale(Math.abs(item.value), loadList.pMax);
          editor.setSize(item, scale);
          // オフセットする
          if (item.value > 0) {
            editor.setOffset(item, offset1);
            offset1 -= scale * 1.0; // オフセット距離に高さを加算する
          } else {
            editor.setOffset(item, offset2);
            offset2 += scale * 1.0; // オフセット距離に高さを加算する
          }
        }
      });
      // 集中荷重:ThreeLoadPoint
      ["rx", "ry", "rz"].forEach((k) => {
        let offset = 0;
        for (const item of list[k]) {
          const editor = item.editor;
          const scale: number = this.helper.getScale(item.value, loadList.mMax);
          editor.setSize(item, scale);
          editor.setOffset(item, offset);
          offset += this.baseScale() * 0.1;
        }
      });
    }

    // 要素荷重のスケールを変更する
    for (const m of Object.keys(loadList.memberLoadList)) {
      const list = loadList.memberLoadList[m];

      // ねじりモーメント
      let offset0 = 0;
      for (const item of list["r"]) {
        const editor = item.editor;

        if (item.name.indexOf(ThreeLoadMemberMoment.id) !== -1) {
          const scale: number = this.helper.getScale(
            Math.abs(item.value),
            loadList.mMax
          );
          editor.setSize(item, scale);
        } else if (item.name.indexOf(ThreeLoadTorsion.id) !== -1) {
          // 大きさを変更する
          const scale: number = this.helper.getScale(
            Math.abs(item.value),
            loadList.rMax
          );
          editor.setSize(item, scale);
          offset0 += scale * 0.5;
        }
      }

      // 分布荷重（部材軸座標方向）
      ["y", "z"].forEach((k) => {
        let offset1 = offset0;
        let offset2 = offset0 * -1;
        let offset3 = offset0;
        let offset4 = offset0 * -1;

        const Xarea1 = [];
        list[k].forEach((item) => {
          const editor = item.editor;
          // 大きさを変更する
          if (item.name.indexOf(ThreeLoadDistribute.id) !== -1) {
            // 分布荷重
            const scale: number = this.helper.getScale(
              Math.abs(item.value),
              loadList.wMax
            );
            editor.setSize(item, scale);
            //以降は当たり判定に用いる部分
            const vertice_points = [];
            //当たり判定のエリアを登録
            const target_geo =
              item.children[0].children[0].children[0].geometry;
            const pos_arr = target_geo.attributes.position.array;
            for (let i = 0; i < pos_arr.length; i += 3) {
              const scale = this.helper.getScale(
                Math.abs(item.value),
                loadList.wMax
              );
              vertice_points.push(pos_arr[i]); // x
              vertice_points.push(pos_arr[i + 1] * scale); // y
            }
            if (Xarea1.length === 0) {
              if (item.value > 0) {
                editor.setOffset(item, offset3);
              } else {
                editor.setOffset(item, offset4);
              }
            }

            //次のforループの名称 -> breakで使用
            all_check: for (let hit_points of Xarea1) {
              const pre_scale: number = this.helper.getScale(
                Math.abs(hit_points[10]),
                loadList.wMax
              );
              //for (let num2 = 0; num2 < 5; num2++) {

              //接触判定
              let judgeX = this.self_raycaster(vertice_points, hit_points, "x");
              let judgeY = this.self_raycaster(vertice_points, hit_points, "y");

              if (
                judgeX === "Hit" &&
                (judgeY === "Hit" || judgeY === "Touch")
              ) {
                // オフセットする
                if (item.value > 0) {
                  offset1 += pre_scale * 1.0; // オフセット距離に高さを加算する
                  editor.setOffset(item, offset1);
                  vertice_points[1] += offset1;
                  vertice_points[3] += offset1;
                  vertice_points[5] += offset1;
                  vertice_points[7] += offset1;
                  vertice_points[9] += offset1;
                  vertice_points[11] += offset1;
                  vertice_points[13] += offset1;
                  vertice_points[15] += offset1;
                  vertice_points[17] += offset1;
                } else {
                  offset2 -= pre_scale * 1.0; // オフセット距離に高さを加算する
                  editor.setOffset(item, offset2);
                  vertice_points[1] += offset2;
                  vertice_points[3] += offset2;
                  vertice_points[5] += offset2;
                  vertice_points[7] += offset2;
                  vertice_points[9] += offset2;
                  vertice_points[11] += offset2;
                  vertice_points[13] += offset2;
                  vertice_points[15] += offset2;
                  vertice_points[17] += offset2;
                }
              } else if (judgeX === "NotHit" || judgeY === "NotHit") {
                //オフセットしない
                if (item.value > 0) {
                  editor.setOffset(item, offset1);
                } else {
                  editor.setOffset(item, offset2);
                }
                continue;
              } else {
                //現状ケースを確認できていない
                break all_check;
              }
              //}
            }

            // ここでprescale分かける？
            Xarea1.push([
              vertice_points[0],
              vertice_points[1],
              vertice_points[2],
              vertice_points[3],
              vertice_points[4],
              vertice_points[5],
              vertice_points[8],
              vertice_points[9],
              vertice_points[10],
              vertice_points[11],
              item.value,
            ]); //メッシュの5点の2次元座標と，valueの値を保存する

            const pre_scale: number =
              (1 * Math.abs(item.value)) / loadList.wMax;
            offset3 = offset1 + pre_scale;
            offset4 = offset2 - pre_scale;
            offset1 = offset0;
            offset2 = offset0 * -1;
          } else if (item.name.indexOf(ThreeLoadMemberPoint.id) !== -1) {
            // 集中荷重
            const scale: number = this.helper.getScale(
              Math.abs(item.value),
              loadList.pMax
            );
            editor.setSize(item, scale);
            // オフセットする
            if (item.value > 0) {
              editor.setOffset(item, offset3 + offset0);
              offset3 += scale * 1.0; // オフセット距離に高さを加算する
            } else {
              editor.setOffset(item, offset4 - offset0);
              offset4 -= scale * 1.0; // オフセット距離に高さを加算する
            }
            offset1 = offset3;
            offset2 = offset4;
          }
        });
      });

      // 分布荷重（絶対座標方向）
      ["gx", "gy", "gz"].forEach((k) => {
        let offset1 = offset0;
        let offset2 = offset0;
        list[k].forEach((item) => {
          const editor = item.editor;

          // 大きさを変更する
          if (item.name.indexOf(ThreeLoadDistribute.id) !== -1) {
            // 分布荷重
            const scale: number = this.helper.getScale(
              Math.abs(item.value),
              loadList.wMax
            );
            editor.setSize(item, scale);
            // オフセットする
            if (item.value > 0) {
              editor.setGlobalOffset(item, offset1, k);
              offset1 += scale * 1.0; // オフセット距離に高さを加算する
            } else {
              editor.setGlobalOffset(item, offset2, k);
              offset2 -= scale * 1.0; // オフセット距離に高さを加算する
            }
          } else if (item.name.indexOf(ThreeLoadMemberPoint.id) !== -1) {
            // 集中荷重
            const scale: number = this.helper.getScale(
              Math.abs(item.value),
              loadList.pMax
            );
            editor.setSize(item, scale);
            // オフセットする
            if (item.value > 0) {
              editor.setGlobalOffset(item, offset1, k);
              offset1 += scale * 1.0; // オフセット距離に高さを加算する
            } else {
              editor.setGlobalOffset(item, offset2, k);
              offset2 -= scale * 1.0; // オフセット距離に高さを加算する
            }
          }
        });
      });

      // 部材軸方向荷重
      list["x"].forEach((item) => {
        const editor = item.editor;
        // 大きさを変更する
        if (item.name.indexOf(ThreeLoadMemberPoint.id) !== -1) {
          const scale: number = this.helper.getScale(
            Math.abs(item.value),
            loadList.pMax
          );
          editor.setSize(item, scale);
        } else if (item.name.indexOf(ThreeLoadAxial.id) !== -1) {
          const scale: number = this.helper.getScale(
            Math.abs(item.value),
            loadList.qMax
          );
          editor.setSize(item, scale);
        }
      });
    }
  }

  // 当たり判定を行う
  private self_raycaster(points, area, pattern: string) {
    const d = 0.001; //当たり判定の緩和値

    // 接触判定->結果はjudgeで返す
    let judge: string = "";
    // newLoadは追加面。oldLoadは既存面。判定緩和で追加面を小さくする。全て矩形とみなす
    const newLoad = {
      leftX: points[2],
      rightX: points[8],
      topY: Math.max(points[1], points[3], points[9], points[17]),
      bottomY: Math.min(points[1], points[3], points[9], points[17]),
    };
    const oldLoad = {
      leftX: area[2],
      rightX: area[6],
      topY: Math.max(area[1], area[3], area[7], area[9]),
      bottomY: Math.min(area[1], area[3], area[7], area[9]),
    };
    // pointsは追加面、areaは既存面を示す。
    switch (pattern) {
      case "x":
        // 追加面のサイズを調整し、当たり判定を緩和する。
        if (
          oldLoad.leftX < newLoad.leftX - d &&
          newLoad.leftX + d < oldLoad.rightX
        ) {
          judge = "Hit"; //荷重の左側が既存面の内部にある状態
        } else if (
          oldLoad.leftX < newLoad.rightX - d &&
          newLoad.rightX + d < oldLoad.rightX
        ) {
          judge = "Hit"; //荷重の右側が既存面の内部にある状態
        } else if (
          newLoad.leftX - d < oldLoad.leftX &&
          newLoad.leftX - d < oldLoad.rightX &&
          newLoad.rightX + d > oldLoad.leftX &&
          newLoad.rightX + d > oldLoad.rightX
        ) {
          judge = "Hit"; //荷重の面が既存の面を全て含む状態
        } else {
          judge = "NotHit";
        }
        break;
      case "y":
        if (
          oldLoad.bottomY < newLoad.bottomY &&
          newLoad.bottomY < oldLoad.topY
        ) {
          judge = "Hit"; //荷重の下側が既存面の内部にある状態
        } else if (
          oldLoad.bottomY < newLoad.topY &&
          newLoad.topY < oldLoad.topY
        ) {
          judge = "Hit"; //荷重の上側が既存面の内部にある状態
        } else if (
          newLoad.bottomY <= oldLoad.bottomY &&
          newLoad.bottomY <= oldLoad.topY &&
          newLoad.topY >= oldLoad.bottomY &&
          newLoad.topY >= oldLoad.topY
        ) {
          judge = "Hit"; //荷重の面が既存の面を全て含む状態
        } else {
          judge = "NotHit";
        }
        break;
    }

    return judge;
  }

  // マウス位置とぶつかったオブジェクトを検出する
  public detectObject(raycaster: THREE.Raycaster, action: string): void {
    return; // マウスの位置と 当たり判定の位置が ずれてる・・・使いにくいので
    if (!(this.currentIndex in this.AllCaseLoadList)) {
      this.selecteddObject = null;
      return; // 対象がなければ何もしない
    }

    const targetLoad = this.AllCaseLoadList[this.currentIndex];
    const ThreeObject: THREE.Object3D = targetLoad.ThreeObject;

    // 交差しているオブジェクトを取得
    const intersects = raycaster.intersectObjects(ThreeObject.children, true);
    if (intersects.length <= 0) {
      return;
    }

    // マウス位置とぶつかったオブジェクトの親を取得
    const item: any = this.getParent(intersects[0].object);
    if (item === null) {
      return;
    }

    if (action === "hover") {
      if (this.selecteddObject !== null) {
        if (this.selecteddObject === item) {
          return;
        }
      }
    }

    // 全てのハイライトを元に戻す
    this.selectChange(-1, 0);

    //全てのオブジェクトをデフォルトの状態にする
    if (!("editor" in item)) {
      return;
    }

    this.selecteddObject = item;

    const editor: any = item["editor"];
    editor.setColor(item, action);

    this.scene.render();
  }

  // マウス位置とぶつかったオブジェクトの親を取得
  private getParent(item): any {
    if (!("name" in item)) {
      return null;
    }

    for (const key of Object.keys(this.loadEditor)) {
      if (item.name.indexOf(key) !== -1) {
        return item;
      }
    }

    if (!("parent" in item)) {
      return null;
    }

    return this.getParent(item.parent);
  }
}
