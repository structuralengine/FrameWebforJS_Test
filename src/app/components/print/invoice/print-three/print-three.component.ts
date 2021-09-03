import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { PrintService } from '../../print.service';

@Component({
  selector: 'app-print-three',
  templateUrl: './print-three.component.html',
  styleUrls: ['./print-three.component.scss']
})
export class PrintThreeComponent implements OnInit {

  public title1: string;
  public print_target: any[];
  // @ViewChild('img') img: ElementRef;
  constructor(public printService: PrintService) {
  }

  ngOnInit(): void {
    this.print_target = this.printService.print_target.result;
    for(let i=0; i < this.print_target.length; i++){
      const target = this.print_target[i];
      target['judge'] = ((i % 2)===0) ? false: true;
    }
    this.title1 = this.printService.print_target.title1
  }


}
