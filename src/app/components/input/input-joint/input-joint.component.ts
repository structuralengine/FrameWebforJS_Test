import { Component, OnInit, ViewChild } from "@angular/core";
import { InputJointService } from "./input-joint.service";
import { DataHelperModule } from "../../../providers/data-helper.module";
import { ThreeService } from "../../three/three.service";
import { SheetComponent } from "../sheet/sheet.component";
import pq from "pqgrid";
import { AppComponent } from 'src/app/app.component';
import { TranslateService } from "@ngx-translate/core";


@Component({
  selector: "app-input-joint",
  templateUrl: "./input-joint.component.html",
  styleUrls: ["./input-joint.component.scss", "../../../app.component.scss"],
})
export class InputJointComponent implements OnInit {
  @ViewChild("grid") grid!: SheetComponent;

  private dataset = [];
  private columnHeaders3D =[
    { 
      title: this.translate.instant("input.input-joint.member"),
      align: 'center', colModel: [
      { title: "No", dataType: "string", dataIndx: "m", sortable: false },
    ]},      
    { 
      title: this.translate.instant("input.input-joint.node_i"),
      align: 'center', colModel: [
      { title: "x", dataType: "integer", dataIndx: "xi", sortable: false },
      { title: "y", dataType: "integer", dataIndx: "yi", sortable: false },
      { title: "z", dataType: "integer", dataIndx: "zi", sortable: false },
    ]},      
    { 
      title: this.translate.instant("input.input-joint.node_j"),
      align: 'center', colModel: [
      { title: "x", dataType: "integer", dataIndx: "xj", sortable: false },
      { title: "y", dataType: "integer", dataIndx: "yj", sortable: false },
      { title: "z", dataType: "integer", dataIndx: "zj", sortable: false }
    ]},      
  ];
  private columnHeaders2D =[
    { 
      title: this.translate.instant("input.input-joint.memberNo"),
      dataType: "string", dataIndx: "m", sortable: false },
    { 
      title: this.translate.instant("input.input-joint.node_i"),
      dataType: "integer", dataIndx: "zi", sortable: false },
    { 
      title: this.translate.instant("input.input-joint.node_j"),
      dataType: "integer", dataIndx: "zj", sortable: false }

  ];

  private ROWS_COUNT = 15;
  private page = 1;

  constructor(
    private data: InputJointService,
    private helper: DataHelperModule,
    private app: AppComponent,
    private three: ThreeService,
    private translate: TranslateService
    ) {}

  ngOnInit() {
    this.ROWS_COUNT = this.rowsCount();
    this.loadPage(1, this.ROWS_COUNT);
    this.three.ChangeMode("joints");
    this.three.ChangePage(1);
  }

  //　pager.component からの通知を受け取る
  onReceiveEventFromChild(eventData: number) {
    this.dataset.splice(0);
    this.loadPage(eventData, this.ROWS_COUNT);
    this.grid.refreshDataAndView();
    this.three.ChangePage(eventData);
  }

  loadPage(currentPage: number, row: number) {
    for (let i = this.dataset.length + 1; i <= row; i++) {
      const fix_node = this.data.getJointColumns(currentPage, i);
      this.dataset.push(fix_node);
    }

    this.page = currentPage;
  }

  // 表の高さを計算する
  private tableHeight(): string {
    const containerHeight = this.app.getDialogHeight() - 70; // pagerの分減じる
    return containerHeight.toString();
  }
  // 表高さに合わせた行数を計算する
  private rowsCount(): number {
    const containerHeight = this.app.getDialogHeight();
    return Math.round(containerHeight / 30);
  }

  // グリッドの設定
  options: pq.gridT.options = {
    showTop: false,
    reactive: true,
    sortable: false,
    locale: "jp",
    height: this.tableHeight(),
    numberCell: {
      show: false, // 行番号
    },
    colModel:
      this.helper.dimension === 3 ? this.columnHeaders3D : this.columnHeaders2D,
    dataModel: {
      data: this.dataset,
    },
    beforeTableView: (evt, ui) => {
      const finalV = ui.finalV;
      const dataV = this.dataset.length;
      if (ui.initV == null) {
        return;
      }
      if (finalV >= dataV - 1) {
        this.loadPage(this.page, dataV + this.ROWS_COUNT);
        this.grid.refreshDataAndView();
      }
    },
    selectEnd: (evt, ui) => {
      const range = ui.selection.iCells.ranges;
      const row = range[0].r1 + 1;
      const column = range[0].c1;
      this.three.selectChange("joints", row, column);
    },
    change: (evt, ui) => {
      // copy&pasteで入力した際、超過行が消えてしまうため、addListのループを追加.
      for (const target of ui.addList) {
        const no: number = target.rowIndx;
        const joint = this.data.getJointColumns(this.page, no + 1);
        const newRow = target.newRow;
        joint["m"] = newRow.m != undefined ? newRow.m : "";
        joint["xi"] = newRow.xi != undefined ? newRow.xi : "";
        joint["yi"] = newRow.yi != undefined ? newRow.yi : "";
        joint["zi"] = newRow.zi != undefined ? newRow.zi : "";
        joint["xj"] = newRow.xj != undefined ? newRow.xj : "";
        joint["yj"] = newRow.yj != undefined ? newRow.yj : "";
        joint["zj"] = newRow.zj != undefined ? newRow.zj : "";
        this.dataset.splice(no, 1, joint);
      }
      this.three.changeData("joints", this.page);
    },
  };

  width = this.helper.dimension === 3 ? 410 : 410;
}
