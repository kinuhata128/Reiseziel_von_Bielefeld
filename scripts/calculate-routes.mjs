import {readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {CORRIDORS, TRANSIT_STOPS, TRANSFER_MINUTES, NETWORK_SOURCES} from './rail-network.mjs';
import {applyReviewedRoutes} from './reviewed-routes.mjs';

// Multi-label search: keep the fastest arrival for each station, incoming
// corridor and transfer count. A slower route can qualify under a tighter cap.
export function calculateNetwork(seeds, corridors, {maxTransfers=5, transferMinutes=12}={}) {
  const graph=new Map();
  for(const {id,stops,minutes} of corridors){
    if(minutes.length!==stops.length-1||minutes.some(n=>!Number.isInteger(n)||n<=0))throw new Error(`Invalid corridor ${id}`);
    for(let i=1;i<stops.length;i++)for(const [from,to] of [[stops[i-1],stops[i]],[stops[i],stops[i-1]]]){
      if(!graph.has(from))graph.set(from,[]);
      graph.get(from).push({to,line:id,minutes:minutes[i-1]});
    }
  }
  const best=new Map(),queue=[];
  const key=r=>JSON.stringify([r.station,r.line,r.transfers]);
  function offer(r){const k=key(r);if(r.transfers<=maxTransfers&&(!best.has(k)||r.minutes<best.get(k).minutes)){best.set(k,r);queue.push(r);}}
  for(const seed of seeds)offer({...seed,line:null,lines:[],via:[seed.station]});
  while(queue.length){
    queue.sort((a,b)=>b.minutes-a.minutes);
    const current=queue.pop();if(best.get(key(current))!==current)continue;
    for(const edge of graph.get(current.station)||[]){
      const change=current.line!==edge.line&&(current.line!==null||current.minutes>0);
      offer({...current,station:edge.to,line:edge.line,minutes:current.minutes+edge.minutes+(change?transferMinutes:0),transfers:current.transfers+Number(change),lines:current.line===edge.line?current.lines:[...current.lines,edge.line],via:[...current.via,edge.to]});
    }
  }
  const arrivals=new Map();
  for(const r of best.values()){
    const rows=arrivals.get(r.station)||[];rows.push(r);arrivals.set(r.station,rows);
  }
  for(const [station,rows] of arrivals){
    rows.sort((a,b)=>a.minutes-b.minutes||a.transfers-b.transfers);
    const frontier=[];
    for(const r of rows)if(!frontier.some(a=>a.minutes<=r.minutes&&a.transfers<=r.transfers))frontier.push(r);
    arrivals.set(station,frontier.map(({line,station,...r})=>r));
  }
  return arrivals;
}

export async function buildRoutes(){
  const read=async file=>JSON.parse(await readFile(new URL(`../data/${file}.json`,import.meta.url),'utf8'));
  const [database,manual,review]=await Promise.all(['cities','routes-manual','route-time-review'].map(read));
  const reviewById=new Map(review.entries.map(e=>[e.cityId,e]));
  const manualById=new Map(manual.routes.map(r=>[r.cityId,r]));
  const stations=new Map(),cityStations=new Map(),skipped=[];
  for(const city of database.cities){const r=manualById.get(city.id);if(r){stations.set(city.name,r.station);cityStations.set(city.id,r.station);}}
  stations.set('Bielefeld','Bielefeld Hbf');
  function resolve(token){
    const [name,explicit]=token.split('|');
    if(TRANSIT_STOPS.has(name))return explicit||name;
    const matches=database.cities.filter(c=>c.name===name);
    if(matches.length!==1){skipped.push(name);return null;}
    const city=matches[0],station=explicit||stations.get(name)||name;
    if(!cityStations.has(city.id))cityStations.set(city.id,station);
    stations.set(name,stations.get(name)||station);
    return station;
  }
  const corridors=[];
  for(const [id,sequence,minutes] of CORRIDORS){
    const stops=sequence.split(';').map(resolve);
    // Never bridge an unresolved city or silently turn it into a new rail edge.
    if(stops.some(s=>!s))throw new Error(`Unresolved city in ${id}: ${[...new Set(skipped)].join(', ')}`);
    corridors.push({id,stops,minutes});
  }
  const byMode={};
  for(const mode of ['all','regional']){
    const seeds=manual.routes.map(r=>({station:r.station,...r[mode],anchorCityId:r.cityId}));
    seeds.push({station:'Bielefeld Hbf',minutes:0,transfers:0,anchorCityId:database.cities.find(c=>c.name==='Bielefeld').id});
    byMode[mode]=calculateNetwork(seeds,corridors,{transferMinutes:TRANSFER_MINUTES});
  }
  const routes=[];
  for(const city of database.cities){
    if(city.name==='Bielefeld')continue;
    const station=cityStations.get(city.id);if(!station)continue;
    const original=manualById.get(city.id);
    const route={cityId:city.id,station,kind:original?'manual-estimate':'network-estimate',alternatives:{}};
    for(const mode of ['all','regional']){
      const options=byMode[mode].get(station);
      if(!options?.length)throw new Error(`No ${mode} route to ${city.name}`);
      // Preserve the established manual default; retain other graph options
      // for explicit transfer caps, without silently replacing curated times.
      route[mode]=original?original[mode]:options[0];
      route.alternatives[mode]=options;
    }
    applyReviewedRoutes(route,reviewById.get(city.id),review.meta.reviewedAt);
    routes.push(route);
  }
  const output={meta:{...manual.meta,kind:'manual-and-network-estimates',method:'Manual reference estimates plus bidirectional regional corridor graph. Edge times and 12-minute transfer allowance are indicative, not sampled timetables. Multi-label search preserves faster and fewer-transfer alternatives. All-train mode can start from manual long-distance anchors; regional mode uses regional anchors only.',networkSources:NETWORK_SOURCES,transferAllowanceMinutes:TRANSFER_MINUTES,maxCalculatedTransfers:5,corridors:corridors.length,manualDestinations:manual.routes.length,calculatedDestinations:routes.length-manual.routes.length},routes};
  output.meta.reviewedAt=review.meta.reviewedAt;
  output.meta.kind='official-examples-and-estimates';
  output.meta.officialExampleCities=routes.filter(r=>r.all.kind==='official-journey-example').length;
  output.meta.officialRegionalExampleCities=routes.filter(r=>r.regional.kind==='official-journey-example').length;
  output.meta.method+=' Cities with population >= 100000 use matching official DB dated rail-only journey examples where available, including separate sampled alternatives for transfer caps. Other modes and synthetic corridor routes remain estimates. Examples are not proof of the fastest journey or of availability on other dates; sampled anchors are not used to extrapolate corridor times.';
  await writeFile(new URL('../data/routes.json',import.meta.url),JSON.stringify(output,null,2)+'\n');
  console.log(`Prepared ${routes.length} destinations (${manual.routes.length} manual, ${routes.length-manual.routes.length} calculated).`);
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await buildRoutes();
