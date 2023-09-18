import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ResultFsecService } from './result-fsec.service';
import { InputLoadService } from '../../input/input-load/input-load.service';
import { ThreeService } from '../../three/three.service';

import { ResultDataService } from '../../../providers/result-data.service';
import { ResultCombineFsecService } from '../result-combine-fsec/result-combine-fsec.service';
import { ResultPickupFsecService } from '../result-pickup-fsec/result-pickup-fsec.service';
import { AppComponent } from 'src/app/app.component';
import { DataHelperModule } from 'src/app/providers/data-helper.module';
import { Subscription } from 'rxjs';
import { PagerService } from '../../input/pager/pager.service';
import { DocLayoutService } from 'src/app/providers/doc-layout.service';
import { SheetComponent } from '../../input/sheet/sheet.component';
import pq from "pqgrid";
import { TranslateService } from '@ngx-translate/core';
import { InputPanelService } from '../../input/input-panel/input-panel.service';
import { forEach } from 'jszip';
import { InputNodesService } from '../../input/input-nodes/input-nodes.service';

@Component({
  selector: 'app-result-fsec',
  templateUrl: './result-fsec.component.html',
  styleUrls: [
    './result-fsec.component.scss',
    '../../../app.component.scss',
    '../../../floater.component.scss',
  ],
})
export class ResultFsecComponent implements OnInit, OnDestroy {
  private subscription: Subscription;
  public KEYS: string[];
  public TITLES: string[];
  public height: any;
  public panelData : any[] = [];
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

  private column3Ds: any[] = [
    { title: "result.result-fsec.memberNo", id: "m", format: "", width: -40 },
    { title: "result.result-fsec.nodeNo", id: "n", format: "", width: -40 },
    { title: "result.result-fsec.stationLocation", id: "l", format: "#.000" },
    { title: "result.result-fsec.axialForce", id: "fx", format:'#.00' },
    { title: "result.result-fsec.y_shear", id: "fy", format:'#.00' },
    { title: "result.result-fsec.z_shear", id: "fz", format:'#.00' },
    { title: "result.result-fsec.x_torsion", id: "mx", format:'#.00' },
    { title: "result.result-fsec.y_moment", id: "my", format:'#.00' },
    { title: "result.result-fsec.z_moment", id: "mz", format:'#.00' },
  ];
  private columnHeaders3D = this.result.initColumnTable(this.column3Ds, 80);

  private column2Ds: any[] = [
    { title: "result.result-fsec.memberNo", id: "m", format: "", width: -40 },
    { title: "result.result-fsec.nodeNo", id: "n", format: "", width: -40 },
    { title: "result.result-fsec.stationLocation", id: "l", format: "#.000" },
    { title: "result.result-fsec.axialForce", id: "fx", format:'#.00' },
    { title: "result.result-fsec.shear", id: "fy", format:'#.00' },
    { title: "result.result-fsec.moment", id: "mz", format:'#.00' },
  ];
  private columnHeaders2D = this.result.initColumnTable(this.column2Ds, 80);


  constructor(
    private panel: InputPanelService,
    private nodes: InputNodesService,
    private data: ResultFsecService,
    private app: AppComponent,
    private result: ResultDataService,
    private load: InputLoadService,
    private three: ThreeService,
    private comb: ResultCombineFsecService,
    private pic: ResultPickupFsecService,
    private helper: DataHelperModule,
    private pagerService: PagerService,
    public docLayout: DocLayoutService,
    private translate: TranslateService,
  ) {
    this.dataset = new Array();
    this.dimension = this.helper.dimension;
    this.KEYS = this.comb.fsecKeys;
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

    

    this.COLUMNS_COUNT = this.load.getLoadCaseCount() * 2 + 1;
      if (this.COLUMNS_COUNT <= 10) {
        this.COLUMNS_COUNT = 10;
      }
      
  }

  ngOnInit() {
    // this.loadPage(this.result.page);
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
    this.docLayout.handleMove.subscribe(data => {
      // this.height = data - 100;
      this.options.height = data - 60;
      });
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  //　pager.component からの通知を受け取る
  onReceiveEventFromChild(eventData: number) {
    let pageNew: number = eventData;
    // this.loadPage(pageNew);
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
        this.dataset.push(this.data.getFsecColumns(this.result.page, key));
      }
    } else {
      this.dataset = this.data.getFsecColumns(this.result.page);
    }
    this.three.ChangeMode('fsec');
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
    this.three.ChangeMode('fsec');
    this.three.ChangePage(currentPage);

    this.drawGradientPanel();
  }

  private drawGradientPanel(){
    const nodeData = this.nodes.getNodeJson(0);
    if (Object.keys(nodeData).length <= 0) {
      return;
    }
    this.panelData = [];
    let pData = this.panel.getPanelJson(0);

    if (Object.keys(pData).length <= 0) {
      return;
    }

    for (const key of Object.keys(pData)) {
      const target = pData[key];
      if (target.nodes.length <= 2) {
        continue
      }

      //対象のnodeDataを入手
      const vertexlist = [];
      for (const check of target.nodes) {
        if (check - 1 in Object.keys(nodeData)) {   //nodeData.key=>0~7, nodeData=>1~8のため（-1）で調整
          const n = nodeData[check];
          const x = n.x;
          const y = n.y;
          const z = n.z;
          vertexlist.push([x, y, z]);
        } else if (!(check - 1 in Object.keys(nodeData))) {
          continue;
        }
      }
      this.three.createPanelMemberSectionForce(vertexlist, key);
    }
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
