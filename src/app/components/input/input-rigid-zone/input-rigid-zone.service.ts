import { Injectable } from '@angular/core';
import { InputNodesService } from '../input-nodes/input-nodes.service';
import { DataHelperModule } from 'src/app/providers/data-helper.module';

@Injectable({
  providedIn: 'root'
})
export class InputRigidZoneService {
  public rigid_zone: any[];

  constructor(private node: InputNodesService,
              private helper: DataHelperModule) {
    this.clear();
  }
  public clear(): void {
    this.rigid_zone = new Array();    
  }
  public getRigidZoneColums(mem: number): any{
    let result: any = null;
   for(const tmp of this.rigid_zone){
    if (tmp["m"].toString() === mem.toString()) {
      result = tmp;
      break;
    }
   }
   if(result === null){
    result = {m: mem.toString(), ILength:"", JLength:"", e: "", cg:'', L:''};
    this.rigid_zone.push(result);
   }
  }
  public setMemberJson(jsonData: {}): void {
    if (!('member' in jsonData)) {
      return;
    }
    const json: {} = jsonData['member'];
    for (const index of Object.keys(json)) {

      const item = json[index];
      const e = this.helper.toNumber(item['e']);
      const cg = this.helper.toNumber(item['cg']);

      const result = {
        m: '',
        L: '',       
        e: (e == null) ? '' : e.toFixed(0),
        cg: (cg == null) ? '' : cg.toFixed(0),
        
      };
      
      this.rigid_zone.push(result);
    }
  }
}

