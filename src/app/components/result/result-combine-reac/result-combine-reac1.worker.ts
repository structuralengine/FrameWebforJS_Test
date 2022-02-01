/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {
  const defList = data.defList;
  const combList = data.combList;
  const reac = data.reac;
  const reacKeys = data.reacKeys;
  
  // defineのループ
  const reacDefine = {};
  for(const defNo of Object.keys(defList)) {
    const temp = {};
    //
    for(const caseInfo of defList[defNo]) {
      let baseNo: string = '';
      if(typeof caseInfo === "number"){
        baseNo = Math.abs(caseInfo).toString();
      } else {
        baseNo = caseInfo;
      }
      const coef: number = Math.sign(caseInfo);

      if (!(baseNo in reac)) {
        if(caseInfo === 0 ){
          // 値が全て0 の case 0 という架空のケースを用意する
          // 値は coef=0 であるため 0 となる
          reac['0'] = Object.values(reac)[0];
        } else {
          continue;
        }
      }

      // カレントケースを集計する
      for (const key of reacKeys) {
        // 節点番号のループ
        const obj = {};
        for (const d of reac[baseNo]) {
          obj[d.id] = {
            tx: coef * d.tx,
            ty: coef * d.ty,
            tz: coef * d.tz,
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
          for (const nodeNo of Object.keys(temp[key])) {
            if(k2==='max'){
              if(temp[key][nodeNo][k1] < obj[nodeNo][k1]){
                temp[key][nodeNo] = obj[nodeNo];
              }
            } else if (k2==='min'){
              if(temp[key][nodeNo][k1] > obj[nodeNo][k1]){
                temp[key][nodeNo] = obj[nodeNo];
              }
            }
          }

        } else {
          temp[key] = obj;
        }
      }
    }
    reacDefine[defNo] = temp;
  }


  // combineのループ
  const reacCombine = {};
  for (const combNo of Object.keys(combList)) {
    const temp = {};
    //
    for (const caseInfo of combList[combNo]) {
      const caseNo = Number(caseInfo.caseNo);
      const defNo: string = caseInfo.caseNo.toString();
      const coef: number = caseInfo.coef;

      if (!(defNo in reacDefine)) {
        continue;
      }
      if (coef === 0) {
        continue;
      }

      const reacs = reacDefine[defNo];
      if(Object.keys(reacs).length < 1) continue;

      // カレントケースを集計する
      const c2 = Math.abs(caseNo).toString().trim();
      for (const key of reacKeys){
        // 節点番号のループ
        const obj = {};
        for (const nodeNo of Object.keys(reacs[key])) {
          const d = reacs[key][nodeNo];
          const c1 = Math.sign(coef) < 0 ? -1 : 1 * d.case;
          let caseStr = '';
          if (c1 !== 0){
            caseStr = (c1 < 0 ? "-" : "+") + c2;
          }
          obj[nodeNo] = {
            tx: coef * d.tx,
            ty: coef * d.ty,
            tz: coef * d.tz,
            mx: coef * d.mx,
            my: coef * d.my,
            mz: coef * d.mz,
            case: caseStr
          };
        }

        if (key in temp) {
          for (const nodeNo of Object.keys(reacs[key])) {
            if(!(nodeNo in temp[key])){
              temp[key][nodeNo] = { tx: 0, ty: 0, tz: 0,
                mx: 0, my: 0, mz: 0, case: '' };
            }
            for(const k of Object.keys(obj[nodeNo])){
              temp[key][nodeNo][k] += obj[nodeNo][k];
            }
            temp[key][nodeNo]['comb']= combNo;
          }
        } else {
          for (const nodeNo of Object.keys(obj)) {
            obj[nodeNo]['comb']= combNo;
          }
          temp[key] = obj;
        }
      }
    }
    reacCombine[combNo] = temp;
  }
  
  const value_range = {};
  // CombineNoごとの最大最小を探す
  for (const combNo of Object.keys(reacCombine)) {
    const caseData = reacCombine[combNo];
    const key_list = Object.keys(caseData);
    const values = {};
    // dx～rzの最大最小をそれぞれ探す
    for (const key of key_list) {
      const datas = caseData[key];
      let key2: string;
      if (key.includes('tx')) {
        key2 = 'tx';
      } else if (key.includes('ty')) {
        key2 = 'ty';
      } else if (key.includes('tz')) {
        key2 = 'tz';
      } else if (key.includes('mx')) {
        key2 = 'mx';
      } else if (key.includes('my')) {
        key2 = 'my';
      } else if (key.includes('mz')) {
        key2 = 'mz';
      }
      let targetValue = (key.includes('max')) ? -65535 : 65535;
      let targetValue_m = '0';
      if (key.includes('max')) { // 最大値の判定
        for (const row of Object.keys(datas)) {
          const data = datas[row][key2];
          if (data >= targetValue) {
            targetValue = data;
            targetValue_m = row;
          }
        }
      } else {  // 最小値の判定
        for (const row of Object.keys(datas)) {
          const data = datas[row][key2];
          if (data <= targetValue) {
            targetValue = data;
            targetValue_m = row;
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
      max_d : Math.max( values['tx_max'].max, values['ty_max'].max, values['tz_max'].max ),
      min_d : Math.min( values['tx_min'].max, values['ty_min'].max, values['tz_min'].max ),
      max_r : Math.max( values['mx_max'].max, values['my_max'].max, values['mz_max'].max ),
      min_r : Math.min( values['mx_min'].max, values['my_min'].max, values['mz_min'].max ),
    };
    // dの最大値の部材番号を探す
    if (values2.max_d === values['tx_max'].max) {
      values2['max_d_m'] = values['tx_max'].max_m;
    } else if (values2.max_d === values['ty_max'].max) {
      values2['max_d_m'] = values['ty_max'].max_m;
    } else if (values2.max_d === values['tz_max'].max) {
      values2['max_d_m'] = values['tz_max'].max_m;
    } 
    // dの最小値の部材番号を探す
    if (values2.max_d === values['tx_max'].max) {
      values2['min_d_m'] = values['tx_max'].max_m;
    } else if (values2.max_d === values['ty_max'].max) {
      values2['min_d_m'] = values['ty_max'].max_m;
    } else if (values2.max_d === values['tz_max'].max) {
      values2['min_d_m'] = values['tz_max'].max_m;
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

  postMessage({ reacCombine, value_range });
});

