/* Shared by the image worker and mask preview. Source-normalized coordinates. */
function coverageMask(stroke,w,h){
 const mask=new Float32Array(w*h),radius=stroke.radius/100*w,power=stroke.feather===undefined?1.5:.2+stroke.feather/30;
 for(const p of stroke.path){const r=Math.max(.2,radius*(p[2]??1)),cx=p[0]*w,cy=p[1]*h;
  const x0=Math.max(0,Math.floor(cx-r)),x1=Math.min(w,Math.ceil(cx+r)),y0=Math.max(0,Math.floor(cy-r)),y1=Math.min(h,Math.ceil(cy+r));
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const d=Math.hypot(x-cx,y-cy)/r;if(d<1)mask[y*w+x]=Math.max(mask[y*w+x],Math.pow(1-d,power));}
 }
 for(const erase of stroke.erasers||[]){const e=coverageMask({...erase,erasers:[],feather:35},w,h);for(let i=0;i<mask.length;i++)mask[i]*=1-e[i];}
 return mask;
}
