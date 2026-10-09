import {readFile} from 'node:fs/promises';
import {timeBand} from '../core.js';
import {CITY_NAMES_ZH_BY_ID,cityNameZh} from '../assets/city-names.js';
const read=async name=>JSON.parse(await readFile(new URL(`../data/${name}.json`,import.meta.url),'utf8'));
const [database,railway,geo,chinese]=await Promise.all(['cities','routes','locations','city-names-zh'].map(read));
const cities=new Set(database.cities.map(c=>c.id)),routes=new Set(railway.routes.map(r=>r.cityId)),locations=new Set(geo.locations.map(l=>l.cityId));
const issues=[];
const nameRows=new Map(chinese.entries.map(e=>[e.cityId,e]));
if(nameRows.size!==chinese.entries.length)issues.push('Duplicate Chinese-name identifiers');
for(const c of database.cities){
  const e=nameRows.get(c.id);
  if(!e||e.name!==c.name||e.state!==c.state||e.nameZh!==cityNameZh(c)||!/\p{Script=Han}/u.test(e.nameZh))issues.push(`Missing or inconsistent Chinese name: ${c.id}`);
}
for(const id of Object.keys(CITY_NAMES_ZH_BY_ID))if(!cities.has(id))issues.push(`Unknown Chinese-name city: ${id}`);
if(cities.size!==database.cities.length)issues.push('Duplicate city identifiers');
if(routes.size!==railway.routes.length)issues.push('Duplicate route identifiers');
if(locations.size!==geo.locations.length)issues.push('Duplicate location identifiers');
for(const r of railway.routes){
  if(!cities.has(r.cityId))issues.push(`Unknown city: ${r.cityId}`);
  if(!locations.has(r.cityId))issues.push(`Missing coordinates: ${r.cityId}`);
  for(const mode of ['all','regional'])if(!Number.isInteger(r[mode]?.minutes)||r[mode].minutes<=0||!Number.isInteger(r[mode]?.transfers)||r[mode].transfers<0)issues.push(`Invalid route ${r.cityId}: ${mode}`);
  for(const mode of ['all','regional'])for(const option of r.alternatives?.[mode]||[]){
    if(!Number.isInteger(option.minutes)||option.minutes<=0||!Number.isInteger(option.transfers)||option.transfers<0||option.transfers>railway.meta.maxCalculatedTransfers)issues.push(`Invalid alternative ${r.cityId}: ${mode}`);
    if(option.kind==='official-journey-example'){
      if(option.sample?.arrivalStation!==option.station||option.sample?.minutes!==option.minutes||option.sample?.transfers!==option.transfers||option.sample?.products.includes('BUS')||!option.source?.startsWith('https://www.bahn.de/'))issues.push(`Invalid official example ${r.cityId}: ${mode}`);
    }else if(!cities.has(option.anchorCityId)||option.via?.at(-1)!==r.station)issues.push(`Invalid calculation trace ${r.cityId}: ${mode}`);
  }
}
for(const l of geo.locations){
  if(!cities.has(l.cityId)||!Number.isFinite(l.lat)||!Number.isFinite(l.lon)||l.lat<47||l.lat>55.2||l.lon<5||l.lon>16||!Number.isInteger(l.geonamesId))issues.push(`Invalid coordinates: ${l.cityId}`);
}
const result={totalCities:database.cities.length,withChineseNames:nameRows.size,googleMapsNamesChecked:chinese.meta.googleMapsChecked,withTravelEstimates:routes.size,withoutTravelEstimates:database.cities.filter(c=>!routes.has(c.id)).length,withCoordinates:locations.size,verifiedTimetables:railway.meta.verified===true,withinFourHours:Object.fromEntries(['all','regional'].map(mode=>[mode,railway.routes.filter(r=>timeBand(r[mode].minutes)>=0).length])),issues};
result.officialJourneyExamples=Object.fromEntries(['all','regional'].map(mode=>[mode,railway.routes.filter(r=>r[mode].kind==='official-journey-example').length]));
console.log(JSON.stringify(result,null,2));
if(issues.length)process.exitCode=1;
