import { Component, OnInit, ViewChild } from "@angular/core";
import { SheetComponent } from "../../../input/sheet/sheet.component";
import pq from "pqgrid";
import { AppComponent } from "src/app/app.component";
import { PrintService } from "../../print.service";
import { InputMembersService } from "src/app/components/input/input-members/input-members.service";
import { InputElementsService } from "src/app/components/input/input-elements/input-elements.service";
import { PrintCustomPickFsecService } from "./print-custom-pick-fsec.service";

@Component({
  selector: "app-print-custom-pick-fsec",
  templateUrl: "./print-custom-pick-fsec.component.html",
  styleUrls: ["./print-custom-pick-fsec.component.scss"],
})
export class PrintCustomPickFsecComponent implements OnInit {
  @ViewChild("grid") grid: SheetComponent;

  private columnHeaders: any = [
    //{ title: "パネルID", dataType: "integer", dataIndx: "panelID",  sortable: false, width: 40 },
    {
      title: "部材長",
      align: "center",
      dataType: "float",
      format: "#.000",
      dataIndx: "L",
      sortable: false,
      width: 100,
      editable: false,
      style: { background: "#dae6f0" },
    },
    {
      title: "材料名称",
      align: "center",
      dataType: "string",
      dataIndx: "n",
      sortable: false,
      width: 250,
      editable: false,
      style: { background: "#dae6f0" },
    },
    {
      title: "印刷対象",
      width: 100,
      dataIndx: "check",
      align: "center",
      resizable: false,
      menuIcon: false,
      type: "checkBoxSelection",
      cls: "ui-state-default",
      sortable: false,
      editor: false,
      dataType: "bool",
      cb: {
        all: false, //checkbox selection in the header affect current page only.
        header: true, //show checkbox in header.
      },
    },
  ];

  public judgeArr: boolean[];

  constructor(
    private app: AppComponent,
    private data: PrintCustomPickFsecService,
    private member: InputMembersService,
    private element: InputElementsService
  ) {
    // for (let i = 0; i < this.member.member.length; i++) {
    //   this.judgeArr.push(false);
    // }
  }

  ngOnInit(): void {
    this.loadData();
  }

  // 指定行row 以降のデータを読み取る
  private loadData(): void {
    for (let i = 1; i <= this.member.member.length; i++) {
      const member = this.member.getMemberColumns(i);
      const m: string = member["id"];
      const e = member.e;
      if (m !== "") {
        const l: any = this.member.getMemberLength(m);
        member["L"] = l != null ? l.toFixed(3) : l;
        const name = this.element.getElementName(e);
        member["n"] = name != null ? name : "";
      }
      this.data.dataset.push(member);
    }
  }

  // 表の高さを計算する
  private tableHeight(): string {
    const containerHeight = this.app.getDialogHeight();
    return containerHeight.toString();
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
    toolbar: {
      items: [
        {
          type: "button",
          label: "Get Row ID of checkboxes",
          listener: function () {
            var checked = this.Checkbox("state")
              .getCheckedNodes()
              .map(function (rd) {
                return rd.id;
              });
            alert(checked);
          },
        },
      ],
    },
    colModel: this.columnHeaders,
    dataModel: {
      data: this.data.dataset,
    },
    // beforeTableView: (evt, ui) => {
    //   const finalV = ui.finalV;
    //   const dataV = this.data.dataset.length;
    //   if (ui.initV == null) {
    //     return;
    //   }
    //   if (finalV >= dataV - 1) {
    //     this.loadData(dataV + this.ROWS_COUNT);
    //     this.grid.refreshDataAndView();
    //   }
    // },
    // selectEnd: (evt, ui) => {
    //   const range = ui.selection.iCells.ranges;
    //   const row = range[0].r1 + 1;
    //   const column = range[0].c1;
    // },
    // change: (evt, ui) => {
    //   const changes = ui.updateList;
    //   for (const target of changes) {
    //     const row: number = target.rowIndx;
    //     const exist = target.rowData.L;
    //     if (exist === "") {
    //       continue;
    //     }
    //     //const new_value = target.rowData;
    //     // const printBool: {} = this.data.dataset[row];
    //     // const pri: string = printBool["check"];
    //     // if (printBool === "") {
    //     //   continue;
    //     // }
    //     // this.data.printJudge(row, pri);
    //     // const l: number = this.data.getMemberLength(m);
    //     // const column = this.dataset[row];
    //     // if (l != null) {
    //     //   column["L"] = l.toFixed(3);
    //     //   // this.grid.refreshDataAndView();
    //     // } else {
    //     //   column["L"] = null;
    //     // }
    //     // const n: string =
    //     //   target.rowData.e === undefined
    //     //     ? ""
    //     //     : this.element.getElementName(target.rowData.e);
    //     // if (n != null) {
    //     //   this.dataset[row]["n"] = n;
    //     //   this.grid.refreshDataAndView();
    //     // }
    //   }
    // },
  };

  width = 1000;
}
