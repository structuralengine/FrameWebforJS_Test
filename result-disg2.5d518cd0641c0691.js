addEventListener("message",({data:s})=>{const d=s.disg,n={};let r=null;try{for(const o of Object.keys(d)){if(o.includes("max_value"))continue;const l=d[o],e=new Array;for(const t of l){const c=null===t.dx?0:Math.round(1e4*t.dx)/1e4,u=null===t.dy?0:Math.round(1e4*t.dy)/1e4,a=null===t.dz?0:Math.round(1e4*t.dz)/1e4,x=null===t.rx?0:Math.round(1e4*t.rx)/1e4,i=null===t.ry?0:Math.round(1e4*t.ry)/1e4,y=null===t.rz?0:Math.round(1e4*t.rz)/1e4;e.push({id:t.id,dx:c.toFixed(4),dy:u.toFixed(4),dz:a.toFixed(4),rx:x.toFixed(4),ry:i.toFixed(4),rz:y.toFixed(4)})}n[o]=e}}catch(o){r=o}postMessage({table:n,error:r})});