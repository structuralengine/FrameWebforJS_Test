import { initializeApp } from '@angular/fire/app';
import { filter } from "rxjs/operators";
import { element } from "protractor";
import { Injectable } from "@angular/core";
import { DataHelperModule } from "../../../../providers/data-helper.module";
import { InputNodesService } from "../../input-nodes/input-nodes.service";
import { InputMembersService } from "../input-members.service";
import { TranslateService } from "@ngx-translate/core";

@Injectable({
  providedIn: "root",
})
export class InputMemberDetailService {
  public isMemberDetailShow: boolean = false;
  public entity: any = {};
  constructor(
    private data: InputMembersService,
    private translate: TranslateService,
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
    this.entity.steelElastic = "";
    this.entity.cte = "";
    this.entity.area = "";
    this.entity.torsionConstant = "";
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

  // update value if existed in list
  // add new value if not existed in list
  updateDetail(data: any, element: any) {
    // handle node-I
    var nodei = data.node.node.filter((x) => x.id == this.entity.ni)[0];
    if (nodei) {
      nodei.x = this.entity.nix;
      nodei.y = this.entity.niy;
      nodei.z = this.entity.niz;
    } else {
      data.node.node.push({
        id: this.entity.ni,
        x: this.entity.nix,
        y: this.entity.niy,
        z: this.entity.niz,
      });
    }

    // handle node-j
    var nodej = data.node.node.filter((x) => x.id == this.entity.nj)[0];
    if (nodej) {
      nodej.x = this.entity.njx;
      nodej.y = this.entity.njy;
      nodej.z = this.entity.njz;
    } else {
      data.node.node.push({
        id: this.entity.nj,
        x: this.entity.njx,
        y: this.entity.njy,
        z: this.entity.njz,
      });
    }

    // handle material
    var el = element.element[1].filter((x) => x.id === this.entity.e)[0];
    if (el) {
      el.E = this.entity.eastic;
      el.G = this.entity.steelElastic;
      el.Xp = this.entity.cte;
      el.A = this.entity.area;
      el.J = this.entity.torsionConstant;
      el.Iy = this.entity.inertiaIy;
      el.Iz = this.entity.inertiaIz;
      el.n = this.entity.nameOfMaterial;
    } else {
      element.element[1].push({
        id: this.entity.e,
        E: this.entity.eastic,
        G: this.entity.steelElastic,
        Xp: this.entity.cte,
        A: this.entity.area,
        J: this.entity.torsionConstant,
        Iy: this.entity.inertiaIy,
        Iz: this.entity.inertiaIz,
        n: this.entity.nameOfMaterial,
      });
    }

    // handle member
    var memberUpdate = this.data.member.filter(m => m.id === this.entity.id)[0];
    memberUpdate.ni = this.entity.ni;
    memberUpdate.nj = this.entity.nj;
    memberUpdate.e = this.entity.e;
    memberUpdate.cg = this.entity.cg;
    memberUpdate.n = this.entity.n;

    this.helper.alert(
      this.translate.instant("menu.update_success") // 一時的にポイント消費量の通知を削除
      /*this.user.deduct_points
      + this.translate.instant("menu.deduct_points")
      + this.user.new_points
      + this.translate.instant("menu.new_points")*/
    );
  }

  // type 0-1: nodeI-nodeJ
  getValueNodeI(data: any, value: any, type: any) {
    var node = data.node.node.filter((x) => x.id == value)[0];
    if (node && (node.x != "" && node.y != "" && node.z != "")) {
      if (type === 0) {
        this.entity.nix = node.x;
        this.entity.niy = node.y;
        this.entity.niz = node.z;
      } else {
        this.entity.njx = node.x;
        this.entity.njy = node.y;
        this.entity.njz = node.z;
      }
    } else {
      if (type === 0) {
        this.entity.nix = 0;
        this.entity.niy = 0;
        this.entity.niz = 0;
      } else {
        this.entity.njx = 0;
        this.entity.njy = 0;
        this.entity.njz = 0;
      }
    }
  }

  getValueMaterial(element: any, value: any) {
    //["E", "G", 'Xp', 'A', 'J', 'Iy', 'Iz', 'n']
    if (element.element && value != "") {
      var el = element.element[1].filter((x) => x.id === value)[0];
      if (el) {
        this.entity.eastic = el.E;
        this.entity.steelElastic = el.G;
        this.entity.cte = el.Xp;
        this.entity.area = el.A;
        this.entity.torsionConstant = el.J;
        this.entity.inertiaIy = el.Iy;
        this.entity.inertiaIz = el.Iz;
        this.entity.nameOfMaterial = el.n;
      } else {
        this.initializeValueMaterial();
      }
    } else {
      this.initializeValueMaterial();
    }
  }

  initializeValueMaterial() {
    this.entity.eastic = 0;
    this.entity.steelElastic = 0;
    this.entity.cte = 0;
    this.entity.area = 0;
    this.entity.torsionConstant = 0;
    this.entity.inertiaIy = 0;
    this.entity.inertiaIz = 0;
    this.entity.nameOfMaterial = "";
  }
}
