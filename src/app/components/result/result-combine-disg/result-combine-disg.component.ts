import { Component, ElementRef, OnInit, OnDestroy, ViewChild,AfterViewInit } from "@angular/core";
import { ResultCombineDisgService } from "./result-combine-disg.service";
import { InputCombineService } from "../../input/input-combine/input-combine.service";
import { ThreeService } from "../../three/three.service";
import { ResultPickupDisgService } from "../result-pickup-disg/result-pickup-disg.service";
import { DataHelperModule } from "src/app/providers/data-helper.module";
import { ResultDataService } from "../../../providers/result-data.service";
import { Subscription } from "rxjs";
import { PagerDirectionService } from "../../input/pager-direction/pager-direction.service";
import { PagerService } from "../../input/pager/pager.service";
// import { MatCarousel, MatCarouselComponent } from "@ngmodule/material-carousel";

@Component({
  selector: "app-result-combine-disg",
  templateUrl: "./result-combine-disg.component.html",
  styleUrls: [
    "./result-combine-disg.component.scss",
    "../../../app.component.scss",
    "../../../floater.component.scss",
  ],
})
export class ResultCombineDisgComponent implements OnInit, OnDestroy  {
  @ViewChild("carousel") carousel: ElementRef;

  private directionSubscription: Subscription;
  private subscription: Subscription;
  public KEYS: string[];
  public TITLES: string[];

  dataset: any[];
  page: number;
  load_name: string;
  btnPickup: string;
  tableHeight: number;
  dimension: number;
  cal: number = 0;

  circleBox = new Array();

  constructor(
    private data: ResultCombineDisgService,
    private comb: InputCombineService,
    private three: ThreeService,
    private pic: ResultPickupDisgService,
    private result: ResultDataService,
    private helper: DataHelperModule,
    private pagerDirectionService: PagerDirectionService,
    private pagerService: PagerService
  ) {
    this.dataset = new Array();
    this.KEYS = this.data.disgKeys;
    this.TITLES = this.data.titles;
    for (let i = 0;i<this.TITLES.length;i++) {
      this.circleBox.push(i);
    }
    this.dimension = this.helper.dimension;

    if(this.result.case != "comb"){
      this.result.page = 1
      this.result.case = "comb"
    }
    this.directionSubscription =
    this.pagerDirectionService.pageSelected$.subscribe((text) => {
      this.calPage(text - 1);
    });
    this.subscription = this.pagerService.pageSelected$.subscribe((text) => {
      this.onReceiveEventFromChild(text);
    });
  }

  ngOnInit() {
    this.loadPage(this.result.page);
    this.calPage(0);

    // ピックアップデータがあればボタンを表示する
    if (this.pic.isCalculated === true) {
      this.btnPickup = "btn-change";
    } else {
      this.btnPickup = "btn-change disabled";
    }

    // テーブルの高さを計算する
    this.tableHeight = (this.dataset[0].length + 1) * 30;
  }
  ngOnDestroy() {
    this.directionSubscription.unsubscribe();
    this.subscription.unsubscribe();
  }

  //　pager.component からの通知を受け取る
  onReceiveEventFromChild(eventData: number) {
    let pageNew: number = eventData;
    this.loadPage(pageNew);
  }

  loadPage(currentPage: number) {
    if (currentPage !== this.result.page) {
      this.result.page = currentPage;
    }
    this.dataset = new Array();
    for (const key of this.KEYS) {
      const d = this.data.getCombineDisgColumns(this.result.page, key);
      if(d==null){
        this.dataset = new Array();
        break;
      }
      this.dataset.push(d);
    }
    this.load_name = this.comb.getCombineName(currentPage);

    this.three.ChangeMode("comb_disg");
    this.three.ChangePage(currentPage);
  }

  calPage(calPage: any) {
    const carousel = document.getElementById("carousel");
    if (carousel !== null) {
      carousel.classList.add("add");
    }
    setTimeout(() => {
      this.calcal(calPage);
    }, 100);
    setTimeout(function () {
      if (carousel != null) {
        carousel.classList.remove("add");
      }
    }, 500);
  }

  calcal(calpage: any) {
    if (calpage === "-1" || calpage === "1") {
      this.cal += Number(calpage);
      if (this.cal >= this.TITLES.length) {
        this.cal = 0;
      }
      if (this.cal < 0) {
        this.cal = this.TITLES.length - 1;
      }
    } else {
      this.cal = calpage;
    }
    setTimeout(() => {
      const circle = document.getElementById(String(this.cal+20));
      if (circle !== null) {
        circle.classList.add("active");
      }
    }, 10);
  }
}
