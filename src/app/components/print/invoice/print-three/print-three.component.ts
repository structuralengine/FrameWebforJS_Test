import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { PrintService } from '../../print.service';

@Component({
  selector: 'app-print-three',
  templateUrl: './print-three.component.html',
  styleUrls: ['./print-three.component.scss']
})
export class PrintThreeComponent implements AfterViewInit, OnInit {

  public title1: string;
  public print_target: any[];
  // @ViewChild('img') img: ElementRef;
  constructor(public printService: PrintService) {
  }

  ngOnInit(): void {

  }

  ngAfterViewInit(){
    // for(const print_target of this.printService.print_target){
    //   this.img.nativeElement.src = print_target.src;
    // }
  }

}
