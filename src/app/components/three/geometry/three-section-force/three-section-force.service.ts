import { Injectable } from "@angular/core";
import * as THREE from "three";

import { SceneService } from "../../scene.service";
import { DataHelperModule } from "../../../../providers/data-helper.module";

import { InputNodesService } from "../../../input/input-nodes/input-nodes.service";
import { InputMembersService } from "../../../input/input-members/input-members.service";
import { InputNoticePointsService } from "../../../input/input-notice-points/input-notice-points.service";
import { ThreeMembersService } from "../three-members.service";
import { ThreeNodesService } from "../three-nodes.service";
import { ThreeSectionForceMeshService } from "./three-force-mesh";
import { MaxMinService } from "../../max-min/max-min.service";
import { forEach } from "jszip";

@Injectable({
  providedIn: "root",
})
export class ThreeSectionForceService {
  private ThreeObject1: THREE.Object3D;
  private ThreeObject2: THREE.Object3D;
  private currentIndex: string;
  private currentMode: string;
  public currentRadio: string;
  public memSeForce: any[];
  private scale: number;
  private textCount: number; // 文字を出力する数
  private params: any; // GUIの表示制御
  private radioButtons3D = [
    "axialForce",
    "shearForceY",
    "shearForceZ",
    "torsionalMoment",
    "momentY",
    "momentZ",
  ];
  public verticalList: any[];
  private radioButtons2D = ["axialForce", "shearForceY", "momentZ"];
  private radioButtons = this.radioButtons3D || this.radioButtons2D;
  private gui: any;
  private gui_dimension: number = null;

  private mesh: ThreeSectionForceMeshService;

  public max: number;
  public min: number;

  private nodeData: any;
  private memberData: any;
  private fsecData = { fsec: null, comb_fsec: null, pick_fsec: null };
  private max_values = { fsec: null, comb_fsec: null, pick_fsec: null };
  public value_ranges = { fsec: null, comb_fsec: null, pick_fsec: null };

  constructor(
    private scene: SceneService,
    private max_min: MaxMinService,
    private helper: DataHelperModule,
    private node: InputNodesService,
    private member: InputMembersService,
    private three_node: ThreeNodesService,
    private three_member: ThreeMembersService,
    private data: InputNoticePointsService
  ) {
    this.memSeForce = new Array();
    this.ThreeObject1 = new THREE.Object3D();
    this.ThreeObject1.visible = false; // 呼び出されるまで非表示
    this.ThreeObject2 = new THREE.Object3D();
    this.ThreeObject2.visible = false; // 呼び出されるまで非表示

    // フォントをロード
    const loader = new THREE.FontLoader();
    loader.load("./assets/fonts/helvetiker_regular.typeface.json", (font) => {
      this.mesh = new ThreeSectionForceMeshService(font);
      this.ClearData();
      this.scene.add(this.ThreeObject1);
      this.scene.add(this.ThreeObject2);
    });

    // gui
    this.scale = 100;
    this.textCount = 15; // 上位 15% の文字だけ出力する
    this.gui = null;
  }

  public visibleChange(ModeName: string): void {
    if (this.currentMode === ModeName) {
      return;
    }
    this.currentMode = ModeName;
    if (ModeName.length === 0) {
      this.ThreeObject1.visible = false;
      this.ThreeObject2.visible = false;
      this.guiDisable();
      return;
    }

    this.guiEnable();
    this.changeMesh();
    this.onResize();
  }

  // データをクリアする
  public ClearData(): void {
    for (const children of [
      this.ThreeObject1.children,
      this.ThreeObject2.children,
    ]) {
      for (const mesh of children) {
        // 文字を削除する
        let text: any = mesh.getObjectByName("text");
        while (text !== undefined) {
          mesh.remove(text);
          // text.dispose();
          text = mesh.getObjectByName("text");
        }
        // 文字以外の子要素を削除する
        while (mesh.children.length > 0) {
          const object = mesh.children[0];
          object.parent.remove(object);
        }
      }
    }

    // オブジェクトを削除する
    this.ThreeObject1.children = new Array();
    this.ThreeObject2.children = new Array();
  }

  private setGuiParams(): void {
    if (this.gui !== null && this.gui_dimension === this.helper.dimension) {
      return;
    }

    this.gui_dimension = this.helper.dimension;

    if (this.helper.dimension === 3) {
      this.radioButtons = this.radioButtons3D;
    } else {
      this.radioButtons = this.radioButtons2D;
    }
    this.params = {
      forceScale: this.scale,
      textCount: this.textCount,
    };
    for (const key of this.radioButtons) {
      this.params[key] = false;
    }

    if (this.helper.dimension === 3) {
      this.params.momentY = true; // 初期値（3D）
      this.currentRadio = "momentY";
    } else {
      this.params.momentZ = true; // 初期値（2D）
      this.currentRadio = "momentZ";
    }
  }

  private guiEnable(): void {
    if (this.gui !== null && this.gui_dimension === this.helper.dimension) {
      return;
    }

    const gui_step: number = 1;
    const gui_max_scale: number = 1000;

    this.gui = {
      forceScale: this.scene.gui
        .add(this.params, "forceScale", 0, gui_max_scale)
        .step(gui_step)
        .onChange((value) => {
          // guiによる設定
          this.scale = value;
          this.onResize();
          this.scene.render();
        }),
    };

    // this.gui['textCount'] = this.scene.gui.add(this.params, 'textCount', 0, 100).step(10).onFinishChange((value) => {
    //   // guiによる設定
    //   this.textCount = value;
    //   this.changeMesh();
    //   this.onResize();
    //   this.scene.render();
    // });

    for (const key of this.radioButtons) {
      this.gui[key] = this.scene.gui
        .add(this.params, key, this.params[key])
        .listen()
        .onChange((value) => {
          if (value === true) {
            this.setGuiRadio(key);
          } else {
            this.setGuiRadio("");
          }
          this.changeMesh();
          // if(this.verticalList.length > 0){
          //   this.verticalList.forEach((mem) =>{
          //     this.createPanel1(mem['vertexlist'], mem['key']);
          //   })
          // }
          
          const key1: string =
            key === "axialForce" || key === "torsionalMoment"
              ? "x"
              : key === "shearForceY" || key === "momentY"
                ? "y"
                : "z";
          this.max_min._getMaxMinValue(
            this.value_ranges[this.currentMode][this.currentIndex][key1],
            "fsec",
            this.currentRadio
          );
          this.onResize();
          this.scene.render();
        });
    }
  }

  private guiDisable(): void {
    if (this.gui === null) {
      return;
    }
    for (const key of Object.keys(this.gui)) {
      this.scene.gui.remove(this.gui[key]);
    }
    this.gui = null;
  }

  public changeRadioButtons(check) {
    for (const key of this.radioButtons) {
      if (key === check) {
        this.params[key] = true;
      } else {
        this.params[key] = false;
      }
    }
    this.changeMesh();
    this.onResize();
    this.scene.render();
  }

  // gui 選択されたチェックボックス以外をOFFにする
  private setGuiRadio(target: string): void {
    for (const key of this.radioButtons) {
      this.params[key] = false;
    }
    this.params[target] = true;
  }

  // 解析結果をセットする
  public setResultData(
    fsecJson: any,
    max_values: any,
    value_ranges: any
  ): void {
    const keys = Object.keys(fsecJson);
    if (keys.length === 0) {
      this.ClearData();
      return;
    }

    this.nodeData = this.node.getNodeJson(0);
    this.memberData = this.member.getMemberJson(0);
    this.fsecData.fsec = fsecJson;
    this.max_values.fsec = max_values;
    this.value_ranges.fsec = value_ranges;
    this.currentMode = "fsec";
    this.currentIndex = keys[0];
    this.changeMesh();
    this.ThreeObject1.visible = false; // 呼び出されるまで非表示
    this.ThreeObject2.visible = false; // 呼び出されるまで非表示
    this.currentMode = "";
  }
  // combine
  public setCombResultData(
    fsecJson: any,
    max_values: any,
    value_range: any
  ): void {
    this.fsecData.comb_fsec = fsecJson;
    this.max_values.comb_fsec = max_values;
    this.value_ranges.comb_fsec = value_range;
  }
  // pick up
  public setPickupResultData(
    fsecJson: any,
    max_values: any,
    value_range: any
  ): void {
    this.fsecData.pick_fsec = fsecJson;
    this.max_values.pick_fsec = max_values;
    this.value_ranges.pick_fsec = value_range;
  }

  private changeMesh(): void {
    if (this.currentIndex === undefined) {
      return;
    }

    this.setGuiParams();

    let key1: string;
    let key2: string;
    if (this.params.axialForce === true) {
      this.currentRadio = "axialForce";
      key1 = "fx";
      key2 = this.helper.dimension === 3 ? "z" : "y";
    } else if (this.params.torsionalMoment === true) {
      // ねじり曲げモーメント
      this.currentRadio = "torsionalMoment";
      key1 = "mx";
      key2 = "z";
    } else if (this.params.shearForceY === true) {
      // Y方向のせん断力
      this.currentRadio = "shearForceY";
      key1 = "fy";
      key2 = "y";
    } else if (this.params.momentY === true) {
      // Y軸周りの曲げモーメント
      this.currentRadio = "momentY";
      key1 = "my";
      key2 = "z";
    } else if (this.params.shearForceZ === true) {
      // Z方向のせん断力
      this.currentRadio = "shearForceZ";
      key1 = "fz";
      key2 = "z";
    } else if (this.params.momentZ === true) {
      // Z軸周りの曲げモーメント
      this.currentRadio = "momentZ";
      key1 = "mz";
      key2 = "y";
    } else {
      this.params[this.currentRadio] = true;
      this.changeMesh();
      return;
    }

    // 最初のケースを代表として描画する
    if (!(this.currentMode in this.fsecData)) {
      this.ThreeObject1.visible = false;
      this.ThreeObject2.visible = false;
      this.guiDisable();
      return;
    }

    const fsecList = this.fsecData[this.currentMode];
    if (!(this.currentIndex in fsecList)) {
      this.ThreeObject1.visible = false;
      this.ThreeObject2.visible = false;
      this.guiDisable();
      return;
    }

    /* if (this.gui === null) {
      this.guiEnable();
    } */

    const fsecDatas = [];
    const f = fsecList[this.currentIndex];
    let flg = false;
    for (const k of [key1 + "_max", key1 + "_min"]) {
      if (k in f) {
        fsecDatas.push(f[k]);
        flg = true;
      }
    }
    if (flg === false) {
      fsecDatas.push(f);
      this.ThreeObject1.visible = true;
      this.ThreeObject2.visible = false;
    } else {
      this.ThreeObject1.visible = true;
      this.ThreeObject2.visible = true;
    }

    const ThreeObjects: THREE.Object3D[] = [
      this.ThreeObject1,
      this.ThreeObject2,
    ];

    const textValues = [];
    const textValMemNo = [];
    const ll = [];
    for (let i = 0; i < fsecDatas.length; i++) {
      const fsecData = fsecDatas[i];
      const ThreeObject = ThreeObjects[i];

      // オブジェクト方が多い場合、データとオブジェクトの数を合わせる
      for (let i = fsecData.length + 1; i < ThreeObject.children.length; i++) {
        ThreeObject.children.splice(0, 1);
      }
      let nodei: THREE.Vector3;
      let nodej: THREE.Vector3;
      let localAxis: any;
      let len: number;
      let L1: number = 0;
      let L2: number = 0;
      let P1: number = 0;
      let P2: number = 0;
      let counter = 0;
      this.memSeForce = new Array();
      for (const fsec of fsecData) {
        if (fsec["m"] !== "" || fsec["n"] !== "") {
          if (!this.memSeForce.includes(fsec))
            this.memSeForce.push(fsec);
        }
        const id = fsec["m"].trim();
        if (id.length > 0) {
          // 節点データを集計する
          const m = this.memberData[id];
          const ni = this.nodeData[m.ni];
          const nj = this.nodeData[m.nj];
          nodei = new THREE.Vector3(ni.x, ni.y, ni.z);
          nodej = new THREE.Vector3(nj.x, nj.y, nj.z);
          // 部材の座標軸を取得
          localAxis = this.three_member.localAxis(
            ni.x,
            ni.y,
            ni.z,
            nj.x,
            nj.y,
            nj.z,
            m.cg
          );
          len = new THREE.Vector3(
            nj.x - ni.x,
            nj.y - ni.y,
            nj.z - ni.z
          ).length();
          L1 = 0;
          P1 = fsec[key1];
          textValues.push(P1);
          ll.push(L1);
        } else {
          let item = null;
          if (ThreeObject.children.length > counter) {
            item = ThreeObject.children[counter];
          }
          const LL = fsec["l"];
          P2 = fsec[key1] - 0;
          textValues.push(P2);
          L2 = Math.round((len - LL) * 1000) / 1000;
          ll.push(L2);
          if (item === null) {
            const mesh = this.mesh.create(
              nodei,
              nodej,
              localAxis,
              key2,
              L1,
              L2,
              P1,
              P2
            );
            ThreeObject.add(mesh);
          } else {
            this.mesh.change(
              item,
              nodei,
              nodej,
              localAxis,
              key2,
              L1,
              L2,
              P1,
              P2
            );
          }
          P1 = P2;
          L1 = LL;
          ll.push(L1);
          counter++;
        }
      }
    }
    // 主な点に文字を追加する
    // if(this.helper.dimension === 3) return;
    // 断面力の大きい順に並び変える
    textValues.sort((a, b) => {
      return Math.abs(a) < Math.abs(b) ? 1 : -1;
    });
    //上位、下位の順位の数値を選出する
    let targetValues = Array.from(new Set(textValues));
    this.max = targetValues[0];
    this.min = targetValues[targetValues.length - 1];
    const count = Math.floor(textValues.length * (this.textCount / 100));
    let Upper = targetValues;
    let target = [];
    textValMemNo.forEach((data) => {
      target.push(data.val);
    });
    target.sort((a, b) => {
      return Math.abs(a) < Math.abs(b) ? 1 : -1;
    });
    if (count < targetValues.length) {
      Upper = targetValues.slice(1, count);
    }
    const targetList = Array.from(new Set(Upper));
    targetList.push(this.max);
    let c = [];
    for (let i = 0; i < ThreeObjects.length; i++) {
      const ThreeObject = ThreeObjects[i];
      if (ThreeObject.visible === false) {
        continue; // 非表示の ThreeObject の文字は追加しない
      }
      for (const mesh of ThreeObject.children) {
        let f1 = false;
        if (targetList.find((v) => v === mesh["P1"]) !== undefined) {
          f1 = true;
          c.push(mesh);
        }
        let f2 = false;
        if (targetList.find((v) => v === mesh["P2"]) !== undefined) {
          f2 = true;
          c.push(mesh);
        }
        this.mesh.setText(mesh, f1, f2);
      }
    }
    var meshView = Array.from(new Set(c));
    var memberNo = this.getMemberNoLocation();
    memberNo.forEach((mem) => {
      let er = [];
      meshView.forEach((th) => {
        let ni = new THREE.Vector3(mem.nodei.x, mem.nodei.y, mem.nodei.z);
        let nj = new THREE.Vector3(mem.nodej.x, mem.nodej.y, mem.nodej.z);
        if (th.position.equals(ni) || th.position.equals(nj)) {
          er.push(th);
        }
      });
      if (er.length > 0) {
        let p = [];
        er.forEach((mesh) => {
          p.push(mesh["P1"]);
          p.push(mesh["P2"]);
        });
        let max = p[0];
        for (let i = 0; i < p.length; i++) {
          if (p[i] > max) {
            max = p[i];
          }
        }
        for (let i = 0; i < er.length; i++) {
          if (
            Number(er[i]["L"].toFixed(2)) <= this.findSmallestPositiveValue(er)
          ) {
            if (er[i]["P1"] < er[i]["P2"]) {
              this.mesh.setText(er[i], false, false);
            } else this.mesh.setText(er[i], false, false);
          }
        }
      }
    });
  }

  // データが変更された時に呼び出される
  // 変数 this.targetData に値をセットする
  public changeData(index: number, ModeName: string): void {
    this.currentIndex = index.toString();
    this.currentMode = ModeName;
    if (this.gui === null) {
      this.guiEnable();
    }
    this.changeMesh();
    this.onResize();
  }

  private baseScale(): number {
    return this.three_node.baseScale * 5;
  }

  // 断面力図を描く
  private onResize(): void {
    if (!(this.currentMode in this.max_values)) {
      return;
    }

    const scale1: number = this.scale / 100;
    const scale2: number = this.baseScale();
    const max_values = this.max_values[this.currentMode];
    if (!(this.currentIndex in max_values)) {
      return;
    }
    const max_value = max_values[this.currentIndex];
    if (max_value === undefined) {
      return;
    }

    let scale3: number = 1;
    if (this.params.axialForce === true) {
      scale3 = max_value["fx"];
    } else if (this.params.torsionalMoment === true) {
      // ねじり曲げモーメント
      scale3 = max_value["mx"];
    } else if (this.params.shearForceY === true) {
      // Y方向のせん断力
      scale3 = max_value["fy"];
    } else if (this.params.momentY === true) {
      // Y軸周りの曲げモーメント
      scale3 = max_value["my"];
    } else if (this.params.shearForceZ === true) {
      // Z方向のせん断力
      scale3 = max_value["fz"];
    } else if (this.params.momentZ === true) {
      // Z軸周りの曲げモーメント
      scale3 = max_value["mz"];
    } else {
      return;
    }

    const scale: number = (scale1 * scale2) / scale3;

    if (this.ThreeObject1.visible === true) {
      this.ThreeObject1.children.forEach((item) => {
        this.mesh.setScale(item, scale);
      });
    }
    if (this.ThreeObject2.visible === true) {
      this.ThreeObject2.children.forEach((item) => {
        this.mesh.setScale(item, scale);
      });
    }
  }
  private findSmallestPositiveValue(arr: any) {
    let smallestPositive = arr[0]["L"];
    arr.forEach((d) => {
      for (let i = 0; i < 2; i++) {
        let key = "L" + (i + 1);
        if (smallestPositive > d[key] && d[key] > 0) {
          smallestPositive = d[key];
        }
      }
    });

    return Number(smallestPositive.toFixed(2));
  }
  private getMemberNoLocation() {
    const num = new Array();
    const arr = [];
    var member = this.data.getNoticePointsJson();
    member.forEach((item) => {
      num.push(item["m"]);
    });
    num.forEach((obj) => {
      let mem = this.member.getMemberNo(obj.toString());
      let nodei = this.node.getNodePos(mem.ni);
      let nodej = this.node.getNodePos(mem.nj);
      mem.nodei = nodei;
      mem.nodej = nodej;
      arr.push(mem);
    });
    return arr;
  }

  public createPanel(vertexlist, row): void {
    const points = [];
    const geometrys: THREE.BufferGeometry[] = [];
    for (const p of vertexlist) {
      points.push(new THREE.Vector3(p[0], p[1], p[2]));
    }

    var vertexColors = [
      [1.0, 0.0, 0.0],
      [0.0, 1.0, 0.0],
      [0.0, 0.0, 1.0],
      [1.0, 1.0, 0.0],
    ];

    var indices = new Uint16Array([0, 1, 2, 3, 4, 5, 6, 5, 4, 8, 7, 3]);

    var vertices = new Float32Array(vertexlist.length * 3);
    var colors = new Float32Array(vertexlist.length * 3);
    for (var i = 0; i < vertexlist.length; i++) {
      vertices[i * 3 + 0] = vertexlist[i][0];
      vertices[i * 3 + 1] = vertexlist[i][1];
      vertices[i * 3 + 2] = vertexlist[i][2];
      colors[i * 3 + 0] = vertexColors[i][0];
      colors[i * 3 + 1] = vertexColors[i][1];
      colors[i * 3 + 2] = vertexColors[i][2];
    }

    var shader = {
      fragmentShader: [
        "varying mediump vec3 varingrgb;",
        "void main() {",
        "gl_FragColor = vec4(varingrgb, 1.0);",
        "}",
      ].join("\n"),
      vertexShader: [
        "attribute vec3 verpos;",
        "attribute vec3 verrgb;",
        "varying vec3 varingrgb;",
        "void main() {",
        "gl_Position = projectionMatrix * modelViewMatrix * vec4(verpos, 1.0);",
        "varingrgb = verrgb;",
        "}",
      ].join("\n"),
    };

    var materialShader = new THREE.ShaderMaterial({
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader,
    });

    // 三角形を作る
    // geometrys.push(new THREE.BufferGeometry().setFromPoints([points[0],points[1],points[2], points[3]]));
    // // 四角形が作れる場合
    // if(points.length >2)
    //   geometrys.push(new THREE.BufferGeometry().setFromPoints([points[3],points[0],points[2]]));

    // const material = new THREE.MeshBasicMaterial({
    //   transparent: true,
    //   side: THREE.DoubleSide,
    //   color: 0x7f8F9F,
    //   opacity: 0.7,
    // });
    // for(const g of geometrys) {

    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    // g.setIndex(new THREE.BufferAttribute(indices,  1));
    // g.setAttribute('verpos', new THREE.BufferAttribute(vertices, 3));
    // g.setAttribute('verrgb', new THREE.BufferAttribute(colors, 3));
    var g1 = new THREE.CylinderBufferGeometry(2, 5, 20, 32, 1, true);
    g1.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    var material = new THREE.ShaderMaterial({
      uniforms: {
        color1: {
          value: new THREE.Color("red"),
        },
        color2: {
          value: new THREE.Color("purple"),
        },
      },
      vertexShader: `
          varying vec2 vUv;

          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
          }
        `,
      fragmentShader: `
          uniform vec3 color1;
          uniform vec3 color2;

          varying vec2 vUv;

          void main() {

            gl_FragColor = vec4(mix(color1, color2, vUv.y), 1.0);
          }
        `,
      wireframe: true,
    });
    const mesh = new THREE.Mesh(g1, material);
    mesh.name = "panel-" + row.toString();
    this.scene.add(mesh);
    // }
  }

  public createPanel1(vertexlist, key): void {
    //this.verticalList.push({vertexlist, key});
    let re = [];
    for (const item of vertexlist) {
      let arr = [];
      this.memSeForce.forEach((mem: any) => {
        var test = this.node.getNodePos(mem['n']);
        if (test.x === item[0] && test.y === item[1] && test.z === item[2]) {
          if (!arr.includes(mem))
            arr.push(mem);
        }
      })

      if (arr.length > 1) {
        let max = arr[0][this.checkRadioButton()];
        let p = 0;
        arr.forEach((a, index) => {
          if (max < a.val) {
            max = a.val;
            p = index
          }
        })
        re.push(arr[p]);
      } else {
        re.push(arr[0])
      }
    }
    re.sort((a, b) => {
      return a[this.checkRadioButton()] < b[this.checkRadioButton()] ? 1 : -1;
    })
    console.log("re", re)
    var points = [];
    const geometrys: THREE.BufferGeometry[] = [];
    for (const p of vertexlist) {
      points.push(new THREE.Vector3(p[0], p[1], p[2]));
    }
    var geometry = new THREE.BufferGeometry();
    var indices = [];

    var vertices = [];
    var normals = [];
    var colors = [];

    var size = 4;
    var segments = 4;

    // var halfSize = size / 2;
    // var segmentSize = size / segments;

    var _color = new THREE.Color();
    // // generate vertices, normals and color data for a simple grid geometry
    // for (let i = 0; i <= segments; i++) {
    //   const y = i * segmentSize - halfSize;
    //   for (let j = 0; j <= segments; j++) {
    //     const x = j * segmentSize - halfSize;
    //     vertices.push(x, -y, 0);
    //     normals.push(0, 0, 1);
    //     const r = x / size + 0.5;
    //     const g = y / size + 0.5;
    //     _color.setRGB(r, g, 1);
    //     colors.push(_color.r, _color.g, _color.b);
    //   }
    // }

    // 0,255,255 cygan
    // 255,0,0 red
    // 158, 97, 97
    // 107, 148, 148

    // var arrColors = [
    //   [0,255,255],
    //   [255,0,0],
    //   [158,97,97],
    //   [107,148,148],
    // ];
    var arrColors = [
      [0, 1, 0],
      [1, 1, 0],
      [1, 1, 0],
      [1, 0, 0]
    ];
    vertexlist.forEach((p) => {
      //for (let p of vertexlist) {
      vertices.push(p[0], p[1], p[2]);
      normals.push(0, 0, 1);
      const r = p[0] / size + 0.5;
      const g = p[1] / size + 0.5;
      _color.setRGB(r, g, 1);
      //colors.push(_color.r, _color.g, _color.b);
      re.forEach((t, index) => {
        var test = this.node.getNodePos(t['n']);
        if (test.x === p[0] && test.y === p[1] && test.z === p[2]) {
          colors.push(arrColors[index][0], arrColors[index][1], arrColors[index][2]);
        }
      })
      //}
    });

    console.log("vertices", vertices);
    console.log("colors", colors);

    // //generate indices (data for element array buffer)
    // for (let i = 0; i < segments; i++) {
    //   for (let j = 0; j < segments; j++) {
    //     const a = i * (segments + key) + (j + 1);
    //     const b = i * (segments + key) + j;
    //     const c = (i + 1) * (segments + key) + j ;
    //     const d = (i + 1) * (segments + key) + (j + 1);
    //     generate two faces (triangles) per iteration
    //     indices.push(a, b, d); // face one
    //     indices.push(b, c, d); // face two
    //   }
    // }

    let lgn = vertexlist.length;
    for (let i = 0; i < lgn; i++) {
      for (let j = 0; j < lgn; j++) {
        const a = i * (lgn + 1) + (j + 1);
        const b = i * (lgn + 1) + j;
        const c = (i + 1) * (lgn + 1) + j;
        const d = (i + 1) * (lgn + 1) + (j + 1);
        // generate two faces (triangles) per iteration
        indices.push(a, b, d); // face one
        indices.push(b, c, d); // face two
      }
    }
    // console.log(indices);

    geometry.setIndex([0, 1, 2,
      0, 2, 1,
      1, 2, 0,
      1, 0, 2,
      2, 1, 0,
      2, 0, 1,
      0, 2, 3,
      0, 3, 2,
      2, 0, 3,
      2, 3, 0,
      3, 0, 2,
      3, 2, 0]);
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    const faceIndices = geometry.getIndex().array;
    geometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(normals, 3)
    );
    geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    const material = new THREE.MeshPhongMaterial({
      // side: THREE.DoubleSide,
      flatShading: true,
      vertexColors: true,
    });
    var mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
    // }
  }
  public checkRadioButton() {
    let key1: string;
    let key2: string;
    if (this.params.axialForce === true) {
      this.currentRadio = "axialForce";
      key1 = "fx";
    } else if (this.params.torsionalMoment === true) {
      // ねじり曲げモーメント
      this.currentRadio = "torsionalMoment";
      key1 = "mx";

    } else if (this.params.shearForceY === true) {
      // Y方向のせん断力
      this.currentRadio = "shearForceY";
      key1 = "fy";

    } else if (this.params.momentY === true) {
      // Y軸周りの曲げモーメント
      this.currentRadio = "momentY";
      key1 = "my";

    } else if (this.params.shearForceZ === true) {
      // Z方向のせん断力
      this.currentRadio = "shearForceZ";
      key1 = "fz";

    } else if (this.params.momentZ === true) {
      // Z軸周りの曲げモーメント
      this.currentRadio = "momentZ";
      key1 = "mz";
    }
    return key1;
  }
}