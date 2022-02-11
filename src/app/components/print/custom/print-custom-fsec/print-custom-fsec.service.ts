import { Injectable } from "@angular/core";
import { InputElementsService } from "src/app/components/input/input-elements/input-elements.service";
import { InputMembersService } from "src/app/components/input/input-members/input-members.service";
import { ArrayCamera } from "three";

@Injectable({
  providedIn: "root",
})
export class PrintCustomFsecService {
  public dataset: any[];
  public fsecEditable: boolean[];
  public flg: boolean;

  constructor(
    private member: InputMembersService,
    private element: InputElementsService
  ) {
    this.fsecEditable = [
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
    ];
  }

  clear() {
    this.dataset = new Array();
    this.loadData();
  }

  // 断面力部材番号の選択をすべてtrueにする
  checkReverse() {
    for (const index of this.dataset) {
      index["check"] = true;
    }
  }

  // 指定行row 以降のデータを読み取る
  public loadData(): void {
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
      this.dataset.push(member);
    }
  }
}
