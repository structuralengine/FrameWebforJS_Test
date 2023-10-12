import { Component, OnInit, ViewChild } from "@angular/core";
import { DataHelperModule } from "../../../../providers/data-helper.module";
import { AppComponent } from "src/app/app.component";
import { TranslateService } from "@ngx-translate/core";
import { DocLayoutService } from "src/app/providers/doc-layout.service";
import { ThreeMembersService } from "../../../three/geometry/three-members.service";
import { InputMemberDetailService } from "./input-member-detail.service";
import { InputMembersService } from "../input-members.service";
import { InputElementsService } from "../../input-elements/input-elements.service";

@Component({
  selector: "app-input-member-detail",
  templateUrl: "./input-member-detail.component.html",
  styleUrls: ["./input-member-detail.component.scss"],
})
export class InputMemberDetailComponent implements OnInit {


  constructor(
    private data: InputMembersService,
    private element: InputElementsService,
    private helper: DataHelperModule,
    private app: AppComponent,
    private threeMembersService: ThreeMembersService,
    private translate: TranslateService, public docLayout:DocLayoutService,
    public inputMemberDetailService: InputMemberDetailService
  ) {
  }

  ngOnInit() {

  }

  ngAfterViewInit() {
   
  }
  updateDetail(){
    this.inputMemberDetailService.updateDetail(this.data, this.element);
  }
  onChangeNodeI(event:any, type: any){
    let valueInput = event.target.value;
    this.inputMemberDetailService.getValueNodeI(this.data, valueInput, type);
  }
  onChangeMaterial(event:any){
    let valueInput = event.target.value;
    this.inputMemberDetailService.getValueMaterial(this.element, valueInput);
  }
}
