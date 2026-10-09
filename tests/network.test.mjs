import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {calculateNetwork} from '../scripts/calculate-routes.mjs';
import {routeFor,filterCities,DEFAULT_FILTERS} from '../core.js';

test('corridors are bidirectional, same-line stops add no changes, interchanges include waiting',()=>{
  const network=[{id:'A',stops:['origin','middle','hub'],minutes:[10,15]},{id:'B',stops:['hub','target'],minutes:[20]}];
  const arrivals=calculateNetwork([{station:'origin',minutes:0,transfers:0}],network);
  assert.equal(arrivals.get('hub')[0].minutes,25);
  assert.equal(arrivals.get('hub')[0].transfers,0);
  assert.equal(arrivals.get('target')[0].minutes,57);
  assert.equal(arrivals.get('target')[0].transfers,1);
  assert.deepEqual(arrivals.get('target')[0].via,['origin','middle','hub','target']);
  const reverse=calculateNetwork([{station:'target',minutes:0,transfers:0}],network);
  assert.equal(reverse.get('origin')[0].minutes,57);
});

test('the incoming corridor is part of the search state and slower direct journeys survive',()=>{
  const corridors=[{id:'slow-direct',stops:['origin','hub','target'],minutes:[40,10]},{id:'fast',stops:['origin','hub'],minutes:[5]}];
  const routes=calculateNetwork([{station:'origin',minutes:0,transfers:0}],corridors).get('target');
  assert.deepEqual(routes.map(r=>[r.minutes,r.transfers]),[[27,1],[50,0]]);
  const city={id:'test',population:15000,routes:{all:routes[0],alternatives:{all:routes}}};
  assert.equal(routeFor(city,'all','0').minutes,50);
  assert.equal(filterCities([city],{...DEFAULT_FILTERS,transfers:'0',bands:[0]}).length,1);
  assert.equal(filterCities([city],{...DEFAULT_FILTERS,transfers:'0',bands:[1]}).length,0);
});

test('a seed arrival must change trains to enter another corridor; unreachable stops stay absent',()=>{
  const corridors=[{id:'branch',stops:['hub','target'],minutes:[10]},{id:'isolated',stops:['other','unreachable'],minutes:[5]}];
  const arrivals=calculateNetwork([{station:'hub',minutes:30,transfers:1}],corridors,{maxTransfers:2});
  assert.deepEqual(arrivals.get('target').map(r=>[r.minutes,r.transfers]),[[52,2]]);
  assert.equal(arrivals.has('unreachable'),false);
  assert.equal(calculateNetwork([{station:'hub',minutes:30,transfers:1}],corridors,{maxTransfers:1}).has('target'),false);
  assert.throws(()=>calculateNetwork([],[{id:'broken',stops:['a','b'],minutes:[0]}]),/Invalid corridor/);
});

test('expanded data covers new small cities, keeps provenance and excludes the origin',async()=>{
  const read=async name=>JSON.parse(await readFile(new URL(`../data/${name}.json`,import.meta.url),'utf8'));
  const [db,data,manual]=await Promise.all(['cities','routes','routes-manual'].map(read));
  assert.ok(data.routes.length>250);
  const ids=new Set(data.routes.map(r=>r.cityId));
  assert.equal(ids.has(db.cities.find(c=>c.name==='Bielefeld').id),false);
  for(const name of ['Telgte','Rinteln','Brakel','Goslar','Rheine','Bremerhaven'])assert.ok(ids.has(db.cities.find(c=>c.name===name).id),name);
  for(const r of manual.routes){const actual=data.routes.find(a=>a.cityId===r.cityId);for(const mode of ['all','regional'])if(actual[mode].kind!=='official-journey-example')assert.deepEqual(actual[mode],r[mode]);}
  for(const r of data.routes)for(const mode of ['all','regional']){
    assert.ok(r.alternatives[mode].length);
    for(const option of r.alternatives[mode]){
      if(option.kind==='official-journey-example'){
        assert.equal(option.station,option.sample.arrivalStation);
        assert.equal(option.minutes,option.sample.minutes);
        assert.ok(option.source.startsWith('https://www.bahn.de/'));
        continue;
      }
      assert.ok(option.via.length&&option.via.at(-1)===r.station);
      assert.ok(db.cities.some(c=>c.id===option.anchorCityId));
    }
  }
});
