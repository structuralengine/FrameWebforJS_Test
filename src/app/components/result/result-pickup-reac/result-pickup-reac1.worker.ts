/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {

  const reacCombine = data.reacCombine;
  const pickList = data.pickList;
  const reacPickup = {};

  // pickupのループ
  for (const pickNo of Object.keys(pickList)) {
    const combines: any[] = pickList[pickNo];
    let tmp: {} = null;
    for (const combNo of combines) {
      const com = JSON.parse(
        JSON.stringify({
          temp: reacCombine[combNo]
        })
      ).temp;      
      if (tmp == null) {
        tmp = com;
        continue;
      }
      for (const k of Object.keys(com)) {
        const key = k.split('_');
        const target = com[k];
        const comparison = tmp[k];
        for (const id of Object.keys(comparison)) {
          const a = comparison[id];
          if (!(id in target)) {
            continue;
          }
          const b = target[id];
          if (key[1] === 'max') {
            if (b[key[0]] > a[key[0]]) {
              tmp[k][id] = com[k][id];
            }
          } else {
            if (b[key[0]] < a[key[0]]) {
              tmp[k][id] = com[k][id];
            }
          }
        }
      }
    }
    if (tmp !== null) {
      reacPickup[pickNo] = tmp;
    }
  }
  
  const value_range = {};
  // CombineNoごとの最大最小を探す
  for (const combNo of Object.keys(reacPickup)) {
    const caseData = reacPickup[combNo];
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

  postMessage({ reacPickup, value_range });
});
