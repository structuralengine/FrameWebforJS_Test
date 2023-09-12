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
  public getRigidZoneColums(mem: number): any {
    let result: any = null;
    for (const tmp of this.rigid_zone) {
      if (tmp["m"].toString() === mem.toString()) {
        result = tmp;
        break;
      }
    }
    if (result === null) {
      result = { m: "", Ilength: "", Jlength: "", e: "", L: '', e1: '', n: '' };
      this.rigid_zone.push(result);
    }
    return result;
  }

  public setRigidJson(jsonData: {}): void {
    this.clear()
    const json: {} = jsonData['member'];
    if (!('rigid' in jsonData)) {
      for (const index of Object.keys(json)) {
        const item = json[index];
        const e = this.helper.toNumber(item['e']);
        const result = {
          m: index,
          Ilength: '',
          Jlength: '',
          e: (e == null) ? '' : e.toFixed(0),
          L: '',
          e1: '',
          n: ''
        };
        this.rigid_zone.push(result);
      }
    } else {
      const json1: any = jsonData['rigid'];
      for (const index of Object.keys(json)) {

        const item = json[index];
        const e = this.helper.toNumber(item['e']);
        const rigid = json1.find(x => x['m'] === index);
        if (rigid !== undefined) {
          const result = {
            m: index,
            Ilength: rigid['Ilength'],
            Jlength: rigid['Jlength'],
            e: (e == null) ? '' : e.toFixed(0),
            L: '',
            e1: rigid['e'],
            n: ''
          };
          console.log("result", result);
          this.rigid_zone.push(result);
        } else {
          const result = {
            m: index,
            Ilength: '',
            Jlength: '',
            e: (e == null) ? '' : e.toFixed(0),
            L: '',
            e1: '',
            n: ''
          };
          this.rigid_zone.push(result);
        }
      }
    }

  }
  public getRigidJson() {
    const result = new Array();

    for (const row of this.rigid_zone) {
      const m = this.helper.toNumber(row["m"]);
      if (m == null) {
        continue;
      }
      if (row['e1'] !== "") {
        result.push({
          m: row['m'],
          Ilength: row['Ilength'],
          Jlength: row['Jlength'],
          e: row['e1']
        });
      }
    }
    return result;
  }
}

