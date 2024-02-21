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
  public colsShow: any[] = new Array();
  isCtrlShiftPressed = false; // Flag to track Ctrl + Shift key combination
  constructor(
    public helper: DataHelperModule,
  ) {
  }

  private createGrid() {
    this.options.beforeCellKeyDown = (evt, ui) => {
      let mov = 1;
      
      // Shiftを押したら左に動く
      // if (evt.shiftKey === true){
      //   // debugger
      //   console.log('Shift');
      //   mov = -1;
      // }
      
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
        if (evt.shiftKey) {
          // 「Shift」「Tab」
         
          if (ui.colIndx > 0) {
            // 左に移動
            const countCols = this.grid.getColModel().length - 1;
            const colIndx = ui.colIndx > countCols ? countCols : ui.colIndx;
            this.grid.setSelection({
              rowIndx: ui.rowIndx,
              colIndx: colIndx - mov,
              focus: true,
            });
          } else {
            // 前の行の右端に移動
            if (ui.rowIndx - mov >= 0) {
              const prevRowCols = this.grid.getColModel().length - 1;
              this.grid.setSelection({
                rowIndx: ui.rowIndx - mov,
                colIndx: prevRowCols ,
                focus: true,
              });
            }
          }
        } else {
          const indexCrr = this.colsShow.indexOf(ui.colIndx);
          let colNext = this.colsShow[indexCrr + 1];
          if (indexCrr === this.colsShow.length - 1) {
            this.grid.setSelection({
              rowIndx: ui.rowIndx + mov,
              colIndx: 0,
              focus: true,
            });
          }
          else {
            this.grid.setSelection({
              rowIndx: ui.rowIndx,
              colIndx: colNext,
              focus: true,
            });
          }
          // if ($cell.length > 0) {
          //   // 右に移動
          //   this.grid.setSelection({
          //     rowIndx: ui.rowIndx,
          //     colIndx: ui.colIndx + mov,
          //     focus: true,
          //   });
          // } else {
          //   // 次の行の左端に移動
          //   this.grid.setSelection({
          //     rowIndx: ui.rowIndx + mov,
          //     colIndx: 0,
          //     focus: true,
          //   });
          // }
        }
        // if ($cell.length > 0) {
        //   // 右に移動
        //   this.grid.setSelection({
        //     rowIndx: ui.rowIndx,
        //     colIndx: ui.colIndx + mov,
        //     focus: true,
        //   });
        // } else {
        //   // 次の行の左端に移動
        //   this.grid.setSelection({
        //     rowIndx: ui.rowIndx + mov,
        //     colIndx: 0,
        //     focus: true,
        //   });
        // }
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
    this.div.nativeElement.addEventListener('wheel', this.onMouseWheel.bind(this));
    this.div.nativeElement.addEventListener('keydown', this.onKeyDown.bind(this));
    this.div.nativeElement.addEventListener('keyup', this.onKeyUp.bind(this));
  }
  onKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey && event.shiftKey) {
      this.isCtrlShiftPressed = true;
      event.preventDefault(); // Prevent the default behavior of the mouse wheel
    }
  }

  onKeyUp(event: KeyboardEvent) {
    if (!event.ctrlKey || !event.shiftKey) {
      this.isCtrlShiftPressed = false;
    }
  }

  onMouseWheel(event: WheelEvent) {
    if (event.ctrlKey ) {
      event.preventDefault(); // Prevent the default behavior of the mouse wheel
      if(event.shiftKey){
        // debugger
        event.preventDefault();
        const scrollAmount = 20; // Adjust the scroll amount as per your requirement
        let elementChildren = this.div.nativeElement;
        let element = document.getElementsByClassName("pq-cont-right")
    
        if (event.deltaY > 0) {
             for (let i = 0; i < element.length; i++) {
            let elemento = element[i];
            elemento.scrollLeft += scrollAmount;
        }
          
            elementChildren.scrollLeft += scrollAmount;


        } else if (event.deltaY < 0) {
         // Scroll up
         for (let i = 0; i < element.length; i++) {
          let elemento = element[i];
          elemento.scrollLeft -= scrollAmount;
        }
        }
      }

    }
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
