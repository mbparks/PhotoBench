/* Curve interpolation shared between the graph and the pixel renderer. */
function curveNine(values){if(!Array.isArray(values)||![5,9].includes(values.length))return Array.from({length:9},(_,i)=>i*12.5);if(values.length===9)return values.slice();return Array.from({length:9},(_,i)=>i%2?(values[(i-1)/2]+values[(i+1)/2])/2:values[i/2]);}
function curveValue(points,x,mode='linear'){
 const n=points.length-1,pos=Math.max(0,Math.min(1,x))*n,k=Math.min(n-1,Math.floor(pos)),t=pos-k;
 if(mode!=='smooth')return points[k]+(points[k+1]-points[k])*t;
 const slopes=points.slice(1).map((v,i)=>v-points[i]),tangent=i=>{if(i===0)return slopes[0];if(i===n)return slopes[n-1];return slopes[i-1]*slopes[i]>0?2*slopes[i-1]*slopes[i]/(slopes[i-1]+slopes[i]):0;};
 const a=points[k],b=points[k+1],t2=t*t,t3=t2*t;return(2*t3-3*t2+1)*a+(t3-2*t2+t)*tangent(k)+(-2*t3+3*t2)*b+(t3-t2)*tangent(k+1);
}
function rgbToHsl(r,g,b){r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min,l=(max+min)/2;let h=0,s=0;if(d){s=d/(1-Math.abs(2*l-1));h=max===r?((g-b)/d)%6:max===g?(b-r)/d+2:(r-g)/d+4;h=(h*60+360)%360;}return[h,s,l];}
function hslToRgb(h,s,l){const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;let v=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return v.map(t=>(t+m)*255);}
const colorBands=[['red','Red',0],['orange','Orange',30],['yellow','Yellow',60],['green','Green',120],['aqua','Aqua',180],['blue','Blue',240],['purple','Purple',280],['magenta','Magenta',320]];
