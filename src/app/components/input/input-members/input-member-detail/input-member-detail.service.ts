import { filter } from "rxjs/operators";
import { element } from "protractor";
import { Injectable } from "@angular/core";
import { DataHelperModule } from "../../../../providers/data-helper.module";
import { InputNodesService } from "../../input-nodes/input-nodes.service";

@Injectable({
  providedIn: "root",
})
export class InputMemberDetailService {
  public isMemberDetailShow: boolean = false;
  public entity: any = {};
  constructor(
    private inputNodesService: InputNodesService,
    private helper: DataHelperModule
  ) {
    this.entity = {};
    this.entity.id = "";
    this.entity.ni = "";
    this.entity.nj = "";
    this.entity.L = "";
    this.entity.e = "";
    this.entity.cg = "";
    this.entity.nix = "";
    this.entity.niy = "";
    this.entity.niz = "";
    this.entity.njx = "";
    this.entity.njy = "";
    this.entity.njz = "";
    this.entity.eastic = "";
    this.entity.steelElastic ="";
    this.entity.cte = "";
    this.entity.area = "";
    this.entity.torsionConstant ="";
    this.entity.inertiaIy = "";
    this.entity.inertiaIz = "";
    this.entity.nameOfMaterial = "";
  }

  setShowHideDetail(value: boolean) {
    this.isMemberDetailShow = value;
  }

  setDataEntity(data: any, element: any, member: any) {
    this.entity.id = member.id; //Member No
    this.entity.ni = member.ni;
    this.entity.nj = member.nj;
    this.entity.L = member.L; //Distance
    this.entity.e = member.e; //Material No
    this.entity.cg = member.cg; //Angle of Rocation

    if (data.node?.node != null) {
      var nodei = data.node.node.filter((x) => x.id == member.ni)[0];
      if (nodei) {
        this.entity.nix = nodei.x;
        this.entity.niy = nodei.y;
        this.entity.niz = nodei.z;
      }
      var nodej = data.node.node.filter((x) => x.id == member.nj)[0];
      if (nodej) {
        this.entity.njx = nodej.x;
        this.entity.njy = nodej.y;
        this.entity.njz = nodej.z;
      }
    }
    //["E", "G", 'Xp', 'A', 'J', 'Iy', 'Iz', 'n']
    if (element.element && member.e != "") {
      var el = element.element[1].filter((x) => x.id === member.e)[0];
      if (el) {
        this.entity.eastic = el.E;
        this.entity.steelElastic = el.G;
        this.entity.cte = el.Xp;
        this.entity.area = el.A;
        this.entity.torsionConstant = el.J;
        this.entity.inertiaIy = el.Iy;
        this.entity.inertiaIz = el.Iz;
        this.entity.nameOfMaterial = el.n;
      }
    }
  }
}
