import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild, Renderer2, HostListener } from '@angular/core';
import pq from 'pqgrid';
import { DataHelperModule } from "src/app/providers/data-helper.module";

//import few localization files for this demo.
import 'pqgrid/localize/pq-localize-en.js';
import 'pqgrid/localize/pq-localize-ja.js';

@Component({
  selector: 'app-sheet',
  templateUrl: './sheet.component.html',
  styleUrls: ['./sheet.component.scss']
})
export class SheetComponent implements AfterViewInit, OnChanges {

  @ViewChild('pqgrid') div: ElementRef;
  @Input() options: any;

  public grid: pq.gridT.instance = null;

  constructor(
    public helper: DataHelperModule,
  ) {
  }

  private createGrid() {
    this.options.beforeCellKeyDown = (evt, ui) => {
      let mov = 1;
      /*
      // Shiftを押したら左に動く
      if (evt.shiftKey === true){
        mov = -1;
      }
      */
      if (evt.key === 'Enter') {
        const $cell = this.grid.getCell({
          rowIndx: ui.rowIndx + mov,
          colIndx: ui.colIndx,
        });
        this.grid.setSelection({
          rowIndx: ui.rowIndx + mov,
          colIndx: ui.colIndx,
          focus: true,
        });
        return false;
      }
      if (evt.key === 'Tab') {
        const $cell = this.grid.getCell({
          rowIndx: ui.rowIndx,
          colIndx: ui.colIndx + mov,
        });

        if ($cell.length > 0) {
          // 右に移動
          this.grid.setSelection({
            rowIndx: ui.rowIndx,
            colIndx: ui.colIndx + mov,
            focus: true,
          });
        } else {
          // 次の行の左端に移動
          this.grid.setSelection({
            rowIndx: ui.rowIndx + mov,
            colIndx: 0,
            focus: true,
          });
        }
        return false;
      }

      return true;
    };
    this.options.editorKeyDown = (evt, ui) => {
      let mov = 1;
      if(evt.keyCode === 13) {
        this.grid.setSelection({
          rowIndx: ui.rowIndx + mov,
          colIndx: 0,
          focus: true,
        });
        return false;
      }
      return true;
    }
    this.grid = pq.grid(this.div.nativeElement, this.options);
    this.grid.Columns().alter(() => {
      this.grid.option('rowSpanHead', true)
    })
    this.grid.option('fillHandle', 'all');
    this.grid.option("autofill", true);
  }

  ngOnChanges(obj: SimpleChanges) {
    //debugger;
    if (!obj.options.firstChange) {//grid is destroyed and recreated only when whole options object is changed to new reference.
      this.grid.destroy();
      this.createGrid();
    }
  }

  ngAfterViewInit() {
    this.createGrid();
  }

  refreshDataAndView() {
    if (this.grid === null) {
      return;
    }
    this.grid.refreshDataAndView();
    console.log('refreshDataAndView');

  }

  loadStrengthActive = false;
  @HostListener('document:mouseover', ['$event'])
  toggleActive(event: Event) {
    const elements = [
      { iconId: '#load-strength-info', tableId: '#load-strength-table', activeProp: 'loadStrengthActive' }
    ];
  
    for (let element of elements) {
      this.handleElementActivation(element, event);
    }
  }

  handleElementActivation(element: any, event: Event) {
    const elQAIcon = window.document.querySelector(element.iconId);
    const elTable = window.document.querySelector(element.tableId);
    const grandEl = elQAIcon?.parentElement?.parentElement;
  
    this[element.activeProp] = grandEl?.classList.contains('active') || false;
  
    if (grandEl?.contains(event.target as Node)) {
      grandEl.classList.add('active');
    } else if (elTable.contains(event.target as Node) && this[element.activeProp]) {
    } else {
      grandEl?.classList.remove('active');
    }
  }  
}
