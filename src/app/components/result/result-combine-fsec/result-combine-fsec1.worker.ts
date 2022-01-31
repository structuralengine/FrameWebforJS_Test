/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {

  // 文字列string を数値にする
  const toNumber = (num: string) => {
    let result: number = null;
    try {
      const tmp: string = num.toString().trim();
      if (tmp.length > 0) {
        result = ((n: number) => isNaN(n) ? null : n)(+tmp);
      }
    } catch {
      result = null;
    }
    return result;
  };

  const defList = data.defList;
  const combList = data.combList;
  const fsec = data.fsec;
  const fsecKeys = data.fsecKeys;

  // 全ケースに共通する着目点のみ対象とするために削除する id を記憶
  const delList = [];

  // defineのループ
  const fsecDefine = {};
  for (const defNo of Object.keys(defList)) {
    const temp = {};
    //
    for (const caseInfo of defList[defNo]) {
      let baseNo: string = '';
      if(typeof caseInfo === "number"){
        baseNo = Math.abs(caseInfo).toString();
      } else {
        baseNo = caseInfo;
      }
      const coef: number = Math.sign(caseInfo);

      if (!(baseNo in fsec)) {
        if(caseInfo === 0 ){
          // 値が全て0 の case 0 という架空のケースを用意する
          // 値は coef=0 であるため 0 となる
          fsec['0'] = Object.values(fsec)[0];
        } else {
          continue;
        }
      }

      // カレントケースを集計する
      for (const key of fsecKeys) {
        // 節点番号のループ
        const obj = {};
        let m: string;
        for (const d of fsec[baseNo]) {
          if(d.m.length> 0){
            m = d.m;
          }
          let id = m + '-' + d.l.toFixed(3);
          obj[id] = {
            m: d.m,
            l: d.l,
            n: d.n,
            fx: coef * d.fx,
            fy: coef * d.fy,
            fz: coef * d.fz,
            mx: coef * d.mx,
            my: coef * d.my,
            mz: coef * d.mz,
            case: caseInfo,
          };
        }

        if (key in temp) {
          // 大小を比較する
          const kk = key.split('_');
          const k1 = kk[0]; // dx, dy, dz, rx, ry, rz
          const k2 = kk[1]; // max, min

          for (const id of Object.keys(temp[key])) {
            if (!(id in obj)) {
              delList.push(id);
              continue;
            }
            if (k2 === 'max') {
              if (temp[key][id][k1] < obj[id][k1]) {
                temp[key][id] = obj[id];
              }
            } else if (k2 === 'min') {
              if (temp[key][id][k1] > obj[id][k1]) {
                temp[key][id] = obj[id];
              }
            }
          }
        } else {
          temp[key] = obj;
        }
      }
    }
    fsecDefine[defNo] = temp;
  }

  // 全ケースに共通する着目点のみ対象とするため
  // 削除する
  for (const id of Array.from(new Set(delList))) {
    for (const defNo of Object.keys(fsecDefine)) {
      for (const temp of fsecDefine[defNo]) {
        for (const key of Object.keys(temp)) {
          const obj = temp[key];
          delete obj[id];
        }
      }
    }
  }

  // combineのループ
  const max_values = {};
  const fsecCombine = {};
  for (const combNo of Object.keys(combList)) {
    const max_value = {
      fx: 0, fy: 0, fz: 0,
      mx: 0, my: 0, mz: 0
    }
    const temp = {};
    //
    for (const caseInfo of combList[combNo]) {
      const caseNo = Number(caseInfo.caseNo);
      const defNo: string = caseInfo.caseNo.toString();
      const coef: number = caseInfo.coef;

      if (!(defNo in fsecDefine)) {
        continue;
      }
      if (coef === 0) {
        continue;
      }

      const fsecs = fsecDefine[defNo];
      if(Object.keys(fsecs).length < 1) continue;

      // カレントケースを集計する
      const c2 = Math.abs(caseNo).toString().trim();
      for (const key of fsecKeys) {
        // 節点番号のループ
        const obj1 = [];
        for (const id of Object.keys(fsecs[key])) {
          const d = fsecs[key][id];
          const c1 = Math.sign(coef) < 0 ? -1 : 1 * d.case;
          let caseStr = '';
          if (c1 !== 0){
            caseStr = (c1 < 0 ? "-" : "+") + c1;
          }
          obj1.push({
            m: d.m,
            l: d.l,
            n: d.n,
            fx: coef * d.fx,
            fy: coef * d.fy,
            fz: coef * d.fz,
            mx: coef * d.mx,
            my: coef * d.my,
            mz: coef * d.mz,
            case: caseStr
          });
        }
        if (key in temp) {
          for (let row = 0; row < obj1.length; row++) {
            for (const k of Object.keys(obj1[row])) {
              const value = obj1[row][k];
              if (k === 'm' || k === 'l') {
                temp[key][row][k] = value;
              } else if (k === 'n') {
                temp[key][row][k] = (toNumber(value) !== null) ? value : '';
              } else {
                temp[key][row][k] += value;
              }
            }
            temp[key][row]['comb']= combNo;
          }
        } else {
          for (const obj of obj1) {
            obj['comb']= combNo;
          }
          temp[key] = obj1;
        }

        // 最大値を 集計する
        for (const value of temp[key]) {
          max_value.fx = Math.max(Math.abs(value.fx), max_value.fx);
          max_value.fy = Math.max(Math.abs(value.fy), max_value.fy);
          max_value.fz = Math.max(Math.abs(value.fz), max_value.fz);
          max_value.mx = Math.max(Math.abs(value.mx), max_value.mx);
          max_value.my = Math.max(Math.abs(value.my), max_value.my);
          max_value.mz = Math.max(Math.abs(value.mz), max_value.mz);
        }        
      }
    }
    fsecCombine[combNo] = temp;
    max_values[combNo] = max_value;
  }

  const value_range = {};
  // CombineNoごとの最大最小を探す
  for (const combNo of Object.keys(fsecCombine)) {
    const caseData = fsecCombine[combNo];
    const key_list = Object.keys(caseData);
    const values = {};
    // dx～rzの最大最小をそれぞれ探す
    for (const key of key_list) {
      const datas = caseData[key];
     /* */  let key2: string;
      if (key.includes('fx')) {
        key2 = 'fx';
      } else if (key.includes('fy')) {
        key2 = 'fy';
      } else if (key.includes('fz')) {
        key2 = 'fz';
      } else if (key.includes('mx')) {
        key2 = 'mx';
      } else if (key.includes('my')) {
        key2 = 'my';
      } else if (key.includes('mz')) {
        key2 = 'mz';
      }
      let targetValue = (key.includes('max')) ? -65535 : 65535;
      let targetValue_m = '0';
      if (key.includes('max')) {  // 最大値を探す
        //for (const row of Object.keys(datas)) {
        for (let num = 0; num < datas.length; num++) {
          const row = num.toString();
          const data = datas[row][key2];
          if (data >= targetValue) {
            targetValue = data;
            // memberNoがないとき(着目点が最大)の分岐
            if (datas[row].m === '') {
              let m_no: string
              for (let num2 = num - 1; num > 0; num--) {
                const row2 = num2.toString();
                if (datas[row2].m !== '') {
                  m_no = datas[row2].m;
                  break;
                }
              }
              targetValue_m = m_no;
            } else {
              targetValue_m = datas[row].m;
            }
          }
        }
      } else {  // 最小値を探す
        // for (const row of Object.keys(datas)) {
        for (let num = 0; num < datas.length; num++) {
          const row = num.toString();
          const data = datas[row][key2];
          if (data <= targetValue) {
            targetValue = data;
            // memberNoがないとき(着目点が最小)の分岐
            if (datas[row].m === '') {
              let m_no: string
              for (let num2 = num - 1; num > 0; num--) {
                const row2 = num2.toString();
                if (datas[row2].m !== '') {
                  m_no = datas[row2].m;
                  break;
                }
              }
              targetValue_m = m_no;
            } else {
              targetValue_m = datas[row].m;
            }
          }
        }
      }
      if (Math.abs(targetValue) === 65535) {
        continue;
      }
      values[key] = {max: targetValue, max_m: targetValue_m};
    }
    if (Object.keys(values).length === 0) {
      continue;
    }
    const values2 = {
      max_d : Math.max( values['fx_max'].max, values['fy_max'].max, values['fz_max'].max ),
      min_d : Math.min( values['fx_min'].max, values['fy_min'].max, values['fz_min'].max ),
      max_r : Math.max( values['mx_max'].max, values['my_max'].max, values['mz_max'].max ),
      min_r : Math.min( values['mx_min'].max, values['my_min'].max, values['mz_min'].max ),
    };
    // dの最大値の部材番号を探す
    if (values2.max_d === values['fx_max'].max) {
      values2['max_d_m'] = values['fx_max'].max_m;
    } else if (values2.max_d === values['fy_max'].max) {
      values2['max_d_m'] = values['fy_max'].max_m;
    } else if (values2.max_d === values['fz_max'].max) {
      values2['max_d_m'] = values['fz_max'].max_m;
    } 
    // dの最小値の部材番号を探す
    if (values2.max_d === values['fx_max'].max) {
      values2['min_d_m'] = values['fx_max'].max_m;
    } else if (values2.max_d === values['fy_max'].max) {
      values2['min_d_m'] = values['fy_max'].max_m;
    } else if (values2.max_d === values['fz_max'].max) {
      values2['min_d_m'] = values['fz_max'].max_m;
    } 
    // rの最大値の部材番号を探す
    if (values2.max_r === values['mx_max'].max) {
      values2['max_r_m'] = values['mx_max'].max_m;
    } else if (values2.max_r === values['my_max'].max) {
      values2['max_r_m'] = values['my_max'].max_m;
    } else if (values2.max_r === values['mz_max'].max) {
      values2['max_r_m'] = values['mz_max'].max_m;
    }
    // rの最小値の部材番号を探す
    if (values2.max_r === values['mx_max'].max) {
      values2['min_r_m'] = values['mx_max'].max_m;
    } else if (values2.max_r === values['my_max'].max) {
      values2['min_r_m'] = values['my_max'].max_m;
    } else if (values2.max_r === values['mz_max'].max) {
      values2['min_r_m'] = values['mz_max'].max_m;
    }
    value_range[combNo] = values2;
  }

  postMessage({ fsecCombine, max_values, value_range });

});
