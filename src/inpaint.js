/* PHOTOBENCH v1.4 — independent exemplar-based local inpainting. GPL-3.0-only.
   Only original, unmasked, opaque patches may supply replacement pixels.
   The source-offset field allows native-resolution reconstruction after analysis. */
function inpaintObject(input,mask,w,h,options={},progress=()=>{}){
 const n=w*h,out=new Uint8ClampedArray(input),hole=new Uint8Array(n),confidence=new Float32Array(n),dx=new Int16Array(n),dy=new Int16Array(n),shift=new Float32Array(n*3);
 let remaining=0;for(let i=0;i<n;i++){hole[i]=mask[i]&&input[i*4+3]>0?1:0;remaining+=hole[i];confidence[i]=hole[i]?0:1;}
 const total=remaining;if(!total)throw new Error('Paint over the object first. Transparent pixels alone cannot be filled.');
 if(total>=n*.8)throw new Error('Leave more unpainted surroundings for the fill. Remove a smaller area at a time.');
 let seed=(options.seed||1)>>>0;const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;};
 let radius=Math.max(2,Math.min(9,Math.round(options.patch||5))),valid=[];const stride=w+1,integral=new Int32Array((w+1)*(h+1));
 for(let y=0;y<h;y++){let row=0;for(let x=0;x<w;x++){const i=y*w+x;row+=(hole[i]||input[i*4+3]<250)?1:0;integral[(y+1)*stride+x+1]=integral[y*stride+x+1]+row;}}
 const area=(x0,y0,x1,y1)=>integral[(y1+1)*stride+x1+1]-integral[y0*stride+x1+1]-integral[(y1+1)*stride+x0]+integral[y0*stride+x0];
 for(;radius>=1;radius--){valid=[];for(let y=radius;y<h-radius;y++)for(let x=radius;x<w-radius;x++)if(!area(x-radius,y-radius,x+radius,y+radius))valid.push(y*w+x);if(valid.length>=8)break;}
 if(!valid.length||radius<1)throw new Error('There is not enough clean surrounding texture. Paint a smaller area or increase Surroundings.');
 const validMap=new Uint8Array(n);for(const i of valid)validMap[i]=1;
 const front=new Set(),known=(x,y)=>x>=0&&x<w&&y>=0&&y<h&&!hole[y*w+x]&&input[(y*w+x)*4+3]>0;
 function update(i){if(i<0||i>=n)return;if(!hole[i]){front.delete(i);return;}const x=i%w,y=(i/w)|0;if(known(x-1,y)||known(x+1,y)||known(x,y-1)||known(x,y+1))front.add(i);}
 for(let i=0;i<n;i++)if(hole[i])update(i);
 const lum=i=>out[i*4]*.2126+out[i*4+1]*.7152+out[i*4+2]*.0722;
 function priority(i){const x=i%w,y=(i/w)|0;let c=0,count=0,bestGrad=0;for(let oy=-radius;oy<=radius;oy+=2)for(let ox=-radius;ox<=radius;ox+=2){const xx=x+ox,yy=y+oy;if(xx<0||yy<0||xx>=w||yy>=h)continue;const j=yy*w+xx;count++;c+=confidence[j];if(known(xx-1,yy)&&known(xx+1,yy)&&known(xx,yy-1)&&known(xx,yy+1))bestGrad=Math.max(bestGrad,Math.abs(lum(j+1)-lum(j-1))+Math.abs(lum(j+w)-lum(j-w)));}return c/Math.max(1,count)*(.12+bestGrad/255);}
 let iterations=0,lastProgress=-1;const offsets=[],values=[],weights=[],diag=w*w+h*h;
 while(remaining){
  let target=-1,bestPriority=-1,k=0;const step=Math.max(1,Math.floor(front.size/72)),phase=iterations%step;
  for(const i of front){if(k++%step!==phase)continue;const score=priority(i);if(score>bestPriority){bestPriority=score;target=i;}}
  if(target<0)target=front.values().next().value;
  if(target===undefined)throw new Error('This selection has no usable boundary. Reduce the mask and try again.');
  const tx=target%w,ty=(target/w)|0;offsets.length=values.length=weights.length=0;let confidenceSum=0,patchCount=0;
  for(let oy=-radius;oy<=radius;oy++)for(let ox=-radius;ox<=radius;ox++){const x=tx+ox,y=ty+oy;if(x<0||y<0||x>=w||y>=h)continue;const j=y*w+x;patchCount++;confidenceSum+=confidence[j];if(!hole[j]&&input[j*4+3]>0&&((ox+radius)%2===0&&(oy+radius)%2===0||Math.abs(ox)+Math.abs(oy)<=1)){offsets.push(oy*w+ox);values.push(out[j*4],out[j*4+1],out[j*4+2]);weights.push(Math.max(.15,confidence[j]));}}
  if(!offsets.length){for(const [ox,oy]of [[-1,0],[1,0],[0,-1],[0,1]])if(known(tx+ox,ty+oy)){const j=(ty+oy)*w+tx+ox;offsets.push(oy*w+ox);values.push(out[j*4],out[j*4+1],out[j*4+2]);weights.push(1);}}
  const weightSum=weights.reduce((a,b)=>a+b,0);let best=Infinity,source=-1;
  function consider(j){if(j<0||j>=n||!validMap[j])return;let score=0;const x=j%w,y=(j/w)|0;for(let s=0;s<offsets.length;s++){const p=(j+offsets[s])*4,t=s*3,dr=input[p]-values[t],dg=input[p+1]-values[t+1],db=input[p+2]-values[t+2];score+=(dr*dr+dg*dg+db*db)*weights[s];if(score>best*weightSum)return;}score=score/weightSum+((x-tx)**2+(y-ty)**2)/diag*12;if(score<best){best=score;source=j;}}
  // Spatially coherent proposals, followed by a reproducible global search.
  for(let oy=-radius-1;oy<=radius+1;oy++)for(let ox=-radius-1;ox<=radius+1;ox++){if(Math.abs(ox)!==radius+1&&Math.abs(oy)!==radius+1)continue;const x=tx+ox,y=ty+oy;if(x<0||y<0||x>=w||y>=h)continue;const j=y*w+x;if(!hole[j]&&(dx[j]||dy[j]))consider((ty+dy[j])*w+tx+dx[j]);}
  for(let distance=radius*2+1;distance<Math.max(w,h);distance=Math.ceil(distance*1.6))for(let a=0;a<16;a++){const angle=a*Math.PI/8,x=Math.round(tx+Math.cos(angle)*distance),y=Math.round(ty+Math.sin(angle)*distance);if(x>=radius&&y>=radius&&x<w-radius&&y<h-radius)consider(y*w+x);}
  const trials=Math.min(valid.length,640);for(let i=0;i<trials;i++)consider(valid[Math.floor(random()*valid.length)]);
  if(source<0)source=valid[0];
  let refine=4;while(refine>=1){const origin=source;for(let oy=-refine;oy<=refine;oy+=refine)for(let ox=-refine;ox<=refine;ox+=refine)consider(origin+oy*w+ox);refine=Math.floor(refine/2);}
  const sx=source%w,sy=(source/w)|0,correction=[0,0,0];
  for(let s=0;s<offsets.length;s++)for(let c=0;c<3;c++)correction[c]+=(values[s*3+c]-input[(source+offsets[s])*4+c])*weights[s]/weightSum;
  for(let c=0;c<3;c++)correction[c]=Math.max(-18,Math.min(18,correction[c]));
  const filled=[],newConfidence=Math.max(.12,confidenceSum/Math.max(1,patchCount));
  for(let oy=-radius;oy<=radius;oy++)for(let ox=-radius;ox<=radius;ox++){const x=tx+ox,y=ty+oy;if(x<0||y<0||x>=w||y>=h)continue;const i=y*w+x;if(!hole[i])continue;const donor=(sy+oy)*w+sx+ox;for(let c=0;c<3;c++){out[i*4+c]=input[donor*4+c]+correction[c];shift[i*3+c]=correction[c];}dx[i]=sx-tx;dy[i]=sy-ty;hole[i]=0;confidence[i]=newConfidence;remaining--;filled.push(i);front.delete(i);}
  for(const i of filled){const x=i%w;if(x)update(i-1);if(x<w-1)update(i+1);update(i-w);update(i+w);}
  if(++iterations>total+1)throw new Error('The fill could not converge. Try a smaller selection.');const percent=Math.floor((total-remaining)/total*100);if(percent!==lastProgress&&iterations%8===0){progress(percent);lastProgress=percent;}
 }
 progress(100);return{pixels:out,dx,dy,shift,filled:total,iterations};
}
