import { Component, OnInit, ViewChild } from "@angular/core";
import { InputLoadService } from "./input-load.service";
import { DataHelperModule } from "../../../providers/data-helper.module";
import { ThreeService } from "../../three/three.service";
import { SheetComponent } from "../sheet/sheet.component";
import pq from "pqgrid";
import { AppComponent } from "src/app/app.component";
import { FormControl, FormGroup } from "@angular/forms";
import { ThreeLoadService } from "../../three/geometry/three-load/three-load.service";
import { SceneService } from "../../three/scene.service";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: "app-input-load",
  templateUrl: "./input-load.component.html",
  styleUrls: ["./input-load.component.scss", "../../../app.component.scss"],
})
export class InputLoadComponent implements OnInit {
  @ViewChild("grid") grid: SheetComponent;

  public load_name: string;
  public LL_flg: boolean = false;

  public LL_pitch: number;

  public options: pq.gridT.options;
  public width: number;

  private dataset = [];
  private columnHeaders3D = [
    {
      title: this.translate.instant("input.input-load.memberLoad"),
      align: "center",
      colModel: [
        {
          title: this.translate.instant("input.input-load.memberNo"),
          align: "center",
          colModel: [
            {
              title: "1",
              align: "center",
              dataType: "string",
              dataIndx: "m1",
              sortable: false,
              width: 30,
            },
            {
              title: "2",
              align: "center",
              dataType: "string",
              dataIndx: "m2",
              sortable: false,
              width: 30,
            },
          ],
        },
        {
          title: this.translate.instant("input.input-load.direction"),
          align: "center",
          colModel: [
            {
              title: "(x,y,z)",
              dataType: "string",
              dataIndx: "direction",
              sortable: false,
              width: 30,
            },
          ],
        },
        {
          title: this.translate.instant("input.input-load.mark"),
          align: "center",
          colModel: [
            {
              title: "(1,2,9,11)",
              dataType: "integer",
              dataIndx: "mark",
              sortable: false,
              width: 60,
            },
          ],
        },
        {
          title: "L1",
          align: "center",
          colModel: [
            {
              title: "(m)",
              dataType: "string",
              align: "right",
              dataIndx: "L1",
              sortable: false,
              width: 70,
              format: (val) => {
                const num = this.helper.toNumber(val);
                if (num === null) return null;
                const str = val.toString();
                if (num === 0 && str.charAt(0) === "-") {
                  return "-0.000";
                } else {
                  return num.toFixed(3);
                }
              },
            },
          ],
        },
        {
          title: "L2",
          align: "center",
          colModel: [
            {
              title: "(m)",
              dataType: "float",
              format: "#.000",
              dataIndx: "L2",
              sortable: false,
              width: 70,
            },
          ],
        },
        {
          title: "P1",
          align: "center",
          colModel: [
            {
              title: "(kN/m)",
              dataType: "float",
              format: "#.00",
              dataIndx: "P1",
              sortable: false,
              width: 70,
            },
          ],
        },
        {
          title: "P2",
          align: "center",
          colModel: [
            {
              title: "(kN/m)",
              dataType: "float",
              format: "#.00",
              dataIndx: "P2",
              sortable: false,
              width: 70,
            },
          ],
        },
      ],
    },
    {
      title: this.translate.instant("input.input-load.nodeLoad"),
      align: "center",
      colModel: [
        {
          title: this.translate.instant("input.input-load.node"),
          align: "center",
          colModel: [
            {
              title: "No",
              align: "center",
              dataType: "string",
              dataIndx: "n",
              sortable: false,
              width: 30,
            },
          ],
        },
        {
          title: "X",
          align: "center",
          colModel: [
            {
              title: "(kN)",
              dataType: "float",
              format: "#.00",
              dataIndx: "tx",
              sortable: false,
              width: 70,
            },
          ],
        },
        {
          title: "Y",
          align: "center",
          colModel: [
            {
              title: "(kN)",
              dataType: "float",
              format: "#.00",
              dataIndx: "ty",
              sortable: false,
              width: 70,
            },
          ],
        },
        {
          title: "Z",
          align: "center",
          colModel: [
            {
              title: "(kN)",
              dataType: "float",
              format: "#.00",
              dataIndx: "tz",
              sortable: false,
              width: 70,
            },
          ],
        },
        {
          title: "RX",
          align: "center",
          colModel: [
            {
              title: "(kN m)",
              dataType: "float",
              format: "#.00",
              dataIndx: "rx",
              sortable: false,
              width: 70,
            },
          ],
        },
        {
          title: "RY",
          align: "center",
          colModel: [
            {
              title: "(kN m)",
              dataType: "float",
              format: "#.00",
              dataIndx: "ry",
              sortable: false,
              width: 70,
            },
          ],
        },
        {
          title: "RZ",
          align: "center",
          colModel: [
            {
              title: "(kN m)",
              dataType: "float",
              format: "#.00",
              dataIndx: "rz",
              sortable: false,
              width: 70,
            },
          ],
        },
      ],
    },
  ];
  private columnHeaders2D = [
    {
      title: this.translate.instant("input.input-load.memberLoad"),
      align: "center",
      colModel: [
        {
          title: this.translate.instant("input.input-load.memberNo"),
          colModel: [
            {
              title: "1",
              align: "center",
              dataType: "string",
              dataIndx: "m1",
              sortable: false,
              width: 30,
            },
            {
              title: "2",
              align: "center",
              dataType: "string",
              dataIndx: "m2",
              sortable: false,
              width: 30,
            },
          ],
        },
        {
          title: this.translate.instant("input.input-load.direction"),
          align: "center",
          colModel: [
            {
              title: "(x,y,z)",
              dataType: "string",
              dataIndx: "direction",
              sortable: false,
              width: 30,
            },
          ],
        },
        {
          title: this.translate.instant("input.input-load.mark"),
          align: "center",
          colModel: [
            {
              title: "(1,2,9,11)",
              dataType: "integer",
              dataIndx: "mark",
              sortable: false,
              width: 60,
            },
          ],
        },
        {
          title: "L1",
          align: "center",
          colModel: [
            {
              title: "(m)",
              dataType: "string",
              align: "right",
              dataIndx: "L1",
              sortable: false,
              width: 70,
              format: (val) => {
                const num = this.helper.toNumber(val);
                if (num === null) return null;
                const str = val.toString();
                if (num === 0 && str.charAt(0) === "-") {
                  return "-0.000";
                } else {
                  return num.toFixed(3);
                }
              },
            },
          ],
        },
        {
          title: "L2",
          align: "center",
          colModel: [
            {
              title: "(m)",
              dataType: "float",
              format: "#.000",
              dataIndx: "L2",
              sortable: false,
              width: 70,
            },
          ],
        },
        {
          title: "P1",
          align: "center",
          colModel: [
            {
              title: "(kN/m)",
              dataType: "float",
              format: "#.00",
              dataIndx: "P1",
              sortable: false,
              width: 70,
            },
          ],
        },
        {
          title: "P2",
          align: "center",
          colModel: [
            {
              title: "(kN/m)",
              dataType: "float",
              format: "#.00",
              dataIndx: "P2",
              sortable: false,
              width: 70,
            },
          ],
        },
      ],
    },
    {
      title: this.translate.instant("input.input-load.nodeLoad"),
      align: "center",
      dataIndx: "ddd",
      colModel: [
        {
          title: this.translate.instant("input.input-load.node"),
          align: "center",
          colModel: [
            {
              title: "No",
              align: "center",
              dataType: "string",
              dataIndx: "n",
              sortable: false,
              width: 30,
            },
          ],
        },
        {
          title: "X",
          align: "center",
          colModel: [
            {
              title: "(kN)",
              dataType: "float",
              format: "#.00",
              dataIndx: "tx",
              sortable: false,
              width: 70,
            },
          ],
        },
        {
          title: "Y",
          align: "center",
          colModel: [
            {
              title: "(kN)",
              dataType: "float",
              format: "#.00",
              dataIndx: "ty",
              sortable: false,
              width: 70,
            },
          ],
        },
        {
          title: "M",
          align: "center",
          colModel: [
            {
              title: "(kN m)",
              dataType: "float",
              format: "#.00",
              dataIndx: "rz",
              sortable: false,
              width: 70,
            },
          ],
        },
      ],
    },
  ];
  // 3次元の連行荷重
  private columnHeaders3D_LL = [
    {
      title: this.translate.instant("input.input-load.memberLoad"),
      align: "center",
      colModel: [
        {
          title: this.translate.instant("input.input-load.memberNo"),
          align: "center",
          colModel: [
            {
              title: "1",
              align: "center",
              dataType: "string",
              dataIndx: "m1",
              sortable: false,
              width: 30,
            },
            {
              title: "2",
              align: "center",
              dataType: "string",
              dataIndx: "m2",
              sortable: false,
              width: 30,
            },
          ],
        },
        {
          title: this.translate.instant("input.input-load.direction"),
          align: "center",
          colModel: [
            {
              title: "(x,y,z)",
              dataType: "string",
              dataIndx: "direction",
              sortable: false,
              width: 30,
            },
          ],
        },
        {
          title: this.translate.instant("input.input-load.mark"),
          align: "center",
          colModel: [
            {
              title: "(1,2,9,11)",
              dataType: "integer",
              dataIndx: "mark",
              sortable: false,
              width: 60,
            },
          ],
        },
        {
          title: "L1",
          align: "center",
          colModel: [
            {
              title: "(m)",
              dataType: "string",
              align: "right",
              dataIndx: "L1",
              sortable: false,
              width: 70,
              format: (val) => {
                const num = this.helper.toNumber(val);
                if (num === null) return null;
                const str = val.toString();
                if (num === 0 && str.charAt(0) === "-") {
                  return "-0.000";
                } else {
                  return num.toFixed(3);
                }
              },
            },
          ],
        },
        {
          title: "L2",
          align: "center",
          colModel: [
            {
              title: "(m)",
              dataType: "float",
              format: "#.000",
              dataIndx: "L2",
              sortable: false,
              width: 70,
            },
          ],
        },
        {
          title: "P1",
          align: "center",
          colModel: [
            {
              title: "(kN/m)",
              dataType: "float",
              format: "#.00",
              dataIndx: "P1",
              sortable: false,
              width: 70,
            },
          ],
        },
        {
          title: "P2",
          align: "center",
          colModel: [
            {
              title: "(kN/m)",
              dataType: "float",
              format: "#.00",
              dataIndx: "P2",
              sortable: false,
              width: 70,
            },
          ],
        },
      ],
    },
  ];
  // 2次元の連行荷重
  private columnHeaders2D_LL = [
    {
      title: this.translate.instant("input.input-load.memberLoad"),
      align: "center",
      colModel: [
        {
          title: this.translate.instant("input.input-load.memberNo"),
          colModel: [
            {
              title: "1",
              align: "center",
              dataType: "string",
              dataIndx: "m1",
              sortable: false,
              width: 30,
            },
            {
              title: "2",
              align: "center",
              dataType: "string",
              dataIndx: "m2",
              sortable: false,
              width: 30,
            },
          ],
        },
        {
          title: this.translate.instant("input.input-load.direction"),
          align: "center",
          colModel: [
            {
              title: "(x,y,z)",
              dataType: "string",
              dataIndx: "direction",
              sortable: false,
              width: 30,
            },
          ],
        },
        {
          title: this.translate.instant("input.input-load.mark"),
          align: "center",
          colModel: [
            {
              title: "(1,2,9,11)",
              dataType: "integer",
              dataIndx: "mark",
              sortable: false,
              width: 60,
            },
          ],
        },
        {
          title: "L1",
          align: "center",
          colModel: [
            {
              title: "(m)",
              dataType: "string",
              align: "right",
              dataIndx: "L1",
              sortable: false,
              width: 70,
              format: (val) => {
                const num = this.helper.toNumber(val);
                if (num === null) return null;
                const str = val.toString();
                if (num === 0 && str.charAt(0) === "-") {
                  return "-0.000";
                } else {
                  return num.toFixed(3);
                }
              },
            },
          ],
        },
        {
          title: "L2",
          align: "center",
          colModel: [
            {
              title: "(m)",
              dataType: "float",
              format: "#.000",
              dataIndx: "L2",
              sortable: false,
              width: 70,
            },
          ],
        },
        {
          title: "P1",
          align: "center",
          colModel: [
            {
              title: "(kN/m)",
              dataType: "float",
              format: "#.00",
              dataIndx: "P1",
              sortable: false,
              width: 70,
            },
          ],
        },
        {
          title: "P2",
          align: "center",
          colModel: [
            {
              title: "(kN/m)",
              dataType: "float",
              format: "#.00",
              dataIndx: "P2",
              sortable: false,
              width: 70,
            },
          ],
        },
      ],
    },
  ];

  private ROWS_COUNT = 15;
  private page = 1;

  constructor(
    private data: InputLoadService,
    private helper: DataHelperModule,
    private app: AppComponent,
    private three: ThreeService,
    private threeLoad: ThreeLoadService,
    private scene: SceneService,
    private translate: TranslateService
  ) {
    // グリッドの設定
    this.options = {
      showTop: false,
      reactive: true,
      sortable: false,
      locale: "jp",
      height: this.tableHeight(),
      numberCell: {
        show: false, // 行番号
      },
      colModel: this.columnHeaders3D,
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
        this.three.selectChange("load_values", row, column);
      },
      change: (evt, ui) => {
        for (const range of ui.updateList) {
          // L1行に 数字ではない入力がされていたら削除する
          const L1 = this.helper.toNumber(range.rowData["L1"]);
          if (L1 === null) {
            range.rowData["L1"] = null;
          }
          const direction = range.rowData["direction"];
          if (direction !== undefined && direction !== null) {
            range.rowData["direction"] = direction.trim().toLowerCase();
          }
          const row = range.rowIndx + 1;
          this.three.changeData("load_values", row);
        }
        for (const target of ui.addList) {
          const no: number = target.rowIndx;
          const newRow = target.newRow;
          const load = this.data.getLoadColumns(this.page, no + 1);
          // 不適切をはじく処理
          const L1 = this.helper.toNumber(newRow["L1"]);
          if (L1 === null) {
            newRow["L1"] = null;
          }
          const direction = newRow["direction"];
          if (direction !== undefined && direction !== null) {
            newRow["direction"] = direction.trim().toLowerCase();
          }
          // this.datasetに代入
          load['m1'] = (newRow.m1 != undefined) ? newRow.m1 : '';
          load['m2'] = (newRow.m2 != undefined) ? newRow.m2 : '';
          load['direction'] = (newRow.direction != "") ? newRow.direction : '';
          load['mark'] = (newRow.mark != undefined) ? newRow.mark : '';
          load['L1'] = (newRow.L1 != undefined) ? newRow.L1 : '';
          load['L2'] = (newRow.L2 != undefined) ? newRow.L2 : '';
          load['P1'] = (newRow.P1 != undefined) ? newRow.P1 : '';
          load['P2'] = (newRow.P2 != undefined) ? newRow.P2 : '';
          load['n']  = (newRow.n  != undefined) ? newRow.n  : '';
          load['tx'] = (newRow.tx != undefined) ? newRow.tx : '';
          load['ty'] = (newRow.ty != undefined) ? newRow.ty : '';
          load['tz'] = (newRow.tz != undefined) ? newRow.tz : '';
          load['rx'] = (newRow.rx != undefined) ? newRow.rx : '';
          load['ry'] = (newRow.ry != undefined) ? newRow.ry : '';
          load['rz'] = (newRow.rz != undefined) ? newRow.rz : '';
          this.dataset.splice(no, 1, load);
          this.three.changeData("load_values", no + 1);
        }
      },
    };
  }

  ngOnInit() {
    this.ROWS_COUNT = this.rowsCount();
    const load_name = this.data.getLoadNameColumns(1);
    this.load_name = load_name.name;
    this.checkLL(load_name.symbol);

    this.loadPage(1, this.ROWS_COUNT);
    this.sheetChange(this.helper.dimension, this.LL_flg);

    this.three.ChangeMode("load_values");
    this.three.ChangePage(1);
  }

  //　pager.component からの通知を受け取る
  onReceiveEventFromChild(eventData: number) {
    this.dataset.splice(0);
    const load_name = this.data.getLoadNameColumns(eventData);
    this.load_name = load_name.name;
    this.checkLL(load_name.symbol);

    this.page = eventData;
    this.loadPage(eventData, this.ROWS_COUNT);
    this.sheetChange(this.helper.dimension, this.LL_flg);
    this.grid.refreshDataAndView();
    this.three.ChangePage(eventData);
  }

  //
  loadPage(currentPage: number, row: number) {
    for (let i = this.dataset.length + 1; i <= row; i++) {
      const load = this.data.getLoadColumns(currentPage, i);
      this.dataset.push(load);
    }

    const load_name = this.data.getLoadNameColumns(currentPage);
    this.checkLL(load_name.symbol);
    if(this.LL_flg){
      this.LL_pitch = load_name.LL_pitch;
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

  // 連行荷重のピッチを変えた場合
  public change_pich() {

    if(this.LL_pitch < 0.1){
      this.LL_pitch = 0.1;
      return;
    }
    // 入力情報をデータに反映する
    const load_name = this.data.getLoadNameColumns(this.page);
    load_name.LL_pitch = this.LL_pitch;

    this.threeLoad.change_LL_Load(this.page.toString()); 
  }

  private checkLL(symbol: string): void{
    if (symbol === undefined) {
      this.LL_flg = false;
      return
    }
    if (symbol.includes("LL")) {
      this.LL_flg = true;
    } else {
      this.LL_flg = false;
    }
  }

  private sheetChange(dim: number, LL: boolean) {
    if (dim === 3) {
      if (LL) {
        this.options.colModel = this.columnHeaders3D_LL;
        this.width = 550;
      } else {
        this.options.colModel = this.columnHeaders3D;
        this.width = 1020;
      }
    } else {
      if (LL) {
        this.options.colModel = this.columnHeaders2D_LL;
        this.width = 550;
      } else {
        this.options.colModel = this.columnHeaders2D;
        this.width = 810;
      }
    }

  }

}
