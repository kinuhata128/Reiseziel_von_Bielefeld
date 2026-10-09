import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {timeBand,populationBand,filterCities,routeFor,pickCity,uniformIndex,normalizeFilters,DEFAULT_FILTERS,MAP_ORIGIN,mercatorPoint,centeredMapZoom} from '../core.js';
const base={...structuredClone(DEFAULT_FILTERS),bands:[0,1,2,3]};
const city=(id,population=50000,all=60,regional=90,type='county',transfers=1)=>({id,population,type,routes:{all:{minutes:all,transfers},regional:{minutes:regional,transfers}}});
test('travel-time boundaries belong to exactly one bucket',()=>{
  for(const [n,expected] of [[1,0],[60,0],[61,1],[120,1],[121,2],[180,2],[181,3],[240,3],[241,-1],[0,-1],[null,-1],[NaN,-1]])assert.equal(timeBand(n),expected);
});
test('population buckets are disjoint at the exact thresholds',()=>{
  assert.deepEqual([19999,20000,99999,100000,499999,500000].map(populationBand),['small','medium','medium','large','large','metro']);
});
test('regional estimates and filter intersections determine eligibility',()=>{
  const a=city('a'),b=city('b',600000,55,245,'independent',0),c=city('c',10000,150,180),missing={id:'missing',population:1000,type:'county'};
  const all=[a,b,c,missing];
  assert.deepEqual(filterCities(all,{...base,bands:[0]}).map(c=>c.id),['a','b']);
  assert.deepEqual(filterCities(all,{...base,bands:[0],mode:'regional'}),[]);
  assert.deepEqual(filterCities(all,{...base,transfers:'0',sizes:['metro']}).map(c=>c.id),['b']);
  assert.deepEqual(filterCities(all,base,['a']).map(c=>c.id),['b','c']);
  assert.equal(filterCities(all,{...base,excludeVisited:false},['a']).length,3);
  assert.equal(filterCities(all,{...base,bands:[]}).length,0);
  assert.equal(filterCities(all,{...base,sizes:[]}).length,0);
});
test('population multi-select combines buckets and does not filter administration',()=>{
  const all=[city('small',10000),city('medium',50000),city('large',200000),city('metro',600000,60,90,'independent')];
  assert.deepEqual(filterCities(all,{...base,sizes:['small','metro']}).map(c=>c.id),['small','metro']);
  assert.equal(filterCities(all,{...base,types:[]}).length,4);
});
test('a round visits each city exactly once and handles exhausted / empty pools',()=>{
  const pool=[city('a'),city('b'),city('c')],seen=new Set();
  const results=pool.map(()=>pickCity(pool,seen,()=>0));
  assert.deepEqual(results.map(r=>r.city.id),['a','b','c']);
  assert.ok(results.every(r=>!r.restarted));
  assert.equal(pickCity(pool,seen,()=>0).restarted,true);
  assert.equal(seen.size,1);
  assert.equal(pickCity([],seen).city,null);
});
test('uniform sampling rejects the biased upper tail',()=>{
  let values=[0xffffffff,5];
  assert.equal(uniformIndex(3,()=>values.shift()),2);
  assert.equal(values.length,0);
  assert.throws(()=>uniformIndex(0),RangeError);
});
test('untrusted saved filter fields are normalized',()=>{
  const f=normalizeFilters({bands:[1,1,9,'0'],sizes:['small','small','hack','metro'],types:['county'],mode:'hack',excludeVisited:'false'});
  assert.deepEqual(f.bands,[1]);assert.deepEqual(f.sizes,['small','metro']);assert.equal(f.mode,'all');assert.equal(f.excludeVisited,true);assert.equal(f.types,undefined);
});
test('old single-size preferences migrate; retired type filters cannot constrain the pool',()=>{
  assert.deepEqual(normalizeFilters({size:'medium',types:[]}).sizes,['medium']);
  assert.deepEqual(normalizeFilters({size:'all'}).sizes,DEFAULT_FILTERS.sizes);
  assert.deepEqual(normalizeFilters({sizes:[],size:'medium'}).sizes,[]);
});
test('centred zoom uses the actual Mercator distance and viewport dimensions',()=>{
  const berlin={lat:52.52437,lon:13.41053},near={lat:52.11591,lon:8.19956};
  assert.ok(centeredMapZoom(near,720,260)>centeredMapZoom(berlin,720,260));
  assert.ok(centeredMapZoom(berlin,300,220)<=centeredMapZoom(berlin,720,260));
  assert.equal(centeredMapZoom(null,720,260),9);
  assert.throws(()=>centeredMapZoom({lat:NaN,lon:8},720,260),RangeError);
  assert.throws(()=>centeredMapZoom(berlin,0,220),RangeError);
});
test('all city locations fit inside a viewport centred on Bielefeld, including phone sizes',async()=>{
  const geo=JSON.parse(await readFile(new URL('../data/locations.json',import.meta.url),'utf8'));
  const origin=mercatorPoint(MAP_ORIGIN);
  for(const l of geo.locations)for(const [width,height] of [[720,260],[300,220],[250,220]]){
    const z=centeredMapZoom(l,width,height),p=mercatorPoint(l);
    assert.ok(Math.abs(p.x-origin.x)*2**z<=width/2-80,`horizontal fit ${l.cityId}`);
    assert.ok(Math.abs(p.y-origin.y)*2**z<=height/2-80,`vertical fit ${l.cityId}`);
    if(z<11)assert.ok(Math.abs(p.x-origin.x)*2**(z+1)>width/2-80||Math.abs(p.y-origin.y)*2**(z+1)>height/2-80);
  }
});
test('every selectable destination has exactly one German city location',async()=>{
  const geo=JSON.parse(await readFile(new URL('../data/locations.json',import.meta.url),'utf8'));
  const routes=JSON.parse(await readFile(new URL('../data/routes.json',import.meta.url),'utf8'));
  const ids=new Set(geo.locations.map(l=>l.cityId));assert.equal(ids.size,geo.locations.length);
  assert.ok(routes.routes.every(r=>ids.has(r.cityId)));
  for(const l of geo.locations){assert.ok(l.lat>47&&l.lat<55.2&&l.lon>5&&l.lon<16);assert.ok(Number.isInteger(l.geonamesId));}
});
test('official database and estimates have consistent unique identifiers',async()=>{
  const database=JSON.parse(await readFile(new URL('../data/cities.json',import.meta.url),'utf8'));
  const estimates=JSON.parse(await readFile(new URL('../data/routes.json',import.meta.url),'utf8'));
  assert.ok(database.cities.length>2000);
  const ids=new Set(database.cities.map(c=>c.id));assert.equal(ids.size,database.cities.length);
  assert.equal(new Set(estimates.routes.map(r=>r.cityId)).size,estimates.routes.length);
  assert.equal(estimates.meta.verified,false);
  for(const r of estimates.routes){assert.ok(ids.has(r.cityId));assert.ok(r.station);for(const mode of ['all','regional']){assert.ok(Number.isInteger(r[mode].minutes)&&r[mode].minutes>0);assert.ok(Number.isInteger(r[mode].transfers)&&r[mode].transfers>=0);}if((r.all.kind==='official-journey-example')===(r.regional.kind==='official-journey-example'))assert.ok(r.regional.minutes>=r.all.minutes);}
  assert.equal(database.cities.find(c=>c.name==='Hannover').type,'county');
  assert.equal(database.cities.find(c=>c.name==='Bielefeld').type,'independent');
});
test('PWA install list and GitHub Pages assets exist',async()=>{
  const manifest=JSON.parse(await readFile(new URL('../manifest.webmanifest',import.meta.url),'utf8'));
  for(const icon of manifest.icons){assert.ok((await readFile(new URL(`../${icon.src}`,import.meta.url))).length>0);}
  assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');
});
