import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {CITY_NAMES_ZH_BY_ID,CITY_NAMES_ZH,cityNameZh,cityNameAliasesZh} from '../assets/city-names.js';
import {createSimplifier,municipalityKey} from '../scripts/import-city-names.mjs';

const read=async name=>JSON.parse(await readFile(new URL(`../data/${name}.json`,import.meta.url),'utf8'));

test('every official city has a sourced Chinese name matched by municipality ID',async()=>{
  const [db,names,raw]=await Promise.all(['cities','city-names-zh','wikidata-city-labels'].map(read));
  const rows=new Map(names.entries.map(e=>[e.cityId,e]));
  assert.equal(rows.size,db.cities.length);
  assert.equal(names.entries.length,db.cities.length);
  assert.equal(Object.keys(CITY_NAMES_ZH_BY_ID).length,db.cities.length);
  for(const c of db.cities){
    const e=rows.get(c.id);
    assert.ok(e,`missing ${c.name}`);
    assert.equal(e.name,c.name);assert.equal(e.state,c.state);
    assert.match(e.nameZh,/\p{Script=Han}/u);assert.doesNotMatch(e.nameZh,/[A-Za-z0-9]/);
    assert.equal(cityNameZh(c),e.nameZh);
    assert.equal(new Set(e.aliases).size,e.aliases.length);
    assert.ok(!e.aliases.includes(e.nameZh));
    assert.deepEqual(cityNameAliasesZh(c),e.aliases);
    assert.ok(raw.bindings.some(r=>r.ags.value===municipalityKey(c.id)&&r.item.value.endsWith('/'+e.wikidataId)),`source entity mismatch ${c.name}`);
  }
});

test('Lübbecke remains distinct from Lübeck and the user correction is preserved',async()=>{
  const db=await read('cities');
  assert.equal(cityNameZh(db.cities.find(c=>c.name==='Lübbecke')),'吕伯克');
  assert.equal(cityNameZh(db.cities.find(c=>c.name==='Lübeck')),'吕贝克');
  assert.ok(!cityNameAliasesZh(db.cities.find(c=>c.name==='Lübbecke')).includes('吕贝克'));
});

test('ID-specific labels take priority over a same-name fallback',async()=>{
  const db=await read('cities');
  const towns=db.cities.filter(c=>c.name==='Freudenberg');
  assert.equal(towns.length,2);
  assert.notEqual(cityNameZh(towns[0]),cityNameZh(towns[1]));
  assert.equal(CITY_NAMES_ZH.Freudenberg,undefined);
  assert.equal(cityNameZh({...towns[0],name:'intentionally different name'}),CITY_NAMES_ZH_BY_ID[towns[0].id]);
});

test('maintenance normalizes traditional characters without translating German strings',async()=>{
  const simplify=await createSimplifier();
  assert.equal(simplify('杜塞爾多夫'),'杜塞尔多夫');
  assert.equal(simplify('易北河畔韋爾本'),'易北河畔韦尔本');
  assert.equal(simplify('黑爾默河畔黑林根'),'黑尔默河畔黑林根');
  assert.equal(simplify('Lübbecke'),'Lübbecke');
  assert.equal(municipalityKey('057700020020'),'05770020');
  assert.throws(()=>municipalityKey('invalid'),/Invalid ARS/);
});

test('map review has explicit coverage and every observed city matches the official roster',async()=>{
  const [db,names,maps,audit]=await Promise.all(['cities','city-names-zh','google-maps-city-checks','city-name-audit'].map(read));
  assert.equal(names.meta.googleMapsNationallyVerified,false);
  assert.equal(audit.googleMapsChecked,maps.checks.length);
  assert.equal(audit.googleMapsChecked+audit.googleMapsNotChecked,db.cities.length);
  assert.equal(new Set(maps.checks.map(c=>c.cityId)).size,maps.checks.length);
  assert.deepEqual(audit.issues,[]);
  for(const check of maps.checks){
    const c=db.cities.find(c=>c.id===check.cityId);assert.equal(check.name,c.name);
    assert.ok(check.url.startsWith('https://www.google.com/maps?'));
    const e=names.entries.find(e=>e.cityId===check.cityId);assert.equal(e.googleMapsChecked,true);
    assert.equal(e.googleMapsName,check.nameZh);
  }
});

test('all route cities have a recorded map review and unlocalized titles fall back to a sourced name',async()=>{
  const [routes,maps,names]=await Promise.all(['routes','google-maps-city-checks','city-names-zh'].map(read));
  const checked=new Set(maps.checks.map(c=>c.cityId));
  for(const r of routes.routes)assert.ok(checked.has(r.cityId),`route city not reviewed ${r.cityId}`);
  const unlocalized=names.entries.find(e=>e.name==='Rotenburg a. d. Fulda');
  assert.equal(unlocalized.googleMapsChecked,true);assert.equal(unlocalized.googleMapsName,null);
  assert.equal(unlocalized.displaySource,'wikidata');assert.match(unlocalized.nameZh,/\p{Script=Han}/u);
});

test('observed map variants become search aliases while reviewed incomplete titles keep full city names',async()=>{
  const names=await read('city-names-zh');
  const wolfsburg=names.entries.find(e=>e.name==='Wolfsburg');
  assert.equal(wolfsburg.nameZh,'沃尔夫斯堡');assert.ok(wolfsburg.aliases.includes('沃尔夫'));
  const solingen=names.entries.find(e=>e.name==='Solingen');
  assert.equal(solingen.nameZh,'佐林根');assert.ok(solingen.aliases.includes('索林根'));
  for(const e of names.entries.filter(e=>e.googleMapsName&&e.nameZh!==e.googleMapsName))assert.ok(e.reviewNote,`unexplained Google Maps exception ${e.name}`);
});
