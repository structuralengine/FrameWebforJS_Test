import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import html2canvas from 'html2canvas';
import { PrintService } from '../../print.service';

@Component({
  selector: 'app-print-three',
  templateUrl: './print-three.component.html',
  styleUrls: ['./print-three.component.scss']
})
export class PrintThreeComponent implements AfterViewInit, OnInit {
  
  @ViewChild('img') img: ElementRef;

  constructor(public printService: PrintService) {
  }

  ngOnInit(): void {
    

  }

  ngAfterViewInit(){

    this.img.nativeElement.src = this.printService.imgList[0];
  }

}
