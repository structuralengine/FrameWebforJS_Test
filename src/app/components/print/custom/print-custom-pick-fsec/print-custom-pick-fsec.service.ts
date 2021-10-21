import { Injectable } from "@angular/core";
import { InputMembersService } from "src/app/components/input/input-members/input-members.service";
import { PrintCustomPickFsecComponent } from "./print-custom-pick-fsec.component";

@Injectable({
  providedIn: "root",
})
export class PrintCustomPickFsecService {
  public dataset = [];

  constructor(private member: InputMembersService) {
    // for (let i = 0; i < this.member.member.length; i++) {
    //   this.judgeArr.push(false);
    // }
  }
}
