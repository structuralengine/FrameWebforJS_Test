import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  HostListener,
  NgZone,
  OnDestroy,
} from "@angular/core";
import * as THREE from "three";

import { SceneService } from "./scene.service";
import { ThreeService } from "./three.service";
import html2canvas from "html2canvas";
import { TranslateService } from "@ngx-translate/core";
import { MenuComponent } from "../menu/menu.component";

@Component({
  selector: "app-three",
  templateUrl: "./three.component.html",
  styleUrls: ["./three.component.scss"],
})
export class ThreeComponent implements AfterViewInit, OnDestroy {
  @ViewChild("myCanvas", { static: true }) private canvasRef: ElementRef;
  @ViewChild("img") img: ElementRef;
  @ViewChild("screen", { static: true }) private screen: ElementRef;
  @ViewChild("downloadLink") downloadLink: ElementRef;

  private get canvas(): HTMLCanvasElement {
    return this.canvasRef.nativeElement;
  }

  public contentsDialog = {
    nodes: this.translate.instant("app.node"),
    fix_nodes: this.translate.instant("app.fixNode"),
    members: "部材",
    elements: "材料",
    panel: "パネル",
    joints: "結合",
    notice_points: "着目点",
    fix_member: "バネ",
    load_names: "荷重",
    load_values: "荷重",
    disg: "変位量",
    comb_disg: "Combine変位量",
    pik_disg: "PickUp変位量",
    fsec: "断面力",
    comb_fsec: "Combine断面力",
    pik_fsec: "PickUp断面力",
    reac: "反力",
    comb_reac: "Combine反力",
    pik_reac: "PickUp反力",
  };

  constructor(
    private ngZone: NgZone,
    public scene: SceneService,
    private three: ThreeService,
    private translate: TranslateService
  ) {
    THREE.Object3D.DefaultUp.set(0, 0, 1);
  }

  ngAfterViewInit() {
    document.getElementById("max-min").style.display = "none";
    this.scene.OnInit(
      this.getAspectRatio(),
      this.canvas,
      devicePixelRatio,
      window.innerWidth,
      window.innerHeight - 120
    );
    this.three.canvasWidth = String(window.innerWidth) + "px";
    this.three.canvasHeight = String(window.innerHeight - 120) + "px";
    this.three.OnInit();

    // ラベルを表示する用のレンダラーを HTML に配置する
    const element = this.scene.labelRendererDomElement();
    const div = document.getElementById("myCanvas"); // ボタンを置きたい場所の手前の要素を取得
    div.parentNode.insertBefore(element, div.nextSibling); // ボタンを置きたい場所にaタグを追加
    // レンダリングする
    this.animate();
    //
    this.three.canvasElement = this.canvas;
  }

  ngOnDestroy() {}

  animate(): void {
    // We have to run this outside angular zones,
    // because it could trigger heavy changeDetection cycles.
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener("DOMContentLoaded", () => {
        this.scene.render();
      });
    });
  }

  // マウスクリック時のイベント
  @HostListener("mousedown", ["$event"])
  public onMouseDown(event: MouseEvent) {
    const mouse: THREE.Vector2 = this.getMousePosition(event);
    this.three.detectObject(mouse, "click");
  }

  // マウスクリック時のイベント
  @HostListener("mouseup", ["$event"])
  public onMouseUp(event: MouseEvent) {
    const mouse: THREE.Vector2 = this.getMousePosition(event);
    this.three.detectObject(mouse, "select");
  }

  // マウス移動時のイベント
  @HostListener("mousemove", ["$event"])
  public onMouseMove(event: MouseEvent) {
    return; // クリックイベントが発生しないバグが解決するまで全てのマウスイベントを無効にする
    const mouse: THREE.Vector2 = this.getMousePosition(event);
    this.three.detectObject(mouse, "hover");
  }

  // マウス位置とぶつかったオブジェクトを検出する
  private getMousePosition(event: MouseEvent): THREE.Vector2 {
    event.preventDefault();
    const rect = this.scene.getBoundingClientRect();
    const mouse = new THREE.Vector2();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    return mouse;
  }

  // ウインドウがリサイズした時のイベント処理
  @HostListener("window:resize", ["$event"])
  public onResize(event: Event) {
    this.scene.onResize(
      this.getAspectRatio(),
      window.innerWidth,
      window.innerHeight - 120
    );
  }

  private getAspectRatio(): number {
    if (this.canvas.clientHeight === 0) {
      return 0;
    }
    return this.canvas.clientWidth / this.canvas.clientHeight;
  }

  public downloadImage() {
    const screenArea = document.getElementById("screenArea");
    screenArea.style.width = String(window.innerWidth) + "px";
    screenArea.style.height = String(window.innerHeight - 120) + "px";
    html2canvas(screenArea).then((canvas) => {
      this.img.nativeElement.src = canvas.toDataURL();
      this.downloadLink.nativeElement.href = canvas.toDataURL("image/png");
      const date = new Date();
      let filename =
        this.three.fileName == "" ? "FrameWebForJS" : this.three.fileName;
      filename = filename.substring(0, filename.lastIndexOf("."));

      const figureType = "_" + this.contentsDialog[this.three.mode];
      let index = "";
      if (
        !(this.three.mode == "nodes" || "members" || "panel" || "notice_points")
      ) {
        index = "_" + "Case" + this.scene.index;
      }

      let radio = "";
      if (!this.three.mode.includes("fsec")) {
        radio = "_" + this.scene.radio;
      }

      this.downloadLink.nativeElement.download =
        filename + figureType + index + radio + ".png";
      this.downloadLink.nativeElement.click();
    });
  }
}
