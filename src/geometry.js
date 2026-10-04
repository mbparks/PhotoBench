/* Projective geometry, canvas expansion, and inverse coordinate mapping. */
const editGroups=['adjust','curves','hsl','geometry','points','brushes','clones','eraser','effects','text','frame','blend'];
function effectiveSettings(s){const out=copy(s),d=defaults();for(const k of editGroups)if(s.enabled?.[k]===false)out[k]=copy(d[k]);return out;}
function projection(g){const ph=g.perspectiveH/100*.45,pv=g.perspectiveV/100*.45;
 const raw=(u,v)=>{const den=1+ph*u+pv*v;return[u/den,v/den];};
 const corners=[raw(-1,-1),raw(1,-1),raw(1,1),raw(-1,1)],xs=corners.map(p=>p[0]),ys=corners.map(p=>p[1]),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
 return{forward(x,y){const p=raw(x*2-1,y*2-1);return[(p[0]-left)/(right-left),(p[1]-top)/(bottom-top)];},inverse(x,y){const u=left+x*(right-left),v=top+y*(bottom-top),den=1-ph*u-pv*v;return[(u/den+1)/2,(v/den+1)/2];},active:!!(ph||pv)};
}
function warpPerspective(input,g,maskOnly=false){const p=projection(g);if(!p.active)return input;const w=input.width,h=input.height,out=canvas(w,h),ctx=context(out),src=context(input).getImageData(0,0,w,h).data,d=ctx.createImageData(w,h),hex=g.fillColor||'#ffffff',color=[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16),255];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const q=p.inverse((x+.5)/w,(y+.5)/h),i=(y*w+x)*4;let sx=q[0]*w-.5,sy=q[1]*h-.5;
  if(sx<-.5||sy<-.5||sx>w-.5||sy>h-.5){if(maskOnly||g.fill==='transparent')continue;if(g.fill==='color'){d.data.set(color,i);continue;}sx=cap(sx,0,w-1);sy=cap(sy,0,h-1);}
  sx=cap(sx,0,w-1);sy=cap(sy,0,h-1);const x0=Math.floor(sx),y0=Math.floor(sy),x1=Math.min(w-1,x0+1),y1=Math.min(h-1,y0+1),fx=sx-x0,fy=sy-y0;
  const idx=[(y0*w+x0)*4,(y0*w+x1)*4,(y1*w+x0)*4,(y1*w+x1)*4],weights=[(1-fx)*(1-fy),fx*(1-fy),(1-fx)*fy,fx*fy];let alpha=0,r=0,green=0,b=0;
  for(let k=0;k<4;k++){const a=src[idx[k]+3]/255*weights[k];alpha+=a;r+=src[idx[k]]*a;green+=src[idx[k]+1]*a;b+=src[idx[k]+2]*a;}if(alpha){d.data[i]=r/alpha;d.data[i+1]=green/alpha;d.data[i+2]=b/alpha;d.data[i+3]=alpha*255;}
 }ctx.putImageData(d,0,0);return out;
}
function expandedCanvas(c,e,maskOnly=false){const pads={left:Math.round(c.width*e.left/100),right:Math.round(c.width*e.right/100),top:Math.round(c.height*e.top/100),bottom:Math.round(c.height*e.bottom/100)},w=c.width,h=c.height;if(!Object.values(pads).some(Boolean))return{canvas:c,pads};const out=canvas(w+pads.left+pads.right,h+pads.top+pads.bottom),ctx=context(out),l=pads.left,t=pads.top;
 if(!maskOnly&&e.fill==='color'){ctx.fillStyle=e.color;ctx.fillRect(0,0,out.width,out.height);}
 if(!maskOnly&&e.fill==='edge'){
  if(l)ctx.drawImage(c,0,0,1,h,0,t,l,h);if(pads.right)ctx.drawImage(c,w-1,0,1,h,l+w,t,pads.right,h);if(t)ctx.drawImage(c,0,0,w,1,l,0,w,t);if(pads.bottom)ctx.drawImage(c,0,h-1,w,1,l,t+h,w,pads.bottom);
  for(const [sx,sy,dx,dy,dw,dh]of[[0,0,0,0,l,t],[w-1,0,l+w,0,pads.right,t],[0,h-1,0,t+h,l,pads.bottom],[w-1,h-1,l+w,t+h,pads.right,pads.bottom]])if(dw&&dh)ctx.drawImage(c,sx,sy,1,1,dx,dy,dw,dh);
 }
 if(!maskOnly&&e.fill==='mirror')for(let iy=-1;iy<=1;iy++)for(let ix=-1;ix<=1;ix++){ctx.save();ctx.translate(ix===1?l+2*w:l,iy===1?t+2*h:t);ctx.scale(ix===0?1:-1,iy===0?1:-1);ctx.drawImage(c,0,0);ctx.restore();}
 ctx.drawImage(c,l,t);return{canvas:out,pads};
}
function geometryV12(c,s,uncropped=false,maskOnly=false){const g=s.geometry,w=c.width,h=c.height,odd=g.quarter%2,ow=odd?h:w,oh=odd?w:h,angle=g.angle*Math.PI/180,fill=Math.max((Math.abs(Math.cos(angle))*ow+Math.abs(Math.sin(angle))*oh)/ow,(Math.abs(Math.sin(angle))*ow+Math.abs(Math.cos(angle))*oh)/oh);
 const m=new DOMMatrix().translate(ow/2,oh/2).rotate(g.angle).scale(fill).scale(g.flipX?-1:1,g.flipY?-1:1).rotate(g.quarter*90).translate(-w/2,-h/2),oriented=canvas(ow,oh),oc=context(oriented);oc.setTransform(m);oc.drawImage(c,0,0);oc.resetTransform();const warped=warpPerspective(oriented,g,maskOnly),pr=projection(g),cr=uncropped?{x:0,y:0,w:1,h:1}:g.crop;
 const cropped=uncropped?warped:canvas(ow*cr.w,oh*cr.h);if(!uncropped)context(cropped).drawImage(warped,-cr.x*ow,-cr.y*oh);
 const expanded=uncropped?{canvas:cropped,pads:{left:0,top:0}}:expandedCanvas(cropped,g.expand,maskOnly),pads=expanded.pads;
 const forward=point=>{const p=m.transformPoint(point),q=pr.forward(p.x/ow,p.y/oh);return{x:q[0]*ow-cr.x*ow+pads.left,y:q[1]*oh-cr.y*oh+pads.top};},inverse=point=>{const q=pr.inverse((point.x-pads.left+cr.x*ow)/ow,(point.y-pads.top+cr.y*oh)/oh);return m.inverse().transformPoint({x:q[0]*ow,y:q[1]*oh});};
 const center=forward({x:w/2,y:h/2}),offset=forward({x:w/2+1,y:h/2}),map={transformPoint:forward,inverse:()=>({transformPoint:inverse}),a:offset.x-center.x,b:offset.y-center.y};
 return{canvas:expanded.canvas,matrix:map,sourceWidth:w,sourceHeight:h};
}
function fullDimensions(s=state){if(!source)return[0,0];s=effectiveSettings(s);const g=s.geometry,odd=g.quarter%2,w=Math.max(1,Math.round((odd?source.height:source.width)*g.crop.w)),h=Math.max(1,Math.round((odd?source.width:source.height)*g.crop.h));return[w+Math.round(w*g.expand.left/100)+Math.round(w*g.expand.right/100),h+Math.round(h*g.expand.top/100)+Math.round(h*g.expand.bottom/100)];}
function safeRenderEdge(s,maxEdge){const [w,h]=fullDimensions(s),factor=Math.min(1,8192/w,8192/h,Math.sqrt(32000000/(w*h)));return Math.min(maxEdge,Math.max(source.width,source.height)*factor);}
function geometryPanelExtras(){return group('Perspective',range('Horizontal keystone','geometry.perspectiveH',state.geometry.perspectiveH,-70,70)+range('Vertical keystone','geometry.perspectiveV',state.geometry.perspectiveV,-70,70)+`<label class="field">Exposed edge fill<select id="perspectiveFill">${[['transparent','Transparent'],['color','Solid color'],['edge','Stretch edge']].map(([k,v])=>`<option value="${k}" ${state.geometry.fill===k?'selected':''}>${v}</option>`).join('')}</select></label><label class="field">Edge color<input id="perspectiveColor" type="color" value="${state.geometry.fillColor}"></label><p class="hint">Adjust convergence, then crop. All corners remain within the working frame.</p>`,'advanced')+group('Expand canvas',`<p class="hint">Add space around the applied crop. Percentages refer to the cropped photo.</p>`+['left','right','top','bottom'].map(k=>range(k[0].toUpperCase()+k.slice(1)+' %','geometry.expand.'+k,state.geometry.expand[k],0,50)).join('')+`<label class="field">New area fill<select id="expandFill">${[['transparent','Transparent'],['color','Solid color'],['edge','Stretch edge'],['mirror','Mirror photo']].map(([k,v])=>`<option value="${k}" ${state.geometry.expand.fill===k?'selected':''}>${v}</option>`).join('')}</select></label><label class="field">Canvas color<input id="expandColor" type="color" value="${state.geometry.expand.color}"></label><p class="hint">Expansion appears after Apply crop or when you leave this tool. Final output is limited to 32 MP and 8192 px per edge.</p>`,'advanced');}
