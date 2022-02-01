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


  const jsonData = data.jsonData;
  const reac = {};
  const max_value = {};
  const value_range = {};
  let error: any = null;

  try {
    for (const caseNo of Object.keys(jsonData)) {
      const target = new Array();
      const caseData: {} = jsonData[caseNo];

      // 存在チェック
      if (typeof (caseData) !== 'object') {
        continue;
      }
      if (!('reac' in caseData)) {
        continue;
      }
      const json: {} = caseData['reac'];
      if (json === null) {
        continue;
      }

      let max_d = 0;
      let max_r = 0;
      let values = {max_d: -65535, max_r: -65535,
                    min_d:  65535, min_r:  65535,
                    max_d_m: '0' , max_r_m: '0' ,
                    min_d_m: '0' , min_r_m: '0' , }

      for (const n of Object.keys(json)) {
        const item: {} = json[n];

        let tx: number = toNumber(item['tx']);
        let ty: number = toNumber(item['ty']);
        let tz: number = toNumber(item['tz']);
        let mx: number = toNumber(item['mx']);
        let my: number = toNumber(item['my']);
        let mz: number = toNumber(item['mz']);

        const result = {
          id: n.replace('node', ''),
          tx: (tx == null) ? 0 : -tx,
          ty: (ty == null) ? 0 : -ty,
          tz: (tz == null) ? 0 : -tz,
          mx: (mx == null) ? 0 : mx,
          my: (my == null) ? 0 : my,
          mz: (mz == null) ? 0 : -mz
        };
        target.push(result);
            
        // 最大値を記録する three.js で使う
        for (const v of [tx, ty, tz]) {
          if (Math.abs(max_d) < Math.abs(v)) {
            max_d = v;
          }
          if (values.max_d < v) {
            values.max_d = v;
            values.max_d_m = n;
          }
          if (values.min_d > v) {
            values.min_d = v;
            values.min_d_m = n;
          }
        }
        for (const v of [mx, my, mz]) {
          if (Math.abs(max_r) < Math.abs(v)) {
            max_r = v;
          }
          if (values.max_r < v) {
            values.max_r = v;
            values.max_r_m = n;
          }
          if (values.min_r > v) {
            values.min_r = v;
            values.min_r_m = n;
          }
        }

      }
      const No: string = caseNo.replace("Case", "");
      reac[No] = target;
      max_value[No] = Math.abs(max_d);
      value_range[No] = values;
    }
  } catch (e) {
    error = e;
  }

  postMessage({ reac, error, max_value, value_range });
});
