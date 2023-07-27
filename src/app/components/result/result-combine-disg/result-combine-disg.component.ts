import {
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { ResultCombineDisgService } from './result-combine-disg.service';
import { InputCombineService } from '../../input/input-combine/input-combine.service';
import { ThreeService } from '../../three/three.service';
import { ResultPickupDisgService } from '../result-pickup-disg/result-pickup-disg.service';
import { DataHelperModule } from 'src/app/providers/data-helper.module';
import { ResultDataService } from '../../../providers/result-data.service';
import { Subscription } from 'rxjs';
import { PagerDirectionService } from '../../input/pager-direction/pager-direction.service';
import { PagerService } from '../../input/pager/pager.service';
import { DocLayoutService } from 'src/app/providers/doc-layout.service';
// import { MatCarousel, MatCarouselComponent } from "@ngmodule/material-carousel";
import { SheetComponent } from '../../input/sheet/sheet.component';
import { TranslateService } from '@ngx-translate/core';
import { AppComponent } from 'src/app/app.component';
import pq from "pqgrid";


@Component({
  selector: 'app-result-combine-disg',
  templateUrl: './result-combine-disg.component.html',
  styleUrls: [
    './result-combine-disg.component.scss',
    '../../../app.component.scss',
    '../../../floater.component.scss',
  ],
})
export class ResultCombineDisgComponent implements OnInit, OnDestroy {
  @ViewChild('carousel') carousel: ElementRef;

  private directionSubscription: Subscription;
  private subscription: Subscription;
  public KEYS: string[];
  public TITLES: string[];
  public height: any;
  dataset: any[];
  page: number;
  load_name: string;
  btnPickup: string;
  tableHeight: number;
  dimension: number;
  cal: number = 0;

  circleBox = new Array();

  private columnKeys: string[] = ['id', 'dx', 'dy', 'dz', 'rx', 'ry', 'rz', 'case'];
  private columnHeaders3D = [
    {
    title: this.translate.instant("result.result-disg.No"),
    dataType: "integer",
    dataIndx: this.columnKeys[0],
    sortable: false,
    width: 80
    },
    {
    title: this.translate.instant("result.result-disg.x_movement"),
    dataType: "integer",
    dataIndx: this.columnKeys[1],
    sortable: false,
    width: 80
    },
  {
    title: this.translate.instant("result.result-disg.y_movement"),
    dataType: "integer",
    format: '#.000',
    dataIndx: this.columnKeys[2],
    sortable: false,
    width: 80
  },
  {
    title: this.translate.instant("result.result-disg.z_movement"),
    dataType: "integer",
    format: '#.0000',
    dataIndx: this.columnKeys[3],
    sortable: false,
    width: 80
  },
  {
    title: this.translate.instant("result.result-disg.x_rotation"),
    dataType: "integer",
    format: '#.0000',
    dataIndx: this.columnKeys[4],
    sortable: false,
    width: 80
  },
  {
    title: this.translate.instant("result.result-disg.y_rotation"),
    dataType: "integer",
    format: '#.0000',
    dataIndx: this.columnKeys[5],
    sortable: false,
    width: 80
  },
  {
    title: this.translate.instant("result.result-disg.z_rotation"),
    dataType: "integer",
    format: '#.0000',
    dataIndx: this.columnKeys[6],
    sortable: false,
    width: 80
  },
  {
    title: this.translate.instant("result.result-disg.z_rotation"),
    dataType: "integer",
    format: '#.0000',
    dataIndx: this.columnKeys[7],
    sortable: false,
    width: 80
  }];

  private columnHeaders2D = [
    {
      title: this.translate.instant("result.result-disg.No"),
      dataType: "integer",
      dataIndx: this.columnKeys[0],
      sortable: false,
      width: 80
      },
      {
      title: this.translate.instant("result.result-disg.x_movement"),
      dataType: "integer",
      format: '#.0000',
      dataIndx: this.columnKeys[1],
      sortable: false,
      width: 80
      },
    {
      title: this.translate.instant("result.result-disg.y_movement"),
      dataType: "integer",
      format: '#.0000',
      dataIndx: this.columnKeys[2],
      sortable: false,
      width: 80
    },
    {
      title: this.translate.instant("result.result-disg.z_movement"),
      dataType: "integer",
      format: '#.0000',
      dataIndx: this.columnKeys[6],
      sortable: false,
      width: 80
    },
    {
      title: this.translate.instant("result.result-disg.z_rotation"),
      dataType: "integer",
      format: '#.0000',
      dataIndx: this.columnKeys[7],
      sortable: false,
      width: 80
    }];


  constructor(
    private app: AppComponent,
    private translate: TranslateService,
    private data: ResultCombineDisgService,
    private comb: InputCombineService,
    private three: ThreeService,
    private pic: ResultPickupDisgService,
    private result: ResultDataService,
    private helper: DataHelperModule,
    private pagerDirectionService: PagerDirectionService,
    private pagerService: PagerService,
    public docLayout: DocLayoutService
  ) {
    this.dataset = new Array();
    this.KEYS = this.data.disgKeys;
    this.TITLES = this.data.titles;
    for (let i = 0; i < this.TITLES.length; i++) {
      this.circleBox.push(i);
    }
    this.dimension = this.helper.dimension;

    if (this.result.case != 'comb') {
      this.result.page = 1;
      this.result.case = 'comb';
    }
    this.directionSubscription =
      this.pagerDirectionService.pageSelected$.subscribe((text) => {
        this.calPage(text - 1);
      });
    this.subscription = this.pagerService.pageSelected$.subscribe((text) => {
      this.onReceiveEventFromChild(text);
    });
  }
  ngAfterViewInit() {
    this.docLayout.handleMove.subscribe((data) => {
      this.height = 400;//data - 100;
      this.options.height = data - 60;
    });
  }
  ngOnInit() {
    this.loadPage(this.result.page);

    this.ROWS_COUNT = this.rowsCount();
    this.loadData(1, this.ROWS_COUNT);

    this.calPage(0);

    // ピックアップデータがあればボタンを表示する
    if (this.pic.isCalculated === true) {
      this.btnPickup = 'btn-change';
    } else {
      this.btnPickup = 'btn-change disabled';
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

    this.datasetNew.splice(0);
    this.loadData(pageNew, this.ROWS_COUNT);
    this.grid.refreshDataAndView();
    this.three.ChangePage(pageNew);
  }

  loadPage(currentPage: number) {
    if (currentPage !== this.result.page) {
      this.result.page = currentPage;
    }
    this.dataset = new Array();
    for (const key of this.KEYS) {
      const d = this.data.getCombineDisgColumns(this.result.page, key);
      if (d == null) {
        this.dataset = new Array();
        break;
      }
      this.dataset.push(d);
    }
    this.load_name = this.comb.getCombineName(currentPage);

    this.three.ChangeMode('comb_disg');
    this.three.ChangePage(currentPage);
  }

  calPage(calPage: any) {
    const carousel = document.getElementById('carousel');
    if (carousel !== null) {
      carousel.classList.add('add');
    }
    setTimeout(() => {
      this.calcal(calPage);
    }, 100);
    setTimeout(function () {
      if (carousel != null) {
        carousel.classList.remove('add');
      }
    }, 500);
  }

  calcal(calpage: any) {
    if (calpage === '-1' || calpage === '1') {
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
      const circle = document.getElementById(String(this.cal + 20));
      if (circle !== null) {
        circle.classList.add('active');
      }
    }, 10);
  }

  @ViewChild('grid') grid: SheetComponent;

  private datasetNew = [];
  private columnHeaders =[];

  private ROWS_COUNT = 15;
  private COLUMNS_COUNT = 5;

  private loadData(currentPage: number, row: number): void {
    for (let i = this.datasetNew.length; i <= row; i++) {
      const define = this.data.getDataColumns(currentPage, i);
      this.datasetNew.push(define);  
    }
    this.page = currentPage;
    this.three.ChangeMode('comb_disg');
    this.three.ChangePage(currentPage);
  }

  private tableHeightf(): string {
    const containerHeight = this.app.getPanelElementContentContainerHeight() - 10;
    return containerHeight.toString();
  }
  // 表高さに合わせた行数を計算する
  private rowsCount(): number {
    const containerHeight = this.app.getDialogHeight();
    return Math.round(containerHeight / 30);
  }

  options: pq.gridT.options = {
    showTop: false,
    reactive: true,
    sortable: false,
    scrollModel: {
      horizontal: true
    },
    locale: "jp",
    height: this.tableHeightf(),
    numberCell: {
      show: true, // 行番号
      width:40
    },
    colModel: this.helper.dimension === 3 ? this.columnHeaders3D : this.columnHeaders2D,
    dataModel: {
      data: this.datasetNew
    },
    beforeTableView: (evt, ui) => {
      const finalV = ui.finalV;
      const dataV = this.datasetNew.length;
      if (ui.initV == null) {
        return;
      }
      if (finalV >= dataV - 1) {
        this.loadData(this.page, dataV + this.ROWS_COUNT);
        this.grid.refreshDataAndView();
      }
    },
  };
}
