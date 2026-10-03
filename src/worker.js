/* PHOTOBENCH v1.3.0 — GPL-3.0-only. Pure, deterministic pixel renderer. */
function clamp(x,lo=0,hi=255){return Math.max(lo,Math.min(hi,x));}
function blur(src,w,h,r){
  r=Math.max(1,Math.round(r));const tmp=new Float32Array(src.length),out=new Uint8ClampedArray(src.length),n=2*r+1;
  for(let y=0;y<h;y++)for(let c=0;c<3;c++){
    let sum=0;for(let j=-r;j<=r;j++)sum+=src[(y*w+clamp(j,0,w-1))*4+c];
    for(let x=0;x<w;x++){tmp[(y*w+x)*4+c]=sum/n;sum+=src[(y*w+Math.min(w-1,x+r+1))*4+c]-src[(y*w+Math.max(0,x-r))*4+c];}
  }
  for(let x=0;x<w;x++)for(let c=0;c<3;c++){
    let sum=0;for(let j=-r;j<=r;j++)sum+=tmp[(clamp(j,0,h-1)*w+x)*4+c];
    for(let y=0;y<h;y++){out[(y*w+x)*4+c]=sum/n;sum+=tmp[(Math.min(h-1,y+r+1)*w+x)*4+c]-tmp[(Math.max(0,y-r)*w+x)*4+c];}
  }
  for(let i=3;i<src.length;i+=4)out[i]=src[i];return out;
}
function lut(points,mode){const a=new Float32Array(256);for(let i=0;i<256;i++)a[i]=curveValue(points,i/255,mode)*2.55;return a;}
function processPixels(data,w,h,s){
  data=dehazePixels(data,w,h,s.effects);
  const a=s.adjust,fx=s.effects,out=new Uint8ClampedArray(data),curve=Object.fromEntries(Object.entries(s.curves).map(([k,v])=>[k,lut(v,s.curveInterpolation)]));
  const activeBands=colorBands.filter(([k])=>s.hsl?.[k]&&Object.values(s.hsl[k]).some(v=>v!==0));
  const exposure=Math.pow(2,a.exposure),contrast=Math.pow(2,a.contrast/65),sat=1+a.saturation/100;
  for(let i=0;i<out.length;i+=4){
    let r=data[i]*exposure,g=data[i+1]*exposure,b=data[i+2]*exposure;
    const l=clamp((.2126*r+.7152*g+.0722*b)/255,0,1),shadow=Math.pow(1-l,3),high=Math.pow(l,3);
    const lift=a.brightness*.7+a.shadows*.9*shadow+a.highlights*.9*high+a.blacks*.7*Math.pow(1-l,6)+a.whites*.7*Math.pow(l,6);
    r=(r+lift-127.5)*contrast+127.5+a.warmth*.7+a.tint*.3;
    g=(g+lift-127.5)*contrast+127.5-a.tint*.5;
    b=(b+lift-127.5)*contrast+127.5-a.warmth*.7+a.tint*.3;
    let gray=.2126*r+.7152*g+.0722*b;const chroma=(Math.max(r,g,b)-Math.min(r,g,b))/255;
    const saturation=sat*(1+a.vibrance/100*(1-clamp(chroma,0,1)));
    r=gray+(r-gray)*saturation;g=gray+(g-gray)*saturation;b=gray+(b-gray)*saturation;
    r=curve.r[Math.round(clamp(curve.rgb[Math.round(clamp(r))]))];
    g=curve.g[Math.round(clamp(curve.rgb[Math.round(clamp(g))]))];
    b=curve.b[Math.round(clamp(curve.rgb[Math.round(clamp(b))]))];
    if(activeBands.length){let [hue,ss,ll]=rgbToHsl(clamp(r),clamp(g),clamp(b));let dh=0,ds=0,dl=0;for(const [key,,center]of activeBands){const dist=Math.min(Math.abs(hue-center),360-Math.abs(hue-center)),weight=Math.max(0,1-dist/45)*Math.min(1,ss*3),v=s.hsl[key];dh+=v.hue*weight;ds+=v.saturation/100*weight;dl+=v.lightness/100*.4*weight;}[r,g,b]=hslToRgb((hue+dh+360)%360,clamp(ss*(1+ds),0,1),clamp(ll+dl,0,1));}
    const x=(i/4)%w,y=Math.floor(i/4/w);
    for(const p of s.points){
      const dist=Math.hypot(x/w-p.x,(y/h-p.y)*h/w),rad=p.radius/100;
      if(dist>=rad)continue;
      const weight=Math.pow(1-dist/rad,Math.max(.2,p.feather/30));
      const e=Math.pow(2,p.exposure*weight),ss=1+p.saturation/100*weight;
      r*=e;g*=e;b*=e;gray=.2126*r+.7152*g+.0722*b;
      r=gray+(r-gray)*ss+p.warmth*.7*weight;b=gray+(b-gray)*ss-p.warmth*.7*weight;g=gray+(g-gray)*ss;
    }
    out[i]=r;out[i+1]=g;out[i+2]=b;
  }
  // Soft brush strokes are accumulated in masks, avoiding dark joins and density changes.
  for(const stroke of s.brushes){
    if(stroke.enabled===false)continue;const mask=coverageMask(stroke,w,h);
    for(let j=0;j<mask.length;j++){if(!mask[j])continue;const i=j*4,m=mask[j],v=stroke.value;
      if(stroke.kind==='exposure'){const f=Math.pow(2,v*m);out[i]*=f;out[i+1]*=f;out[i+2]*=f;}
      else if(stroke.kind==='warmth'){out[i]+=v*.7*m;out[i+2]-=v*.7*m;}
      else {const gray=.2126*out[i]+.7152*out[i+1]+.0722*out[i+2],f=1+v/100*m;for(let c=0;c<3;c++)out[i+c]=gray+(out[i+c]-gray)*f;}
    }
  }
  if(a.sharpen||a.structure){const fine=a.sharpen?blur(out,w,h,Math.max(1,w/900)):null,wide=a.structure?blur(out,w,h,Math.max(2,w/100)):null;
    for(let i=0;i<out.length;i+=4)for(let c=0;c<3;c++)out[i+c]=out[i+c]+(fine?(out[i+c]-fine[i+c])*a.sharpen/45:0)+(wide?(out[i+c]-wide[i+c])*a.structure/90:0);
  }
  filmPixels(out,w,h,fx);
  const softened=(fx.blur||fx.glow)?blur(out,w,h,Math.max(1,fx.blur*w/5000+fx.glow*w/15000)):null;
  for(let i=0;i<out.length;i+=4){
    const x=(i/4)%w,y=Math.floor(i/4/w),nx=x/w,ny=y/h;
    const d=Math.hypot(nx-fx.focusX,(ny-fx.focusY)*h/w),focus=fx.focusRadius/100;
    const blend=clamp((d-focus)/Math.max(.02,focus*.8),0,1)*fx.blur/100;
    const vig=clamp(Math.pow(Math.hypot((nx-.5)*1.414,(ny-.5)*1.414),2),0,1)*fx.vignette/100;
    // Position-derived grain remains stable between rerenders.
    const hash=Math.sin((Math.floor(nx*6000)+1)*12.9898+(Math.floor(ny*6000)+1)*78.233)*43758.5453;
    const grain=((hash-Math.floor(hash))-.5)*fx.grain*.75;
    for(let c=0;c<3;c++){let v=out[i+c];if(softened){v=v*(1-blend)+softened[i+c]*blend;v+=((255-(255-v)*(255-softened[i+c])/255)-v)*fx.glow/150;}out[i+c]=v*(1-vig)+grain;}
  }
  halationPixels(out,w,h,fx);
  aberrationPixels(out,w,h,fx);
  grungePixels(out,w,h,fx);
  return out;
}
self.onmessage=e=>{const {id,pixels,w,h,state}=e.data;try{const out=processPixels(new Uint8ClampedArray(pixels),w,h,state);self.postMessage({id,pixels:out.buffer},[out.buffer]);}catch(error){self.postMessage({id,error:error.message});}};
