/// <reference lib="webworker" />

addEventListener('message', ({ data }) => {

  const pickList = data.pickList;
  const disgCombine = data.disgCombine;
  const disgPickup = {};

  // pickupのループ
  for (const pickNo of Object.keys(pickList)) {
    const combines: any[] = pickList[pickNo];
    let tmp: {} = null;
    for (const combNo of combines) {
      const com = JSON.parse(
        JSON.stringify({
          temp: disgCombine[combNo]
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
      disgPickup[pickNo] = tmp;
    }
  }

  const value_range = {};
  // CombineNoごとの最大最小を探す
  for (const combNo of Object.keys(disgPickup)) {
    const caseData = disgPickup[combNo];
    const key_list = Object.keys(caseData);
    const values = {};
    // dx～rzの最大最小をそれぞれ探す
    for (const key of key_list) {
      const datas = caseData[key];
      let key2: string;
      if (key.includes('dx')) {
        key2 = 'dx';
      } else if (key.includes('dy')) {
        key2 = 'dy';
      } else if (key.includes('dz')) {
        key2 = 'dz';
      } else if (key.includes('rx')) {
        key2 = 'rx';
      } else if (key.includes('ry')) {
        key2 = 'ry';
      } else if (key.includes('rz')) {
        key2 = 'rz';
      }
      let targetValue = (key.includes('max')) ? -65535 : 65535;
      let targetValue_m = '0';
      if (key.includes('max')) {
        for (const row of Object.keys(datas)) {
          const data = datas[row][key2];
          if (data >= targetValue) {
            targetValue = data;
            targetValue_m = row;
          }
        }
      } else {
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
      max_d : Math.max( values['dx_max'].max, values['dy_max'].max, values['dz_max'].max ),
      min_d : Math.min( values['dx_min'].max, values['dy_min'].max, values['dz_min'].max ),
      max_r : Math.max( values['rx_max'].max, values['ry_max'].max, values['rz_max'].max ),
      min_r : Math.min( values['rx_min'].max, values['ry_min'].max, values['rz_min'].max ),
    };
    // dの最大値の部材番号を探す
    if (values2.max_d === values['dx_max'].max) {
      values2['max_d_m'] = values['dx_max'].max_m;
    } else if (values2.max_d === values['dy_max'].max) {
      values2['max_d_m'] = values['dy_max'].max_m;
    } else if (values2.max_d === values['dz_max'].max) {
      values2['max_d_m'] = values['dz_max'].max_m;
    } 
    // dの最小値の部材番号を探す
    if (values2.max_d === values['dx_max'].max) {
      values2['min_d_m'] = values['dx_max'].max_m;
    } else if (values2.max_d === values['dy_max'].max) {
      values2['min_d_m'] = values['dy_max'].max_m;
    } else if (values2.max_d === values['dz_max'].max) {
      values2['min_d_m'] = values['dz_max'].max_m;
    } 
    // rの最大値の部材番号を探す
    if (values2.max_r === values['rx_max'].max) {
      values2['max_r_m'] = values['rx_max'].max_m;
    } else if (values2.max_r === values['ry_max'].max) {
      values2['max_r_m'] = values['ry_max'].max_m;
    } else if (values2.max_r === values['rz_max'].max) {
      values2['max_r_m'] = values['rz_max'].max_m;
    }
    // rの最小値の部材番号を探す
    if (values2.max_r === values['rx_max'].max) {
      values2['min_r_m'] = values['rx_max'].max_m;
    } else if (values2.max_r === values['ry_max'].max) {
      values2['min_r_m'] = values['ry_max'].max_m;
    } else if (values2.max_r === values['rz_max'].max) {
      values2['min_r_m'] = values['rz_max'].max_m;
    }
    value_range[combNo] = values2;
  }

  postMessage({ disgPickup, value_range });
});
