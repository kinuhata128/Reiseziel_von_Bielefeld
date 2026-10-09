import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {reviewedOptions} from '../scripts/reviewed-routes.mjs';
import {routeFor,filterCities,DEFAULT_FILTERS} from '../core.js';
const read=async name=>JSON.parse(await readFile(new URL(`../data/${name}.json`,import.meta.url),'utf8'));

test('Berlin construction reference remains in the 3–4 hour band for every transfer cap',async()=>{
  const [db,data]=await Promise.all(['cities','routes'].map(read));
  const city={...db.cities.find(c=>c.name==='Berlin'),routes:data.routes.find(r=>r.cityId==='110000000000')};
  for(const transfers of ['any','0','1','2']){
    assert.equal(routeFor(city,'all',transfers).minutes,220);
    assert.equal(filterCities([city],{...DEFAULT_FILTERS,bands:[2],transfers}).length,0);
    assert.equal(filterCities([city],{...DEFAULT_FILTERS,bands:[3],transfers}).length,1);
  }
});

test('every existing large-city all-train route uses a dated official example, regional modes stay honest',async()=>{
  const [db,data,review]=await Promise.all(['cities','routes','route-time-review'].map(read));
  assert.equal(review.entries.length,db.cities.filter(c=>c.population>=100000).length);
  for(const entry of review.entries){
    const route=data.routes.find(r=>r.cityId===entry.cityId);
    if(!route)continue;
    assert.equal(route.all.kind,'official-journey-example',entry.name);
    for(const mode of ['all','regional']){
      const samples=reviewedOptions(entry,mode,review.meta.reviewedAt);
      if(!samples.length){assert.equal(route.review.modes[mode],'estimate-no-matching-rail-example');continue;}
      assert.deepEqual(route[mode],samples[0]);
      assert.deepEqual(route.alternatives[mode],samples);
      for(const option of samples){
        const s=option.sample;
        assert.equal((Date.parse(`${s.arrivalDate}T${s.arrivalTime}Z`)-Date.parse(`${s.departureDate}T${s.departureTime}Z`))/60000,s.minutes);
      }
    }
  }
});

test('rail-only modes reject buses, unknown products, expired examples and ICE in regional mode',()=>{
  const sample={departureStation:'Bielefeld Hbf',departureDate:'2026-10-18',arrivalStation:'target',minutes:100,transfers:1,products:['NX']};
  const entry={source:'https://www.bahn.de/',samples:[sample,{...sample,minutes:10,products:['BUS','NX']},{...sample,minutes:20,products:['UNKNOWN']},{...sample,minutes:30,departureDate:'2026-09-18'},{...sample,minutes:40,products:['ICE']}]};
  assert.deepEqual(reviewedOptions(entry,'all','2026-10-09').map(r=>r.minutes),[40,100]);
  assert.deepEqual(reviewedOptions(entry,'regional','2026-10-09').map(r=>r.minutes),[100]);
});

test('samples preserve their arrival station and slower fewer-transfer alternatives',async()=>{
  const data=await read('routes');
  const bremerhaven=data.routes.find(r=>r.cityId==='040120000000');
  assert.equal(routeFor({routes:bremerhaven},'all','1').minutes,199);
  const leverkusen=data.routes.find(r=>r.cityId==='053160000000');
  assert.equal(leverkusen.all.station,'Leverkusen Mitte');
  assert.equal(leverkusen.regional.station,'Leverkusen Mitte');
});
