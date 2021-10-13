import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from "@angular/core";
import { PrintService } from "../../print.service";

@Component({
  selector: "app-print-three",
  templateUrl: "./print-three.component.html",
  styleUrls: [
    "./print-three.component.scss",
    "../../../../app.component.scss",
    // "../invoice.component.scss",
  ],
})
export class PrintThreeComponent implements OnInit {
  public title1: string;
  public print_target: any[];
  public three_break:any[];
  // @ViewChild('img') img: ElementRef;
  constructor(public printService: PrintService) {
  }

  ngOnInit(): void {
    this.print_target = this.printService.print_target.result;
    for (let i = 0; i < this.print_target.length; i++) {
      if (i === 0) {
        const target = this.print_target[0];
        target["judge"] = false;
      } else {
        const target = this.print_target[i];
        target["judge"] = i % 3 === 0 ? true : false;
      }
    }
    this.title1 = this.printService.print_target.title1;
  }
}
