import { Component, OnInit, ViewChild } from "@angular/core";
import { InputElementsService } from "./input-elements.service";
import { DataHelperModule } from "../../../providers/data-helper.module";
import { ThreeService } from "../../three/three.service";
import { SheetComponent } from "../sheet/sheet.component";
import pq from "pqgrid";
import { AppComponent } from "src/app/app.component";

@Component({
  selector: "app-input-elements",
  templateUrl: "./input-elements.component.html",
  styleUrls: ["./input-elements.component.scss", "../../../app.component.scss"],
})
export class InputElementsComponent implements OnInit {
  @ViewChild("grid") grid: SheetComponent;

  private dataset = [];
  private columnHeaders3D = [
    {
      title: "弾性係数",
      align: "center",
      colModel: [
        {
          title: "E(kN/m2)",
          dataType: "float",
          dataIndx: "E",
          sortable: false,
          width: 120,
        },
      ],
    },
    {
      title: "せん断弾性係数",
      align: "center",
      colModel: [
        {
          title: "G(kN/m2)",
          dataType: "float",
          dataIndx: "G",
          sortable: false,
          width: 130,
        },
      ],
    },
    {
      title: "膨張係数",
      align: "center",
      colModel: [
        {
          title: "",
          dataType: "float",
          dataIndx: "Xp",
          sortable: false,
          width: 100,
        },
      ],
    },
    {
      title: "断面積",
      align: "center",
      colModel: [
        {
          title: "A(m2)",
          dataType: "float",
          format: "#.0000",
          dataIndx: "A",
          sortable: false,
          width: 100,
        },
      ],
    },
    {
      title: "ねじり定数",
      align: "center",
      colModel: [
        {
          title: "J(m4)",
          dataType: "float",
          format: "#.000000",
          dataIndx: "J",
          sortable: false,
          width: 100,
        },
      ],
    },
    {
      title: "断面二次モーメント",
      align: "center",
      colModel: [
        {
          title: "Iy (m4)",
          dataType: "float",
          format: "#.000000",
          dataIndx: "Iy",
          sortable: false,
          width: 100,
        },
        {
          title: "Iz (m4)",
          dataType: "float",
          format: "#.000000",
          dataIndx: "Iz",
          sortable: false,
          width: 100,
        },
      ],
    },
    {
      title: "名称",
      align: "center",
      dataType: "string",
      format: "#.000000",
      dataIndx: "n",
      sortable: false,
      width: 100,
    },
  ];
  private columnHeaders2D = [
    {
      title: "弾性係数",
      align: "center",
      colModel: [
        {
          title: "E(kN/m2)",
          dataType: "float",
          dataIndx: "E",
          sortable: false,
          width: 120,
        },
      ],
    },
    {
      title: "膨張係数",
      align: "center",
      colModel: [
        {
          title: "",
          dataType: "float",
          dataIndx: "Xp",
          sortable: false,
          width: 100,
        },
      ],
    },
    {
      title: "断面積",
      align: "center",
      colModel: [
        {
          title: "A(m2)",
          dataType: "float",
          format: "#.0000",
          dataIndx: "A",
          sortable: false,
          width: 100,
        },
      ],
    },
    {
      title: "断面二次",
      align: "center",
      colModel: [
        {
          title: "I(m4)",
          dataType: "float",
          format: "#.000000",
          dataIndx: "Iz",
          sortable: false,
          width: 100,
        },
      ],
    },
    {
      title: "名称",
      align: "center",
      dataType: "string",
      format: "#.000000",
      dataIndx: "n",
      sortable: false,
      width: 100,
    },
  ];

  private ROWS_COUNT = 15;
  private page = 1;
  private before_page = 1;

  constructor(
    private data: InputElementsService,
    private helper: DataHelperModule,
    private app: AppComponent,
    private three: ThreeService
  ) {}

  ngOnInit() {
    this.ROWS_COUNT = this.rowsCount();
    this.loadPage(1, this.ROWS_COUNT);
    this.three.ChangeMode("elements");
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
      const fix_node = this.data.getElementColumns(currentPage, i);
      this.dataset.push(fix_node);
    }
    this.page = currentPage;

    // nameを検索し、this.datasetに反映させる
    for (let i = 0; i < this.dataset.length; i++) {
      const name = this.data.getAlignName(this.before_page, i);
      this.dataset[i].n = name;
    }
    this.before_page = currentPage;
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
      show: true, // 行番号
      width: 45,
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
      this.three.selectChange("elements", row, column);
    },
    change: (evt, ui) => {
      // copy&pasteで入力した際、超過行が消えてしまうため、addListのループを追加.
      for (const target of ui.addList) {
        const no: number = target.rowIndx;
        const newRow = target.newRow;
        const element = this.data.getElementColumns(this.page, no + 1);
        element['E']  = (newRow.E  !== undefined) ? newRow.E  : '';
        element['G']  = (newRow.G  !== undefined) ? newRow.G  : '';
        element['Xp'] = (newRow.Xp !== undefined) ? newRow.Xp : '';
        element['A']  = (newRow.A  !== undefined) ? newRow.A  : '';
        element['J']  = (newRow.J  !== undefined) ? newRow.J  : '';
        element['Iy'] = (newRow.Iy !== undefined) ? newRow.Iy : '';
        element['Iz'] = (newRow.Iz !== undefined) ? newRow.Iz : '';
        element['n']  = (newRow.n  !== undefined) ? newRow.n  : '';
        this.dataset.splice(no, 1, element)
      }
      this.three.changeData("elements", this.page);
      // 名称が変更されたら、変更を内部データ全体に反映させる
      if ("n" in ui.updateList[0].newRow) {
        this.data.matchName(ui.updateList[0].rowData);
      }
    },
  };

  width = this.helper.dimension === 3 ? 950 : 620;
}
