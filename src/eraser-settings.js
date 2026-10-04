/* Durable removal masks and patch references. */
function eraserDefaults(){return{radius:2.5,patch:5,surroundings:100,seed:1,mask:[],removals:[]};}
function normalizeEraser(raw){const d=eraserDefaults(),number=(v,lo,hi,def)=>typeof v==='number'&&Number.isFinite(v)?Math.max(lo,Math.min(hi,v)):def;
 for(const [k,lo,hi]of [['radius',.2,20],['patch',2,9],['surroundings',30,180],['seed',1,999999]])d[k]=number(raw?.[k],lo,hi,d[k]);d.patch=Math.round(d.patch);d.seed=Math.round(d.seed);
 const strokes=arr=>(Array.isArray(arr)?arr:[]).slice(0,60).filter(s=>s&&Array.isArray(s.path)).map(s=>({mode:s.mode==='subtract'?'subtract':'paint',radius:number(s.radius,.2,20,2.5),path:s.path.slice(0,1200).filter(p=>Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1])).map(p=>[number(p[0],0,1,.5),number(p[1],0,1,.5)])})).filter(s=>s.path.length);
 d.mask=strokes(raw?.mask);
 if(raw?.removals!==undefined&&!Array.isArray(raw.removals))throw new Error('Invalid Magic Eraser removal list.');
 if(raw?.removals?.length>32)throw new Error('Projects support up to 32 kept removals.');
 d.removals=(raw?.removals||[]).map(r=>{if(!r||!/^asset-[0-9]+$/.test(r.asset)||!['x','y','w','h'].every(k=>Number.isInteger(r[k]))||r.x<0||r.y<0||r.w<1||r.h<1||r.w>6000||r.h>6000)throw new Error('Invalid Magic Eraser patch.');return{asset:r.asset,x:r.x,y:r.y,w:r.w,h:r.h,mask:strokes(r.mask)};});return d;
}
