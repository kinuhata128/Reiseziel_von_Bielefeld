import {DEFAULT_FILTERS, normalizeFilters, filterCities, routeFor, formatDuration, pickCity, MAP_ORIGIN, centeredMapZoom} from './core.js';
import {cityNameZh, cityNameAliasesZh} from './assets/city-names.js';
const $=selector=>document.querySelector(selector), $$=selector=>[...document.querySelectorAll(selector)];
const STORAGE_KEY='naechster-halt-v1';
const number=new Intl.NumberFormat('zh-CN');
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let cities=[],pool=[],filters=structuredClone(DEFAULT_FILTERS),visited=[],current=null,drawn=new Set(),loading=true;
let toastTimer,deferredInstall,storageWarning=false;
let journeyMap,destinationMarker,mapCityId;
function notify(message){clearTimeout(toastTimer);$('#status').textContent=message;$('#status').hidden=false;toastTimer=setTimeout(()=>$('#status').hidden=true,4000);}
function loadSaved(){
  try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');filters=normalizeFilters(saved?.filters);if(Array.isArray(saved?.visited))visited=[...new Set(saved.visited.filter(id=>typeof id==='string'&&/^\d{12}$/.test(id)))];}
  catch{notify('记录无法读取，已恢复默认设置。');}
}
function save(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify({version:1,filters,visited}));}
  catch{if(!storageWarning){storageWarning=true;notify('浏览器未允许保存记录。');}}
}
function syncControls(){
  $$('[name=band]').forEach(el=>el.checked=filters.bands.includes(Number(el.value)));
  $$('[name=size]').forEach(el=>el.checked=filters.sizes.includes(el.value));
  $$('[name=mode]').forEach(el=>el.checked=filters.mode===el.value);
  $('#transfers').value=filters.transfers;$('#exclude-visited').checked=filters.excludeVisited;
}
function readControls(){
  filters=normalizeFilters({bands:$$('[name=band]:checked').map(el=>Number(el.value)),sizes:$$('[name=size]:checked').map(el=>el.value),mode:$('[name=mode]:checked')?.value,transfers:$('#transfers').value,excludeVisited:$('#exclude-visited').checked});
  drawn.clear();current=null;save();refresh();
}
function switchTab(name){
  $$('.tab').forEach(el=>{const selected=el.dataset.tab===name;el.classList.toggle('active',selected);if(selected)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
  ['picker','candidates','visited'].forEach(tab=>$(`#${tab}-panel`).hidden=tab!==name);
  if(name==='picker')renderMap();
}
function emptyReason(){
  if(!filters.bands.length)return '请选择用时';
  if(!filters.sizes.length)return '请选择城市人口';
  return '没有符合条件的城市';
}
function emptyMarkup(message,reset=false){return `<div class="empty-state"><p>${escape(message)}</p>${reset?'<button data-action="reset">重置筛选</button>':''}</div>`;}
function renderMap(){
  const container=$('#destination-map');
  if(!container.clientWidth||!container.clientHeight)return;
  const recenter=!journeyMap||mapCityId!==current?.id;
  if(!journeyMap){
    if(!window.L){$('#map-offline').hidden=false;$('#map-offline').textContent='地图加载失败';return;}
    journeyMap=L.map(container,{dragging:true,keyboard:true,boxZoom:true,scrollWheelZoom:true,doubleClickZoom:true,touchZoom:true,zoomAnimation:false,fadeAnimation:false,markerZoomAnimation:false,minZoom:0,maxZoom:18});
    journeyMap.setView([MAP_ORIGIN.lat,MAP_ORIGIN.lon],9);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'}).addTo(journeyMap);
    L.circleMarker([MAP_ORIGIN.lat,MAP_ORIGIN.lon],{radius:6,color:'#fff',weight:2,fillColor:'#3479c6',fillOpacity:1}).addTo(journeyMap);
    new ResizeObserver(()=>renderMap()).observe(container);
  }
  if(mapCityId!==current?.id){
    if(destinationMarker){destinationMarker.remove();destinationMarker=null;}
    if(current?.location){
      const icon=L.divIcon({className:'destination-pin',iconSize:[22,29],iconAnchor:[11,29],html:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 42" aria-hidden="true"><path d="M16 40C13 34 2 25 2 16a14 14 0 0 1 28 0c0 9-11 18-14 24Z" fill="#e02d2d" stroke="white" stroke-width="2"/><circle cx="16" cy="16" r="5" fill="white"/></svg>'});
      destinationMarker=L.marker([current.location.lat,current.location.lon],{icon,alt:current.name,autoPanOnFocus:false}).addTo(journeyMap);
    }
    mapCityId=current?.id;
  }
  journeyMap.invalidateSize({pan:false});
  if(recenter)journeyMap.setView([MAP_ORIGIN.lat,MAP_ORIGIN.lon],centeredMapZoom(current?.location,container.clientWidth,container.clientHeight),{animate:false,reset:true});
  container.setAttribute('aria-label',current?`Bielefeld 至 ${current.name} 位置地图`:'Bielefeld 周边地图');
}
function renderResult(){
  $('#visit').hidden=!current;$('#db-link').hidden=!current;$('#copy-destination').hidden=!current;$('#google-maps').hidden=!current;
  $('#draw').textContent=current?'再抽一个':'抽一个';
  if(loading)$('#result').innerHTML='<h2>加载中…</h2>';
  else if(!current)$('#result').innerHTML=`<h2>${pool.length?'选择目的地':emptyReason()}</h2>`;
  else{
    const route=routeFor(current,filters.mode,filters.transfers);
    $('#db-link').href=`https://www.bahn.de/buchung/start#so=${encodeURIComponent('Bielefeld Hbf')}&zo=${encodeURIComponent(route.station||current.station)}`;
    $('#google-maps').href=`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${current.name}, ${current.state}, Germany`)}&hl=zh-CN`;
    const reference=route.kind==='official-journey-example'?`DB 班次参考 · ${route.sample.departureDate} · 出行日请重新查询`:'估算用时 · 尚未核验实际班次';
    $('#result').innerHTML=`<h2>${escape(current.name)}${current.nameZh?`<span class="city-name-zh">${escape(current.nameZh)}</span>`:''}</h2><div class="route-box"><div class="route-line"><span>Bielefeld Hbf</span><span class="rail-line" aria-hidden="true"></span><span>${escape(route.station||current.station)}</span></div><div class="route-meta"><strong>约 ${formatDuration(route.minutes)}</strong><span>${filters.mode==='regional'?'区域铁路':'全部铁路'} · ${route.transfers===0?'直达':`${route.transfers} 次换乘`}</span></div><p class="route-reference">${escape(reference)}</p></div>`;
    $('#visit').textContent=visited.includes(current.id)?'撤销已去':'标记去过';
    $('#visit').setAttribute('aria-pressed',String(visited.includes(current.id)));
  }
  renderMap();
}
function cityRow(city,footprint=false){
  const route=routeFor(city,filters.mode,filters.transfers);
  const seen=visited.includes(city.id);
  return `<div class="city-row"><div><b>${escape(city.name)}</b>${city.nameZh?`<span class="city-name-zh">${escape(city.nameZh)}</span>`:''}<p>${number.format(city.population)} 人</p></div><div class="city-row-end">${!footprint&&route?`<span>约 ${formatDuration(route.minutes)}</span>`:''}<button data-action="${footprint?'remove':'select'}" data-id="${city.id}" aria-label="${footprint?'移除':'查看'} ${escape(city.name)}">${footprint?'移除':'查看'}</button>${!footprint?`<button class="city-visit" data-action="visit" data-id="${city.id}" aria-pressed="${seen}" aria-label="${seen?'撤销已去':'标记去过'} ${escape(city.name)}">${seen?'已去过 ✓':'标记去过'}</button>`:''}</div></div>`;
}
function renderCandidates(){
  const query=$('#search').value.trim().toLocaleLowerCase('de');
  const shown=pool.filter(c=>`${c.name} ${c.nameZh||''} ${(c.nameAliasesZh||[]).join(' ')} ${c.state}`.toLocaleLowerCase('de').includes(query));
  const sort=$('#sort').value;
  shown.sort((a,b)=>sort==='name'?a.name.localeCompare(b.name,'de'):sort==='population'?b.population-a.population:routeFor(a,filters.mode,filters.transfers).minutes-routeFor(b,filters.mode,filters.transfers).minutes||a.name.localeCompare(b.name,'de'));
  $('#candidate-list').innerHTML=shown.length?shown.map(c=>cityRow(c)).join(''):emptyMarkup(pool.length?'没有匹配的城市':emptyReason(),!pool.length);
}
function renderVisited(){
  const seen=cities.filter(c=>visited.includes(c.id)).sort((a,b)=>a.name.localeCompare(b.name,'de'));
  $('#visited-count').textContent=seen.length;
  $('#visited-list').innerHTML=seen.length?seen.map(c=>cityRow(c,true)).join(''):emptyMarkup('暂无记录');
  $('#export-records').disabled=!seen.length;
}
function refresh(){
  pool=filterCities(cities,filters,visited);$('#tab-count').textContent=pool.length;
  $('#draw').disabled=loading||!pool.length;
  $('#pool-text').textContent=loading?'加载中…':`${pool.length} 座候选城市`;
  renderResult();renderCandidates();renderVisited();
}
function reset(){filters=structuredClone(DEFAULT_FILTERS);current=null;drawn.clear();syncControls();save();refresh();}
function visit(id,removeOnly=false){
  if(!cities.some(c=>c.id===id))return;
  if(visited.includes(id))visited=visited.filter(x=>x!==id);
  else if(!removeOnly)visited.push(id);
  save();refresh();
}
async function init(){
  loadSaved();syncControls();renderResult();
  try{
    const responses=await Promise.all(['cities','routes','locations'].map(file=>fetch(`./data/${file}.json`)));
    if(responses.some(r=>!r.ok))throw new Error('Data unavailable');
    const [database,railway,geo]=await Promise.all(responses.map(r=>r.json()));
    if(!Array.isArray(database.cities)||!Array.isArray(railway.routes)||!Array.isArray(geo.locations))throw new Error('Invalid data');
    const routeMap=new Map(railway.routes.map(r=>[r.cityId,r])),locationMap=new Map(geo.locations.map(l=>[l.cityId,l]));
    cities=database.cities.map(c=>({...c,nameZh:cityNameZh(c),nameAliasesZh:cityNameAliasesZh(c),station:routeMap.get(c.id)?.station,routes:routeMap.get(c.id),location:locationMap.get(c.id)}));
    const ids=new Set(cities.map(c=>c.id));visited=visited.filter(id=>ids.has(id));loading=false;refresh();
    if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
  }catch{
    $('#result').innerHTML=emptyMarkup('数据加载失败');const retry=document.createElement('button');retry.textContent='重试';retry.addEventListener('click',()=>location.reload());$('#result .empty-state').append(retry);$('#pool-text').textContent='';
  }
}
$('.filters').addEventListener('change',readControls);
$('#reset').addEventListener('click',reset);
$('#all-sizes').addEventListener('click',()=>{$$('[name=size]').forEach(el=>el.checked=true);readControls();});
$$('.tab').forEach(el=>el.addEventListener('click',()=>switchTab(el.dataset.tab)));
$('#search').addEventListener('input',renderCandidates);$('#sort').addEventListener('change',renderCandidates);
$('#draw').addEventListener('click',()=>{const {city}=pickCity(pool,drawn);if(city){current=city;renderResult();}});
$('#visit').addEventListener('click',()=>{if(current)visit(current.id);});
$('#copy-destination').addEventListener('click',async()=>{
  if(!current)return;
  const name=current.name;
  try{
    await navigator.clipboard.writeText(name);
    notify(`已复制：${name}`);
  }catch{
    // Compatibility fallback for browsers without the Clipboard API.
    const field=document.createElement('textarea');field.value=name;
    field.setAttribute('readonly','');field.style.position='fixed';field.style.opacity='0';
    document.body.append(field);field.select();
    let copied=false;try{copied=document.execCommand('copy');}catch{}
    field.remove();$('#copy-destination').focus();
    notify(copied?`已复制：${name}`:`无法复制，请手动复制：${name}`);
  }
});
document.addEventListener('click',event=>{
  const target=event.target.closest('[data-action]');if(!target)return;const {action,id}=target.dataset;
  if(action==='reset')reset();
  if(action==='remove')visit(id,true);
  if(action==='visit')visit(id);
  if(action==='select'){current=pool.find(c=>c.id===id);switchTab('picker');renderResult();if(innerWidth<761)$('#picker-panel').scrollIntoView({block:'start'});}
});
$('#export-records').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify({version:1,app:'naechster-halt',visited},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='naechster-halt-footprints.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$('#import-records').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  try{
    if(file.size>100000)throw new Error('File too large');const data=JSON.parse(await file.text());
    if(data.version!==1||data.app!=='naechster-halt'||!Array.isArray(data.visited)||data.visited.some(id=>typeof id!=='string'||!/^\d{12}$/.test(id)))throw new Error('Invalid records');
    const ids=new Set(cities.map(c=>c.id));visited=[...new Set([...visited,...data.visited.filter(id=>ids.has(id))])];save();refresh();notify('已导入');
  }catch{notify('记录文件无效');}event.target.value='';
});
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstall=event;$('#install').hidden=false;});
$('#install').addEventListener('click',async()=>{if(deferredInstall){await deferredInstall.prompt();deferredInstall=null;$('#install').hidden=true;}});
window.addEventListener('appinstalled',()=>$('#install').hidden=true);
function connectivity(){$('#map-offline').hidden=navigator.onLine;}
window.addEventListener('online',connectivity);window.addEventListener('offline',connectivity);connectivity();
init();
