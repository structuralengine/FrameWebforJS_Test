import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ResultReacService } from './result-reac.service';
import { InputLoadService } from '../../input/input-load/input-load.service';
import { ThreeService } from '../../three/three.service';

import { ResultDataService } from '../../../providers/result-data.service';
import { ResultCombineReacService } from '../result-combine-reac/result-combine-reac.service';
import { ResultPickupReacService } from '../result-pickup-reac/result-pickup-reac.service';
import { AppComponent } from 'src/app/app.component';
import { DataHelperModule } from 'src/app/providers/data-helper.module';
import { Subscription } from 'rxjs';
import { PagerService } from '../../input/pager/pager.service';
import { DocLayoutService } from 'src/app/providers/doc-layout.service';
import { SheetComponent } from '../../input/sheet/sheet.component';
import pq from "pqgrid";
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-result-reac',
  templateUrl: './result-reac.component.html',
  styleUrls: [
    './result-reac.component.scss',
    '../../../app.component.scss',
    '../../../floater.component.scss',
  ],
})
export class ResultReacComponent implements OnInit, OnDestroy {
  private subscription: Subscription;
  public KEYS: string[];
  public TITLES: string[];
  public height: any;
  dataset: any[];
  page: number = 1;
  load_name: string;
  btnCombine: string;
  btnPickup: string;
  dimension: number;

  LL_flg: boolean[];
  LL_page: boolean;
  cal: number = 0;

  circleBox = new Array();




  private columnKeys: string[] = ['id', 'tx', 'ty', 'tz', 'mx', 'my', 'mz', "case"];
  private columnHeaders3D = [
    {
    title: this.translate.instant("result.result-reac.nodeNo"),
    dataType: "integer",
    dataIndx: this.columnKeys[0],
    sortable: false,
    width: 80
    },
    {
    title: this.translate.instant("result.result-reac.x_SupportReaction"),
    dataType: "integer",
    dataIndx: this.columnKeys[1],
    sortable: false,
    width: 80
    },
  {
    title: this.translate.instant("result.result-reac.y_SupportReaction"),
    dataType: "integer",
    format: '#.000',
    dataIndx: this.columnKeys[2],
    sortable: false,
    width: 80
  },
  {
    title: this.translate.instant("result.result-reac.z_SupportReaction"),
    dataType: "integer",
    format: '#.0000',
    dataIndx: this.columnKeys[3],
    sortable: false,
    width: 80
  },
  {
    title: this.translate.instant("result.result-reac.x_RotationalReaction"),
    dataType: "integer",
    format: '#.0000',
    dataIndx: this.columnKeys[4],
    sortable: false,
    width: 80
  },
  {
    title: this.translate.instant("result.result-reac.y_RotationalReaction"),
    dataType: "integer",
    format: '#.0000',
    dataIndx: this.columnKeys[5],
    sortable: false,
    width: 80
  },
  {
    title: this.translate.instant("result.result-reac.z_RotationalReaction"),
    dataType: "integer",
    format: '#.0000',
    dataIndx: this.columnKeys[6],
    sortable: false,
    width: 80
  },
  {
    title: this.translate.instant("result.result-reac.comb"),
    dataType: "integer",
    format: '#.0000',
    dataIndx: this.columnKeys[7],
    sortable: false,
    width: 80
  }];

  private columnHeaders2D = [
    {
      title: this.translate.instant("result.result-reac.nodeNo"),
      dataType: "integer",
      dataIndx: this.columnKeys[0],
      sortable: false,
      width: 80
      },
      {
      title: this.translate.instant("result.result-reac.x_SupportReaction"),
      dataType: "integer",
      dataIndx: this.columnKeys[1],
      sortable: false,
      width: 80
      },
    {
      title: this.translate.instant("result.result-reac.y_SupportReaction"),
      dataType: "integer",
      format: '#.000',
      dataIndx: this.columnKeys[2],
      sortable: false,
      width: 80
    },
    {
      title: this.translate.instant("result.result-reac.z_RotationalReaction"),
      dataType: "integer",
      format: '#.0000',
      dataIndx: this.columnKeys[6],
      sortable: false,
      width: 80
    },
    {
      title: this.translate.instant("result.result-reac.comb"),
      dataType: "integer",
      format: '#.0000',
      dataIndx: this.columnKeys[7],
      sortable: false,
      width: 80
    }];

  constructor(
    private app: AppComponent,
    private translate: TranslateService,
    private data: ResultReacService,
    private load: InputLoadService,
    private three: ThreeService,
    private result: ResultDataService,
    private comb: ResultCombineReacService,
    private pic: ResultPickupReacService,
    private helper: DataHelperModule,
    private pagerService: PagerService,
    public docLayout: DocLayoutService
  ) {
    this.dataset = new Array();
    this.dimension = this.helper.dimension;
    this.KEYS = this.comb.reacKeys;
    this.TITLES = this.comb.titles;
    for (let i = 0; i < this.TITLES.length; i++) {
      this.circleBox.push(i);
    }

    if (this.result.case != 'basic') {
      this.result.page = 1;
      this.result.case = 'basic';
    }
    this.subscription = this.pagerService.pageSelected$.subscribe((text) => {
      this.onReceiveEventFromChild(text);
    });
  }

  ngOnInit() {
    this.loadPage(this.result.page);
    this.ROWS_COUNT = this.rowsCount();
    this.loadData(1, this.ROWS_COUNT);
    setTimeout(() => {
      const circle = document.getElementById(String(this.cal + 20));
      if (circle !== null) {
        circle.classList.add('active');
      }
    }, 10);

    this.LL_flg = this.data.LL_flg;

    // コンバインデータがあればボタンを表示する
    if (this.comb.isCalculated === true) {
      this.btnCombine = 'btn-change';
    } else {
      this.btnCombine = 'btn-change disabled';
    }
    // ピックアップデータがあればボタンを表示する
    if (this.pic.isCalculated === true) {
      this.btnPickup = 'btn-change';
    } else {
      this.btnPickup = 'btn-change disabled';
    }
  }
  ngAfterViewInit() {
    this.docLayout.handleMove.subscribe((data) => {
      this.height = data - 100;
      this.options.height = data - 60;
    });
  }
  ngOnDestroy() {
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

    this.load_name = this.load.getLoadName(currentPage);

    if (this.result.page <= this.data.LL_flg.length) {
      this.LL_page = this.data.LL_flg[this.result.page - 1];
    } else {
      this.LL_page = false;
    }

    if (this.LL_page === true) {
      this.dataset = new Array();
      for (const key of this.KEYS) {
        this.dataset.push(this.data.getReacColumns(this.result.page, key));
      }
    } else {
      this.dataset = this.data.getReacColumns(this.result.page);
    }

    this.three.ChangeMode('reac');
    this.three.ChangePage(currentPage);
  }

  calPage(calPage: any) {
    const carousel = document.getElementById('carousel');
    if (carousel != null) {
      carousel.classList.add('add');
    }
    const time = this.TITLES.length;
    let cal = this.cal;
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
    this.three.ChangeMode('reac');
    this.three.ChangePage(currentPage);
  }

  private tableHeight(): string {
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
    height: this.tableHeight(),
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
