import { Injectable } from "@angular/core";
import * as THREE from "three";
import { ThreeComponent } from "./three.component";
import { GUI } from "./libs/dat.gui.module.js";
import { OrbitControls } from "./libs/OrbitControls.js";
import { OrbitControlsGizmo } from "./libs/OrbitControlsGizmo.js";
import { CSS2DRenderer, CSS2DObject } from "./libs/CSS2DRenderer.js";
import { SafeHtml } from "@angular/platform-browser";
import { DataHelperModule } from "../../providers/data-helper.module";

@Injectable({
  providedIn: "root",
})
export class SceneService {
  // シーン
  private scene: THREE.Scene;

  // レンダラー
  private renderer: THREE.WebGLRenderer = null;
  private labelRenderer: CSS2DRenderer = null;

  // ギズモ
  private controlsGizmo: HTMLCanvasElement = null;
  //private controlsGizmoParent: OrbitControlsGizmo;

  // カメラ
  private camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  private PerspectiveCamera: THREE.PerspectiveCamera;
  private OrthographicCamera: THREE.OrthographicCamera;
  private aspectRatio: number;
  private Width: number;
  private Height: number;
  private controls: OrbitControls;

  // helper
  private axisHelper: THREE.AxesHelper;
  private GridHelper: THREE.GridHelper;
  private GridDistance: number;

  // gui
  public gui: GUI;
  private params: any; // GridHelperの表示制御

  public max_Three: string;
  public min_Three: string;
  public max_Three_m: string;
  public min_Three_m: string;
  public maxminFlag: boolean;

  // public maxmin: any[] = new Array();

  public Three_unit: string;
  public ModeName: any;
  public index: any;
  public max: any;
  public min: any;
  public max_m: any;
  public min_m: any;
  public max2: any;
  public min2: any;
  public max2_m: any;
  public min2_m: any;
  public radio: any;

  // 初期化
  public constructor(private helper: DataHelperModule) {
    // シーンを作成
    this.scene = new THREE.Scene();
    // シーンの背景を白に設定
    // this.scene.background = new THREE.Color(0xf0f0f0);
    this.scene.background = new THREE.Color(0xffffff);
    // レンダラーをバインド
    this.render = this.render.bind(this);

    // gui
    this.params = {
      GridHelper: true,
      Perspective: true,
      ReDraw: this.render,
    };
  }

  public OnInit(
    aspectRatio: number,
    canvasElement: HTMLCanvasElement,
    deviceRatio: number,
    Width: number,
    Height: number
  ): void {
    this.controls = null;
    // カメラ
    this.aspectRatio = aspectRatio;
    this.Width = Width;
    this.Height = Height;
    this.PerspectiveCamera = new THREE.PerspectiveCamera(
      70,
      aspectRatio,
      0.1,
      1000
    );
    this.PerspectiveCamera.position.set(0, -20, 50);
    this.OrthographicCamera = new THREE.OrthographicCamera(
      -Width / 10,
      Width / 10,
      Height / 10,
      -Height / 10,
      -1000,
      1000
    );
    this.OrthographicCamera.position.set(0, 0, 10);
    this.initCamera(aspectRatio, Width, Height);
    // 環境光源
    this.add(new THREE.AmbientLight(0xf0f0f0));
    // レンダラー
    this.createRender(canvasElement, deviceRatio, Width, Height);
    // コントロール
    this.addControls();

    // 床面を生成する
    this.createHelper();

    //
    this.gui = new GUI();
    this.gui.domElement.id = "gui_css";
    this.gui.add(this.params, "GridHelper").onChange((value) => {
      // guiによる設定
      this.axisHelper.visible = value;
      this.GridHelper.visible = value;
      this.render();
    });
    this.gui.add(this.params, "Perspective").onChange((value) => {
      if (this.helper.dimension === 3) {
        this.OrthographicCamera_onChange(value);
      } else {
        this.params.Perspective = false;
      }
    });
    // this.gui.add( this.params, 'ReDraw' ); // あまり使わなかったので コメントアウト
    this.gui.open();

    this.changeGui(this.helper.dimension); //2Dモードで作成
  }

  private OrthographicCamera_onChange(value) {
    this.params.Perspective = value;
    const pos = this.camera.position;
    const rot = this.camera.rotation;
    this.initCamera(this.aspectRatio, this.Width, this.Height);
    // this.scene.children[this.scene.children.length - 1]
    this.controls.object = this.camera; // OrbitControl の登録カメラを変更
    this.camera.position.set(pos.x, pos.y, pos.z);
    if (this.helper.dimension === 2) {
      this.camera.position.set(0, 0, 10);
      this.controls.target.set(0, 0, 0); //this.controls.update();でターゲットにlookAtされていることが原因
    } else {
      this.camera.rotation.set(rot.x, rot.y, rot.z);
    }
    // Gizmoを作り直す
    this.addGizmo();

    this.camera.updateMatrix();
    this.controls.update();
    this.render();
  }

  // 床面を生成する
  private createHelper() {
    this.axisHelper = new THREE.AxesHelper(200);
    this.axisHelper.name = "axisHelper";
    this.scene.add(this.axisHelper);
    this.GridHelper = new THREE.GridHelper(200, 20);
    this.GridHelper.geometry.rotateX(Math.PI / 2);
    this.GridHelper.material["opacity"] = 0.2;
    this.GridHelper.material["transparent"] = true;
    this.GridHelper.name = "GridHelper";
    this.scene.add(this.GridHelper);
  }

  public setNewHelper(max: number) {
    // GridHelperの範囲の最大値は最大長さを切り上げた長さ.
    const Distance = Math.ceil(max / 10) * 10;
    if (this.GridDistance !== Distance) {
      // maxDistanceをキーに大きさを設定する。
      this.createNewScale(Distance);
      this.GridDistance = Distance;
    }
  }

  private createNewScale(Distance: number): void {
    // AxisHelperをthis.sceneから取り除く.
    this.scene.remove(this.axisHelper);

    // AxisHelperを新たに作成し、追加する.
    this.axisHelper = new THREE.AxesHelper(Distance * 2);
    this.axisHelper.name = "axisHelper";
    this.scene.add(this.axisHelper);

    // GridHelperをthis.sceneから取り除く.
    this.scene.remove(this.GridHelper);

    // GridHelperを新たに作成し、追加する.
    this.GridHelper = new THREE.GridHelper(Distance * 2, 20);
    this.GridHelper.geometry.rotateX(Math.PI / 2);
    this.GridHelper.material["opacity"] = 0.2;
    this.GridHelper.material["transparent"] = true;
    this.GridHelper.name = "GridHelper";
    this.scene.add(this.GridHelper);
  }

  // コントロール
  public addControls() {
    if (this.labelRenderer === null) return;
    this.controls = new OrbitControls(
      this.camera,
      this.labelRenderer.domElement
    );
    this.controls.damping = 0.2;
    this.controls.addEventListener("change", this.render);
    this.controls.enableRotate = this.helper.dimension === 3 ? true : false; // 2次元モードの場合はカメラの回転を無効にする

    // Gizmoを作り直す
    this.addGizmo();
  }

  // Gizmoは、カメラの切り替わりのたびに作りなおす
  private addGizmo(): void {
    // 一旦消して
    if (this.controlsGizmo !== null) {
      document.body.removeChild(this.controlsGizmo);
    }
    if (this.helper.dimension === 3) {
      // Add the Obit Controls Gizmo
      const controlsGizmo = new OrbitControlsGizmo(this.controls, {
        size: 100,
        padding: 8,
      });
      // Add the Gizmo domElement to the dom
      this.controlsGizmo = controlsGizmo.domElement;
      document.body.appendChild(this.controlsGizmo);
    } else {
      this.controlsGizmo = null;
    }
  }

  // 物体とマウスの交差判定に用いるレイキャスト
  public getRaycaster(mouse: THREE.Vector2): THREE.Raycaster {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    return raycaster;
  }

  // カメラの初期化
  public initCamera(
    aspectRatio: number = null,
    Width: number = null,
    Height: number = null
  ) {
    aspectRatio = aspectRatio === null ? this.aspectRatio : aspectRatio;
    Width = Width === null ? this.Width : Width;
    Height = Height === null ? this.Height : Height;

    const target = this.scene.getObjectByName("camera");
    if (target !== undefined) {
      this.scene.remove(this.camera);
    }
    if (this.params.Perspective && this.helper.dimension === 3) {
      this.camera = this.PerspectiveCamera;
      if (this.controls !== null) this.controls.enableRotate = true; // 回転できる
    } else {
      this.camera = this.OrthographicCamera;
      if (this.controls !== null)
        this.controls.enableRotate = this.helper.dimension === 3; // 回転できる
    }
    this.camera.name = "camera";
    this.scene.add(this.camera);
  }

  // レンダラーを初期化する
  public createRender(
    canvasElement: HTMLCanvasElement,
    deviceRatio: number,
    Width: number,
    Height: number
  ): void {
    this.renderer = new THREE.WebGLRenderer({
      preserveDrawingBuffer: true,
      canvas: canvasElement,
      alpha: true, // transparent background
      antialias: true, // smooth edges
    });
    this.renderer.setPixelRatio(deviceRatio);
    this.renderer.setSize(Width, Height);
    this.renderer.shadowMap.enabled = true;
    // this.renderer.setClearColorHex( 0x000000, 1 );

    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(Width, Height);
    this.labelRenderer.domElement.style.position = "absolute";
  }

  public labelRendererDomElement(): Node {
    return this.labelRenderer.domElement;
  }

  // リサイズ
  public onResize(deviceRatio: number, Width: number, Height: number): void {
    if ("aspect" in this.camera) {
      this.camera["aspect"] = deviceRatio;
    }
    if ("left" in this.camera) {
      this.camera["left"] = -Width / 2;
    }
    if ("right" in this.camera) {
      this.camera["right"] = Width / 2;
    }
    if ("top" in this.camera) {
      this.camera["top"] = Height / 2;
    }
    if ("bottom" in this.camera) {
      this.camera["bottom"] = -Height / 2;
    }

    this.camera.updateProjectionMatrix();
    this.renderer.setSize(Width, Height);
    this.labelRenderer.setSize(Width, Height);
    this.render();
  }

  // レンダリングする
  public render() {
    if (this.renderer === null) return;
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  }

  // レンダリングのサイズを取得する
  public getBoundingClientRect(): ClientRect | DOMRect {
    return this.renderer.domElement.getBoundingClientRect();
  }

  // シーンにオブジェクトを追加する
  public add(...threeObject: THREE.Object3D[]): void {
    for (const obj of threeObject) {
      this.scene.add(obj);
    }
  }

  // シーンのオブジェクトを削除する
  public remove(...threeObject: THREE.Object3D[]): void {
    for (const obj of threeObject) {
      this.scene.remove(obj);
    }
  }

  // シーンにオブジェクトを削除する
  public removeByName(...threeName: string[]): void {
    for (const name of threeName) {
      const target = this.scene.getObjectByName(name);
      if (target === undefined) {
        continue;
      }
      this.scene.remove(target);
    }
  }

  // ファイルに視点を保存する
  public getSettingJson(): any {
    return {
      camera: {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z,
      },
    };
  }

  // 視点を読み込む
  public setSetting(jsonData: {}): void {
    if (!("three" in jsonData)) {
      return;
    }
    const setting: any = jsonData["three"];
    const x: number = this.helper.toNumber(setting.camera.x);
    if (x !== null) {
      const y: number = this.helper.toNumber(setting.camera.y);
      if (y !== null) {
        const z: number = this.helper.toNumber(setting.camera.z);
        if (z !== null) {
          this.camera.position.set(x, y, z);
        }
      }
    }
  }

  public changeGui(dimension: number) {
    if (this.gui === undefined) {
      return;
    }

    // カメラのGUIを取り出し、可変かどうかを設定する。
    let camera: any = null;
    for (const controller of this.gui.__controllers) {
      if (controller.property === "Perspective") {
        // カメラのGUIを取り出す
        camera = controller;
        // 2Dモードであれば、触れないようにする
        if (dimension === 2) {
          camera.domElement.hidden = true;
          this.OrthographicCamera_onChange(true);
        } else {
          camera.domElement.hidden = false;
          this.OrthographicCamera_onChange(this.params.Perspective);
        }
        break;
      }
    }
  }

  public getStatus(mode, currentIndex) {
    this.ModeName = mode;
    this.index = currentIndex;
    if (this.max !== undefined && this.min !== undefined &&
        this.max_m !== undefined && this.min_m !== undefined &&
        this.max2 !== undefined && this.min2 !== undefined &&
        this.max2_m !== undefined && this.min2_m !== undefined) {
      this.getMaxMin( this.max, this.min, this.max_m, this.min_m,
                      this.max2, this.min2, this.max2_m, this.min2_m);
    }
  }

  public getMaxMinValue(value_range, mode, radio) {
    if(value_range===undefined){
      this.maxMinClear();
      return;
    }
    this.max = (value_range.max_d != undefined) ? value_range.max_d : 0;
    this.min = (value_range.min_d != undefined) ? value_range.min_d : 0;
    this.max_m = (value_range.max_d_m != undefined) ? value_range.max_d_m : '0';
    this.min_m = (value_range.min_d_m != undefined) ? value_range.min_d_m : '0';
    this.max2 = (value_range.max_r != undefined) ? value_range.max_r : 0;
    this.min2 = (value_range.min_r != undefined) ? value_range.min_r : 0;
    this.max2_m = (value_range.max_r_m != undefined) ? value_range.max_r_m : '0';
    this.min2_m = (value_range.min_r_m != undefined) ? value_range.min_r_m : '0';
    this.radio = radio;
    this.getMaxMin( this.max, this.min, this.max_m, this.min_m,
                    this.max2, this.min2, this.max2_m, this.min2_m);
  }

  public getMaxMin(max, min, max_m, min_m, max2, min2, max2_m, min2_m): void {
    if (
      this.ModeName === "fsec" ||
      this.ModeName === "comb_fsec" ||
      this.ModeName === "pik_fsec"
    ) {
      if (this.radio.includes("Force")) {
        this.Three_unit = "kN";
        this.max_Three = Number(max).toFixed(2)
                        + this.Three_unit
                        + '(' + max_m.toString() + '部材)';
        this.min_Three = Number(min).toFixed(2)
                      + this.Three_unit
                      + '(' + min_m.toString() + '部材)';
      } else if (this.radio.includes("oment")) {
        this.Three_unit = "kN・m";
        this.max_Three = Number(max2).toFixed(2)
                        + this.Three_unit
                        + '(' + max2_m.toString() + '部材)';
        this.min_Three = Number(min2).toFixed(2)
                        + this.Three_unit
                        + '(' + min2_m.toString() + '部材)';
      }

      document.getElementById("max-min").style.display = "block";
    } else if (
      this.ModeName === "disg" ||
      this.ModeName === "comb_disg" ||
      this.ModeName === "pik_disg"
    ) {
      this.Three_unit = "mm";
      this.max_Three = Number(max).toFixed(4)
                      + this.Three_unit
                      + '(' + max_m.toString() + '節点), '
                      + Number(max2).toFixed(4)
                      + '‰rad'
                      + '(' + max2_m.toString() + '節点)';
      this.min_Three = Number(min).toFixed(4)
                    + this.Three_unit
                    + '(' + min_m.toString() + '節点), '
                    + Number(min2).toFixed(4)
                    + '‰rad'
                    + '(' + min2_m.toString() + '節点)';

      document.getElementById("max-min").style.display = "block";
    } else if (
      this.ModeName === "reac" ||
      this.ModeName === "comb_reac" ||
      this.ModeName === "pik_reac"
    ) {
      this.Three_unit = "kN";
      this.max_Three = Number(max).toFixed(2)
                      + this.Three_unit
                      + '(' + max_m.toString() + '節点), '
                      + Number(max2).toFixed(2)
                      + 'kN・m'
                      + '(' + max2_m.toString() + '節点)';
      this.min_Three = Number(min).toFixed(2)
                    + this.Three_unit
                    + '(' + min_m.toString() + '節点), '
                    + Number(min2).toFixed(2)
                    + 'kN・m'
                    + '(' + min2_m.toString() + '節点)';
      document.getElementById("max-min").style.display = "block";
    }
  }

  public maxMinClear() {
    document.getElementById("max-min").style.display = "none";
  }
}
