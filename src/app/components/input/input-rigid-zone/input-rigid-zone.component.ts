import { Component, OnInit, ViewChild } from "@angular/core";
import { InputMembersService } from "../input-members/input-members.service";
import { InputElementsService } from "../input-elements/input-elements.service";
import { DataHelperModule } from "../../../providers/data-helper.module";
import { ThreeService } from "../../three/three.service";
import { SheetComponent } from "../sheet/sheet.component";
import pq from "pqgrid";
import { AppComponent } from "src/app/app.component";
import { TranslateService } from "@ngx-translate/core";
import { DocLayoutService } from "src/app/providers/doc-layout.service";
import { InputRigidZoneService } from "./input-rigid-zone.service";
import { InputNodesService } from "../input-nodes/input-nodes.service";

@Component({
  selector: 'app-input-rigid-zone',
  templateUrl: './input-rigid-zone.component.html',
  styleUrls: ["./input-rigid-zone.component.scss", "../../../app.component.scss"]
})
export class InputRigidZoneComponent implements OnInit {
  @ViewChild("grid") grid: SheetComponent;
  private dataset = [];
  private columnKeys = ['m', 'Ilength','Jlength', 'e', 'L', 'e1', 'n'];
  private columnHeaders3D = [
    {
      title: this.translate.instant("input.input-rigid.member"),
      colModel: [
        {
          title: this.translate.instant("input.input-rigid.no"),
          align: "left",
          dataType: "string",
          dataIndx: this.columnKeys[0],
          sortable: false,
          width: 70,
          editable: false
        },
      ],
    },
    {
      title: this.translate.instant("input.input-rigid.distance"),
      align: "center",
      colModel: [
        {
          title: "(m)",
          dataType: "float",
          format: "#.000",
          dataIndx: this.columnKeys[4],
          sortable: false,
          width: 100,
          editable: false,
          style: { background: "#33363c !important" },
        },
      ],
    },
    {
      title: this.translate.instant("input.input-rigid.material"),
      align: "center",
      colModel: [
        {
          title: this.translate.instant("input.input-rigid.no"),
          dataType: "integer",
          dataIndx: this.columnKeys[3],
          sortable: false,
          minwidth: 100,
          align: "left",
          width: 100,
          editable: false
        },
      ],
    }, 
    {
      title: this.translate.instant("input.input-rigid.material_name"),
      align: "center",
      dataType: "string",
      dataIndx: this.columnKeys[6],
      sortable: false,
      width: 100,
      editable: false,
      style: { background: "#33363c !important" },
    },
    {
      title: this.translate.instant("input.input-rigid.rigid"),
      align: "center",
      colModel: [
        {
          title: this.translate.instant("input.input-rigid.node_i"),
          dataType: "float",
          dataIndx: this.columnKeys[1],
          sortable: false,
          minwidth: 100,
          format: "#.00",
          width: 100,
        },
        {
          title: this.translate.instant("input.input-rigid.node_j"),
          dataType: "float",
          dataIndx: this.columnKeys[2],
          sortable: false,
          minwidth: 100,
          format: "#.00",
          width: 100,
        },
        {
          title: this.translate.instant("input.input-rigid.materialNo"),
          dataType: "integer",
          dataIndx: this.columnKeys[5],
          sortable: false,
          minwidth: 100,
          width: 100,
        },
      ],
    },
  ];
  private columnHeaders2D = [
    {
      title: this.translate.instant("input.input-rigid.member"),
      colModel: [
        {
          title: this.translate.instant("input.input-rigid.no"),
          align: "left",
          dataType: "string",
          dataIndx: this.columnKeys[0],
          sortable: false,
          width: 100,
          editable: false
        },
      ],
    },
    {
      title: this.translate.instant("input.input-rigid.distance"),
      align: "center",
      colModel: [
        {
          title: "(m)",
          dataType: "float",
          format: "#.000",
          dataIndx: this.columnKeys[4],
          sortable: false,
          width: 100,
          editable: false,
          style: { background: "#33363c !important" },
        },
      ],
    },
    {
      title: this.translate.instant("input.input-rigid.material"),
      align: "center",
      colModel: [
        {
          title: this.translate.instant("input.input-rigid.no"),
          dataType: "integer",
          dataIndx: this.columnKeys[3],
          sortable: false,
          align: "left",
          minwidth: 100,
          width: 100,
          editable: false
        },
      ],
    },   
    {
      title: this.translate.instant("input.input-rigid.material_name"),
      align: "center",
      dataType: "string",
      dataIndx: this.columnKeys[6],
      sortable: false,
      width: 100,
      editable: false,
      style: { background: "#33363c !important" },
    },
    {
      title: this.translate.instant("input.input-rigid.rigid"),
      align: "center",
      colModel: [
        {
          title: this.translate.instant("input.input-rigid.node_i"),
          dataType: "float",
          dataIndx: this.columnKeys[1],
          sortable: false,
          format: "#.00",
          minwidth: 100,
          width: 100,
        },
        {
          title: this.translate.instant("input.input-rigid.node_j"),
          dataType: "float",
          dataIndx: this.columnKeys[2],
          sortable: false,
          minwidth: 100,
          format: "#.00",
          width: 100,
        },
        {
          title: this.translate.instant("input.input-rigid.materialNo"),
          dataType: "integer", 
          dataIndx: this.columnKeys[5],
          sortable: false,
          minwidth: 100,
          width: 100,
          editable: false
        },
      ],
    },
  ];
  private ROWS_COUNT = 15;

  private currentIndex: string;
  constructor(
    private data: InputRigidZoneService,
    private member: InputMembersService,
    private node: InputNodesService,
    private element: InputElementsService,
    private helper: DataHelperModule,
    private app: AppComponent,
    private three: ThreeService,
    private translate: TranslateService,
    public docLayout: DocLayoutService) {
      this.currentIndex = null;
  }
  
  ngOnInit() {
    this.ROWS_COUNT = this.rowsCount();
    // three.js にモードの変更を通知する
    //this.three.ChangeMode("members");
  }
  ngAfterViewInit() {
    this.docLayout.handleMove.subscribe(data => {
    this.options.height = data - 60;
    })
  }
  private loadData(row: number): void {
    for (let i = this.dataset.length + 1; i <= row; i++) {
      const regid = this.data.getRigidColumns(i);
      const m: string = regid["m"];
      const e = (regid.e !== null) ? regid.e : undefined;
      if (m !== "") {
        const l: any = this.member.getMemberLength(m);
        regid["L"] = l != null ? l.toFixed(3) : l;
        const name = this.element.getElementName(e);
        regid["n"] = name != null ? name : "";
      }
      this.dataset.push(regid);
    }
  }
  private getMember(memberNo: string) {

    const member = this.member.member.find((columns) => {
      return columns.id === memberNo;
    })

    if (member === undefined) {
      return { ni: null, nj: null };
    }

    return member;

  }
  public getMemberLength(memberNo: string): number {

    const memb = this.getMember(memberNo.toString());
    if (memb.ni === undefined || memb.nj === undefined) {
      return null;
    }
    const ni: string = memb.ni;
    const nj: string = memb.nj;
    if (ni === null || nj === null) {
      return null;
    }

    const iPos = this.node.getNodePos(ni)
    const jPos = this.node.getNodePos(nj)
    if (iPos == null || jPos == null) {
      return null;
    }

    const xi: number = iPos['x'];
    const yi: number = iPos['y'];
    const zi: number = iPos['z'];
    const xj: number = jPos['x'];
    const yj: number = jPos['y'];
    const zj: number = jPos['z'];

    const result: number = Math.sqrt((xi - xj) ** 2 + (yi - yj) ** 2 + (zi - zj) ** 2);
    return result;

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
      console.log("rigid", this.dataset);
      if (ui.initV == null) {
        return;
      }
      if (finalV >= dataV - 1) {
        this.loadData(dataV + this.ROWS_COUNT);
        this.grid.refreshDataAndView();
      }
    },
  };

  width = this.helper.dimension === 3 ? 580 : 450;
}


