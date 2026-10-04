/* v1.1 spatial editing, navigation, and durable workspace preferences. */
let selectedBrush=-1,selectedClone=-1,brushAction='paint',showMask=false,pressureEnabled=false,panEnabled=false,previewQuality='fast',cropSnap=true;
const pointerPositions=new Map();let navigationDrag=null,pinchStart=null;
let detailOpen={};try{detailOpen=JSON.parse(safePrefs('groups')||'{}');}catch{}

function rangeEdit(path,value){const [g,k]=path.split('.');if(g==='brushSelected'){const s=state.brushes[selectedBrush];if(s)s[k]=value;return true;}if(g==='cloneSelected'){const s=state.clones[selectedClone];if(s)s[k]=value;return true;}return false;}
function selectedStrokePanel(type){
 const isBrush=type==='brushes',arr=state[type],index=isBrush?selectedBrush:selectedClone,st=arr[index],prefix=isBrush?'brush':'clone',path=isBrush?'brushSelected':'cloneSelected';
 let html=`<h3>Recorded ${isBrush?'adjustments':'clone strokes'}</h3><label class="field">Selected stroke<select id="${prefix}Select"><option value="-1">Choose a stroke</option>${arr.map((s,i)=>`<option value="${i}" ${i===index?'selected':''}>${i+1}. ${isBrush?s.kind:'Clone'}${s.enabled===false?' · bypassed':''}</option>`).join('')}</select></label>`;
 if(st){html+=`<label class="inline-toggle"><input id="${prefix}Enabled" type="checkbox" ${st.enabled!==false?'checked':''}>Apply this stroke</label>`+range('Selected radius %',path+'.radius',st.radius,.5,isBrush?20:15,.5);
  if(isBrush)html+=range(st.kind==='exposure'?'Selected exposure (EV)':'Selected strength',path+'.value',st.value,st.kind==='exposure'?-2:-100,st.kind==='exposure'?2:100,st.kind==='exposure'?.1:1)+range('Selected feather',path+'.feather',st.feather??39,0,100);
  else html+=range('Selected opacity',path+'.opacity',st.opacity,5,100)+range('Source offset X',path+'.dx',st.dx,-1,1,.005)+range('Source offset Y',path+'.dy',st.dy,-1,1,.005);
  html+=`<button id="${prefix}Delete" class="full">Delete selected stroke</button>`;
  if(isBrush)html+=`<div class="button-row"><button id="eraseMode" aria-pressed="${brushAction==='erase'}">Erase selected mask</button><button id="clearEraser" ${!st.erasers?.length?'disabled':''}>Restore erased area</button></div><p class="hint">Eraser uses the brush radius above. It affects only the selected stroke; Undo restores the previous mask.</p>`;
 }
 return `<section class="group">${html}</section>`;
}
function extendWorkspacePanel(){
 selectedBrush=Math.min(selectedBrush,state.brushes.length-1);selectedClone=Math.min(selectedClone,state.clones.length-1);if(selectedBrush<0)brushAction='paint';
 const field=$('panelBody').querySelector('fieldset');if(!field)return;
 if(tab==='local'){
  field.insertAdjacentHTML('afterbegin',`<label class="inline-toggle"><input id="showMask" type="checkbox" ${showMask?'checked':''}>Show selected mask</label>`);
  if(localMode==='brush'){
   $('brushKind').closest('label').insertAdjacentHTML('beforebegin','<h3>Next stroke</h3>');
   field.insertAdjacentHTML('beforeend',`<label class="inline-toggle"><input id="pressureEnabled" type="checkbox" ${pressureEnabled?'checked':''}>Pen pressure controls radius</label><button id="paintMode" class="full" aria-pressed="${brushAction==='paint'}">Paint a new adjustment</button>`+selectedStrokePanel('brushes'));
  }
 }
 if(tab==='retouch'&&retouchMode==='clone')field.insertAdjacentHTML('beforeend',selectedStrokePanel('clones'));
 if(tab==='crop'){
  field.querySelector('.hint').textContent='Drag a corner to resize, drag inside to move, or drag outside to draw a new crop. Apply when ready.';
  $('cropRatio').closest('label').insertAdjacentHTML('afterend',`<label class="inline-toggle"><input id="cropSnap" type="checkbox" ${cropSnap?'checked':''}>Snap edges to thirds and center</label>`);
 }
 document.querySelectorAll('#panelBody details').forEach((el,i)=>{const key=tab+':'+el.querySelector('summary').textContent;el.open=key in detailOpen?detailOpen[key]:!el.classList.contains('filter-tuning');el.addEventListener('toggle',()=>{detailOpen[key]=el.open;safePrefs('groups',JSON.stringify(detailOpen));});});
}
function wireWorkspacePanel(){const bind=(id,fn,event='click')=>{if($(id))$(id).addEventListener(event,fn);};
 bind('showMask',e=>{showMask=e.target.checked;drawOverlay();},'change');bind('pressureEnabled',e=>{pressureEnabled=e.target.checked;safePrefs('pressure',String(pressureEnabled));},'change');bind('cropSnap',e=>{cropSnap=e.target.checked;safePrefs('snap',String(cropSnap));},'change');
 bind('paintMode',()=>{brushAction='paint';renderPanel();});bind('eraseMode',()=>{brushAction='erase';showMask=true;renderPanel();});bind('clearEraser',()=>{state.brushes[selectedBrush].erasers=[];changed('Restore erased mask');renderPanel();});
 for(const [prefix,type]of[['brush','brushes'],['clone','clones']]){
  bind(prefix+'Select',e=>{if(type==='brushes'){selectedBrush=Number(e.target.value);if(selectedBrush<0)brushAction='paint';}else selectedClone=Number(e.target.value);renderPanel();},'change');
  bind(prefix+'Enabled',e=>{const i=type==='brushes'?selectedBrush:selectedClone;state[type][i].enabled=e.target.checked;changed('Toggle stroke');},'change');
  bind(prefix+'Delete',()=>{const i=type==='brushes'?selectedBrush:selectedClone;state[type].splice(i,1);if(type==='brushes'){selectedBrush=Math.min(i,state[type].length-1);brushAction='paint';}else selectedClone=Math.min(i,state[type].length-1);changed('Delete stroke');renderPanel();});
 }
}
function drawMaskOverlay(){if(!showMask||tab!=='local'||showBefore||!source||!previewResult)return;const w=480,h=Math.max(1,Math.round(w*source.height/source.width)),c=canvas(w,h),ctx=context(c),d=ctx.createImageData(w,h);let mask;
 if(localMode==='point'){const p=state.points[selectedPoint];if(!p)return;mask=new Float32Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const dist=Math.hypot(x/w-p.x,(y/h-p.y)*h/w)/(p.radius/100);if(dist<1)mask[y*w+x]=Math.pow(1-dist,Math.max(.2,p.feather/30));}}
 else{let st=state.brushes[selectedBrush];if(drag?.type==='stroke'&&drag.target==='brushes')st=drag.stroke;if(!st)return;if(drag?.type==='erase')st={...st,erasers:[...(st.erasers||[]),drag.stroke]};mask=coverageMask(st,w,h);}
 for(let j=0;j<mask.length;j++){const i=j*4;d.data[i]=255;d.data[i+1]=55;d.data[i+2]=148;d.data[i+3]=mask[j]*165;}ctx.putImageData(d,0,0);const s=effectiveSettings(state);s.geometry.fill='transparent';s.geometry.expand.fill='transparent';const m=geometry(c,s,false,true).canvas;context($('overlay')).drawImage(m,0,0,$('overlay').width,$('overlay').height);
}
function pressureFor(e){return pressureEnabled&&e.pointerType==='pen'?cap(e.pressure||.1,.1,1):1;}
function snapped(value){if(!cropSnap)return value;for(const n of [0,1/3,.5,2/3,1])if(Math.abs(value-n)<.012)return n;return value;}
function cropPointerStart(nx,ny){const r=cropDraft,c=$('overlay'),box=c.getBoundingClientRect(),hit=16/Math.min(box.width,box.height),corners=[[r.x,r.y,'nw'],[r.x+r.w,r.y,'ne'],[r.x,r.y+r.h,'sw'],[r.x+r.w,r.y+r.h,'se']];const found=corners.find(([x,y])=>Math.abs(nx-x)<hit&&Math.abs(ny-y)<hit);if(found){drag={type:'cropHandle',corner:found[2],initial:copy(r)};return;}if((r.w<.999||r.h<.999)&&nx>r.x&&nx<r.x+r.w&&ny>r.y&&ny<r.y+r.h){drag={type:'cropMove',start:[nx,ny],initial:copy(r)};return;}drag={type:'crop',start:[snapped(nx),snapped(ny)]};}
function cropPointerMove(nx,ny){const d=drag,r=d.initial;if(d.type==='cropMove'){cropDraft.x=snapCropPosition(r.x+nx-d.start[0],r.w);cropDraft.y=snapCropPosition(r.y+ny-d.start[1],r.h);}
 else if(d.type==='cropHandle'){
  const left=d.corner.includes('w'),top=d.corner.includes('n'),ax=left?r.x+r.w:r.x,ay=top?r.y+r.h:r.y;let x=cap(snapped(nx),left?0:ax+.01,left?ax-.01:1),y=cap(snapped(ny),top?0:ay+.01,top?ay-.01:1),w=Math.abs(x-ax),h=Math.abs(y-ay);
  if(cropRatio!=='free'){const ir=$('overlay').width/$('overlay').height,ratio=cropRatio==='original'?ir:Number(cropRatio);h=w*ir/ratio;const available=top?ay:1-ay;if(h>available){h=available;w=h*ratio/ir;}}
  cropDraft={x:left?ax-w:ax,y:top?ay-h:ay,w:Math.max(.01,w),h:Math.max(.01,h)};
 }for(const k of ['x','y','w','h'])if($('crop-'+k))$('crop-'+k).value=+(cropDraft[k]*100).toFixed(2);drawOverlay();}
function handleWorkspacePointerStart(e){
 pointerPositions.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pointerPositions.size===2){drag=null;const pts=[...pointerPositions.values()];pinchStart={distance:Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y),zoom:currentZoom()};$('overlay').setPointerCapture(e.pointerId);return true;}
 if(panEnabled||e.button===1){navigationDrag={x:e.clientX,y:e.clientY,left:$('workspace').scrollLeft,top:$('workspace').scrollTop};$('overlay').setPointerCapture(e.pointerId);e.preventDefault();return true;}return false;
}
function handleWorkspacePointerMove(e){
 if(pointerPositions.has(e.pointerId))pointerPositions.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pinchStart&&pointerPositions.size>=2){const pts=[...pointerPositions.values()],dist=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);zoomTo(pinchStart.zoom*dist/Math.max(1,pinchStart.distance),(pts[0].x+pts[1].x)/2,(pts[0].y+pts[1].y)/2);return true;}
 if(navigationDrag){$('workspace').scrollLeft=navigationDrag.left-(e.clientX-navigationDrag.x);$('workspace').scrollTop=navigationDrag.top-(e.clientY-navigationDrag.y);return true;}return false;
}
function handleWorkspacePointerEnd(e){pointerPositions.delete(e.pointerId);if(pinchStart){if(pointerPositions.size<2)pinchStart=null;drag=null;return true;}if(navigationDrag){navigationDrag=null;return true;}return false;}
function currentZoom(){if(!$('photo').width)return 1;return $('photoWrap').getBoundingClientRect().width/$('photo').width;}
function zoomTo(z,x,y){if(!previewResult)return;z=cap(z,.08,6);const old=$('photoWrap').getBoundingClientRect(),nx=(x-old.left)/old.width,ny=(y-old.top)/old.height;let opt=$('zoom').querySelector('[data-custom]');if(!opt){opt=new Option();opt.dataset.custom='true';$('zoom').append(opt);}opt.value=String(z);opt.textContent=Math.round(z*100)+'%';$('zoom').value=String(z);sizePhoto();const rect=$('photoWrap').getBoundingClientRect();$('workspace').scrollLeft+=rect.left+nx*rect.width-x;$('workspace').scrollTop+=rect.top+ny*rect.height-y;}
function setupWorkspace(){pressureEnabled=safePrefs('pressure')==='true';cropSnap=safePrefs('snap')!=='false';
 $('panToggle').onclick=()=>{panEnabled=!panEnabled;$('panToggle').setAttribute('aria-pressed',String(panEnabled));$('overlay').classList.toggle('panning',panEnabled);};
 $('previewQuality').onchange=e=>{previewQuality=e.target.value;requestRender();};
 $('overlay').addEventListener('dblclick',e=>{if(panEnabled||!['local','retouch','crop'].includes(tab)){if($('zoom').value==='fit')zoomTo(1,e.clientX,e.clientY);else{$('zoom').value='fit';sizePhoto();}}});
 $('workspace').addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();zoomTo(currentZoom()*Math.exp(-e.deltaY*.004),e.clientX,e.clientY);}},{passive:false});
 const width=Number(safePrefs('panel-width'))||380;setInspectorWidth(width);
 const splitter=$('inspectorResize');splitter.onpointerdown=e=>{splitter.setPointerCapture(e.pointerId);splitter.dataset.dragging='true';};splitter.onpointermove=e=>{if(splitter.dataset.dragging==='true')setInspectorWidth(innerWidth-e.clientX);};splitter.onpointerup=()=>{delete splitter.dataset.dragging;safePrefs('panel-width',splitter.getAttribute('aria-valuenow'));};splitter.onkeydown=e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();setInspectorWidth(Number(splitter.getAttribute('aria-valuenow'))+(e.key==='ArrowLeft'?20:-20));safePrefs('panel-width',splitter.getAttribute('aria-valuenow'));}};
}
function setInspectorWidth(width){width=Math.round(cap(width,300,520));document.documentElement.style.setProperty('--inspector-width',width+'px');$('inspectorResize').setAttribute('aria-valuenow',String(width));}

function snapCropPosition(value,size){value=cap(value,0,1-size);if(!cropSnap)return value;let best=0,dist=.012;for(const offset of [0,size/2,size])for(const target of [0,1/3,.5,2/3,1]){const delta=target-(value+offset);if(Math.abs(delta)<dist){dist=Math.abs(delta);best=delta;}}return cap(value+best,0,1-size);}
