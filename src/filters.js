/* Independent, deterministic artistic filters. Runs only in the pixel worker. */
function activeFilter(fx,key){return fx[key+'Enabled']!==false&&(fx[key]||0)!==0;}
// Separable scalar filters use O(width * height) work regardless of radius.
function boxPlane(src,w,h,r){
 r=Math.max(1,Math.round(r));const tmp=new Float32Array(src.length),dst=new Float32Array(src.length),n=2*r+1;
 for(let y=0;y<h;y++){const row=y*w;let sum=0;for(let k=-r;k<=r;k++)sum+=src[row+Math.max(0,Math.min(w-1,k))];for(let x=0;x<w;x++){tmp[row+x]=sum/n;sum+=src[row+Math.min(w-1,x+r+1)]-src[row+Math.max(0,x-r)];}}
 for(let x=0;x<w;x++){let sum=0;for(let k=-r;k<=r;k++)sum+=tmp[Math.max(0,Math.min(h-1,k))*w+x];for(let y=0;y<h;y++){dst[y*w+x]=sum/n;sum+=tmp[Math.min(h-1,y+r+1)*w+x]-tmp[Math.max(0,y-r)*w+x];}}return dst;
}
function minPlane(src,w,h,r){
 const tmp=new Float32Array(src.length),dst=new Float32Array(src.length),q=new Int32Array(Math.max(w,h));
 function line(input,output,start,step,n){let head=0,tail=0,next=0;for(let x=0;x<n;x++){while(next<n&&next<=x+r){while(tail>head&&input[start+q[tail-1]*step]>=input[start+next*step])tail--;q[tail++]=next++;}while(tail>head&&q[head]<x-r)head++;output[start+x*step]=input[start+q[head]*step];}}
 for(let y=0;y<h;y++)line(src,tmp,y*w,1,w);for(let x=0;x<w;x++)line(tmp,dst,x,w,h);return dst;
}
function dehazePixels(data,w,h,fx){
 if(!activeFilter(fx,'dehaze'))return data;
 const out=new Uint8ClampedArray(data),amount=fx.dehaze/100;
 if(amount<0){for(let i=0;i<out.length;i+=4)if(data[i+3])for(let c=0;c<3;c++)out[i+c]=data[i+c]*(1+amount*.5)-245*amount*.5;return out;}
 const n=w*h,dark=new Float32Array(n),r=Math.max(1,Math.round(Math.min(w,h)*(.003+fx.dehazeRadius*.0003)));
 for(let j=0;j<n;j++)dark[j]=data[j*4+3]?Math.min(data[j*4],data[j*4+1],data[j*4+2])/255:1;
 const local=minPlane(dark,w,h,r),hist=new Uint32Array(256);let visible=0;
 for(let j=0;j<n;j++)if(data[j*4+3]){hist[Math.min(255,Math.floor(local[j]*255))]++;visible++;}if(!visible)return out;
 let cutoff=255,count=0;for(;cutoff>0;cutoff--){count+=hist[cutoff];if(count>=Math.max(1,visible*.001))break;}
 let best=-1,at=0;for(let j=0;j<n;j++){const i=j*4,l=data[i]+data[i+1]+data[i+2];if(data[i+3]&&Math.floor(local[j]*255)>=cutoff&&l>best){best=l;at=i;}}
 const air=[0,1,2].map(c=>Math.max(.4,data[at+c]/255));
 for(let j=0;j<n;j++){const i=j*4;dark[j]=data[i+3]?Math.min(data[i]/255/air[0],data[i+1]/255/air[1],data[i+2]/255/air[2]):1;}
 const transmission=minPlane(dark,w,h,r);for(let j=0;j<n;j++)transmission[j]=Math.max(.2,1-.9*transmission[j]);
 const smooth=boxPlane(transmission,w,h,Math.max(1,r/2));
 for(let j=0;j<n;j++){const i=j*4;if(!data[i+3])continue;const t=Math.max(.2,smooth[j]);for(let c=0;c<3;c++){const v=data[i+c],recovered=clamp((v-air[c]*255)/t+air[c]*255);out[i+c]=v+(recovered-v)*amount;}}return out;
}
function hashNoise(x,y,seed){let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(seed|0,1442695041);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967295;}
function smoothNoise(x,y,seed){const ix=Math.floor(x),iy=Math.floor(y);let tx=x-ix,ty=y-iy;tx=tx*tx*(3-2*tx);ty=ty*ty*(3-2*ty);const a=hashNoise(ix,iy,seed),b=hashNoise(ix+1,iy,seed),c=hashNoise(ix,iy+1,seed),d=hashNoise(ix+1,iy+1,seed);return a+(b-a)*tx+(c-a)*ty+(a-b-c+d)*tx*ty;}
function filmPixels(out,w,h,fx){
 if(!activeFilter(fx,'film'))return;const mix=fx.film/100,fade=fx.filmFade/100,grain=fx.filmGrain*.55,cell=Math.min(w,h)*(.0005+fx.filmGrainSize*.000025),profile=fx.filmProfile;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(!out[i+3])continue;const r=out[i]/255,g=out[i+1]/255,b=out[i+2]/255,l=.2126*r+.7152*g+.0722*b;
 const noise=(smoothNoise(x/cell,y/cell,821)-.5)*grain*(.55+Math.sin(l*Math.PI)*.45);
 for(let c=0;c<3;c++){let v=out[i+c]/255;if(profile==='silver')v=l;const contrast=profile==='cool'?1.18:profile==='silver'?1.23:profile==='faded'?.88:1.08;
 v=Math.max(0,Math.min(1,(v-.5)*contrast+.5));v=v*.82+(v*v*(3-2*v))*.18;
 if(profile==='warm')v+=(c===0?.038:c===2?-.03:.004)*(1-v*.5);
 if(profile==='cool')v+=(c===2?.035:c===0?-.025:0)*(1-v*.4);
 if(profile==='faded')v=v*.88+[.09,.07,.035][c];
 v=fade*.14+v*(1-fade*.19);out[i+c]+=((v*255+noise)-out[i+c])*mix;}
 }
}
function halationPixels(out,w,h,fx){
 if(!activeFilter(fx,'halation'))return;const mask=new Float32Array(w*h),threshold=fx.halationThreshold/100,r=Math.max(1,Math.min(w,h)*fx.halationRadius/100/1.7);
 for(let j=0;j<mask.length;j++){const i=j*4,l=(out[i]*.2126+out[i+1]*.7152+out[i+2]*.0722)/255;mask[j]=Math.max(0,(l-threshold)/(1-threshold))*out[i+3]/255;}
 const halo=boxPlane(boxPlane(boxPlane(mask,w,h,r),w,h,r),w,h,r),warm=fx.halationWarmth/100,tint=[1,.4-.35*warm,.025],amount=fx.halation/100*2.6;
 for(let j=0;j<mask.length;j++){const i=j*4;if(!out[i+3])continue;const light=Math.max(0,halo[j]-mask[j]) * amount;for(let c=0;c<3;c++)out[i+c]+=(255-out[i+c])*Math.min(1,light*tint[c]);}
}
function channelSample(src,w,h,x,y,c,fallback){
 x=clamp(x,0,w-1);y=clamp(y,0,h-1);const x0=Math.floor(x),y0=Math.floor(y),x1=Math.min(w-1,x0+1),y1=Math.min(h-1,y0+1),tx=x-x0,ty=y-y0;
 const i0=(y0*w+x0)*4,i1=(y0*w+x1)*4,i2=(y1*w+x0)*4,i3=(y1*w+x1)*4;
 const a0=src[i0+3]/255*(1-tx)*(1-ty),a1=src[i1+3]/255*tx*(1-ty),a2=src[i2+3]/255*(1-tx)*ty,a3=src[i3+3]/255*tx*ty,weight=a0+a1+a2+a3;
 return weight>1e-6?(src[i0+c]*a0+src[i1+c]*a1+src[i2+c]*a2+src[i3+c]*a3)/weight:fallback;
}
function aberrationPixels(out,w,h,fx){
 if(!activeFilter(fx,'aberration'))return;const src=new Uint8ClampedArray(out),strength=fx.aberration/100*.02,angle=fx.aberrationAngle*Math.PI/180,cx=fx.aberrationCenterX/100*(w-1),cy=fx.aberrationCenterY/100*(h-1),span=Math.min(w,h)*strength;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(!out[i+3])continue;const dx=fx.aberrationMode==='linear'?Math.cos(angle)*span:(x-cx)*strength,dy=fx.aberrationMode==='linear'?Math.sin(angle)*span:(y-cy)*strength;out[i]=channelSample(src,w,h,x+dx,y+dy,0,src[i]);out[i+2]=channelSample(src,w,h,x-dx,y-dy,2,src[i+2]);}
}
function grungePixels(out,w,h,fx){
 if(!activeFilter(fx,'grunge'))return;const amount=fx.grunge/100,seed=fx.grungeSeed|0,frequency=8+(100-fx.grungeScale)*1.1,short=Math.min(w,h),rough=fx.grungeRoughness/100;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(!out[i+3])continue;const u=x/short,v=y/short,a=smoothNoise(u*frequency,v*frequency,seed),b=smoothNoise(u*frequency*.23,v*frequency*.23,seed+1),stain=(a*.6+b*.4-.5)*100;
 const fine=hashNoise(Math.floor(u*1600),Math.floor(v*1600),seed+2),dust=(fine>.994?65:fine<.006?-60:0)*rough;
 const sx=u*500,scratch=(Math.abs(sx-Math.round(sx))<.13&&hashNoise(Math.round(sx),0,seed+3)>.97&&smoothNoise(u*30,v*45,seed+4)>.4)?rough*48:0;
 for(let c=0;c<3;c++){const old=out[i+c],tone=(old-127.5)*(1+amount*.3)+127.5;out[i+c]=tone+(stain+ dust+scratch)*amount-[0,3,8][c]*amount*(1-b);}
 }
}
