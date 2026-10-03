/* Discoverable controls for the five creative filters, in both editor modes. */
let selectedFilter='halation';
function filterStateLabel(f){const e=state.effects;return e[f.id+'Enabled']===false?'Bypassed':e[f.id]===0?'Off':String(e[f.id])+'%';}
function creativePanel(){const f=creativeFilters.find(f=>f.id===selectedFilter),e=state.effects;
 let html=`<section class="creative-filters" aria-labelledby="creativeTitle"><h3 id="creativeTitle">Creative filters</h3><div class="filter-grid" role="group" aria-label="Choose a creative filter">${creativeFilters.map(item=>`<button data-filter="${item.id}" aria-pressed="${item.id===selectedFilter}"><span>${item.name}</span><small data-filter-status="${item.id}">${filterStateLabel(item)}</small></button>`).join('')}</div><div class="filter-controls"><div class="row"><h4>${f.name}</h4><label class="inline-toggle"><input id="filterEnabled" type="checkbox" ${e[f.id+'Enabled']!==false?'checked':''}>Apply</label></div><p class="hint">${f.hint}</p>`;
 if(f.id==='film')html+=`<label class="field">Film palette<select id="filmProfile">${filmProfiles.map(([k,n])=>`<option value="${k}" ${e.filmProfile===k?'selected':''}>${n}</option>`).join('')}</select></label>`;
 html+=range(f.name+' strength','effects.'+f.id,e[f.id],...f.amount);
 html+=`<details class="filter-tuning"><summary>Fine-tune ${f.name.toLowerCase()}</summary>`;
 if(f.id==='aberration')html+=`<label class="field">Fringe direction<select id="aberrationMode"><option value="radial" ${e.aberrationMode==='radial'?'selected':''}>Radial · from optical center</option><option value="linear" ${e.aberrationMode==='linear'?'selected':''}>Linear · across the image</option></select></label>`;
 for(const [k,label,min,max,step]of f.controls){if(f.id==='aberration'&&((k==='aberrationAngle')!==(e.aberrationMode==='linear')))continue;html+=range(label,'effects.'+k,e[k],min,max,step);}
 if(f.id==='grunge')html+='<button id="newTexture" class="full">New texture</button>';
 html+=`</details><button id="resetFilter" class="text-button">Reset ${f.name.toLowerCase()}</button></div></section>`;return html;
}
function updateFilterStatus(){for(const f of creativeFilters){const el=document.querySelector(`[data-filter-status="${f.id}"]`);if(el)el.textContent=filterStateLabel(f);}}
function wireCreativePanel(){if(tab!=='finish')return;
 document.querySelectorAll('[data-filter]').forEach(el=>el.onclick=()=>{selectedFilter=el.dataset.filter;renderPanel();document.querySelector(`[data-filter="${selectedFilter}"]`).focus();});
 $('filterEnabled').onchange=e=>{state.effects[selectedFilter+'Enabled']=e.target.checked;changed('Toggle '+selectedFilter);updateFilterStatus();};
 $('resetFilter').onclick=()=>{const d=creativeDefaults(),f=creativeFilters.find(f=>f.id===selectedFilter);for(const k of [f.id,f.id+'Enabled',...f.controls.map(([k])=>k),...(f.id==='film'?['filmProfile']:f.id==='aberration'?['aberrationMode']:[])])state.effects[k]=d[k];changed('Reset '+f.name);renderPanel();};
 for(const key of ['filmProfile','aberrationMode'])if($(key))$(key).onchange=e=>{state.effects[key]=e.target.value;changed('Change '+key);if(key==='aberrationMode')renderPanel();};
 if($('newTexture'))$('newTexture').onclick=()=>{state.effects.grungeSeed=state.effects.grungeSeed%9999+1;changed('New grunge texture');renderPanel();};
 document.querySelector('.creative-filters').addEventListener('input',updateFilterStatus);
 document.querySelector('.creative-filters').addEventListener('change',updateFilterStatus);
}
