addEventListener("message",({data:b})=>{const y=b.reacCombine,d=b.pickList,x={};for(const _ of Object.keys(d)){const f=d[_];let c=null;for(const r of f){const i=JSON.parse(JSON.stringify({temp:y[r]})).temp;if(null!=c)for(const e of Object.keys(i)){const t=e.split("_"),s=i[e],n=c[e];for(const m of Object.keys(n)){const o=n[m];if(!(m in s))continue;const a=s[m];"max"===t[1]?a[t[0]]>o[t[0]]&&(c[e][m]=i[e][m]):a[t[0]]<o[t[0]]&&(c[e][m]=i[e][m])}}else c=i}null!==c&&(x[_]=c)}const k={};for(const _ of Object.keys(x)){const f=x[_];if(null==f||null==f){console.log("CseData"+_+"\u304c\u306a\u3044");continue}const c=Object.keys(f),r={},i={};for(const t of c){const s=f[t];let n,m=!1;t.includes("tx")?(n="tx",m=!0):t.includes("ty")?(n="ty",m=!0):t.includes("tz")?(n="tz",m=!0):t.includes("mx")?n="mx":t.includes("my")?n="my":t.includes("mz")&&(n="mz");let o=t.includes("max")?Number.MIN_VALUE:Number.MAX_VALUE,a="0";if(t.includes("max"))for(const l of Object.keys(s)){const u=s[l][n];u>=o&&(o=u,a=l)}else for(const l of Object.keys(s)){const u=s[l][n];u<=o&&(o=u,a=l)}Math.abs(o)!==Number.MAX_VALUE&&(m?r[t]={max:o,max_m:a}:i[t]={max:o,max_m:a})}if(0===Object.keys(r).length)continue;const e={max_d:Number.MIN_VALUE,max_d_m:0,min_d:Number.MAX_VALUE,min_d_m:0,max_r:Number.MIN_VALUE,max_r_m:0,min_r:Number.MAX_VALUE,min_r_m:0};for(const t of Object.keys(r)){const s=r[t];s.max>e.max_d?(e.max_d=s.max,e.max_d_m=s.max_m):s.max<e.min_d&&(e.min_d=s.max,e.min_d_m=s.max_m)}for(const t of Object.keys(i)){const s=i[t];s.max>e.max_r?(e.max_r=s.max,e.max_r_m=s.max_m):s.max<e.min_r&&(e.min_r=s.max,e.min_r_m=s.max_m)}k[_]=e}postMessage({reacPickup:x,value_range:k})});