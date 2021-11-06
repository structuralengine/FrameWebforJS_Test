import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from "@angular/core";
import { ThreeService } from "src/app/components/three/three.service";
import { PrintCustomThreeService } from "../../custom/print-custom-three/print-custom-three.service";
import { PrintService } from "../../print.service";

@Component({
  selector: "app-print-three",
  templateUrl: "./print-three.component.html",
  styleUrls: [
    "./print-three.component.scss",
    "../../../../app.component.scss",
    "../invoice.component.scss",
  ],
})
export class PrintThreeComponent implements OnInit {
  public title1: string;
  public print_target: any[];
  public three_break: any[];
  // @ViewChild('img') img: ElementRef;
  constructor(
    public printService: PrintService,
    public customThree: PrintCustomThreeService,
    public three: ThreeService
  ) {}

  ngOnInit(): void {
    this.print_target = this.printService.print_target.result;
    // let caseCount = this.three.selectedNumber
    let selectCount = this.three.selectedNumber;
    let mode = this.three.mode;
    for (let i = 0; i < this.print_target.length; i++) {
      if (i === 0) {
        const target = this.print_target[0];
        target["judge"] = false;
      } else {
        const target = this.print_target[i];
        if (mode === "fsec" || mode === "comb_fsec" || mode === "pik_fsec") {
          if (selectCount < 3) {
            target["judge"] = i % selectCount === 0 ? true : false;
          } else {
            target["judge"] =
              i % selectCount === 0 || (i - 3) % selectCount === 0
                ? true
                : false;
            console.log("2");
          }
        } else {
          target["judge"] = i % 3 === 0 ? true : false;
        }
      }
    }
    this.title1 = this.printService.print_target.title1;
  }
}
