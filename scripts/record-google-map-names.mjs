import {readFile,writeFile} from 'node:fs/promises';
const read=async name=>JSON.parse(await readFile(new URL(`../data/${name}.json`,import.meta.url),'utf8'));
const [database,observed]=await Promise.all(['cities','google-maps-name-pairs'].map(read));
const byId=new Map(database.cities.map(c=>[c.id,c]));
const checks=[];
for(const [cityId,nameZh] of observed.names){
  const city=byId.get(cityId);if(!city)throw new Error(`Unknown reviewed city ${cityId}`);
  checks.push({cityId,name:city.name,nameZh,status:'chinese-label-observed',url:'https://www.google.com/maps?q='+encodeURIComponent(`${city.name}, ${city.state}, Germany`)+'&hl=zh-CN'});
}
for(const row of observed.unlocalized){
  const city=byId.get(row.cityId);if(!city)throw new Error(`Unknown reviewed city ${row.cityId}`);
  checks.push({...row,name:city.name,nameZh:null,url:'https://www.google.com/maps?q='+encodeURIComponent(`${city.name}, ${city.state}, Germany`)+'&hl=zh-CN'});
}
if(new Set(checks.map(c=>c.cityId)).size!==checks.length)throw new Error('Duplicate reviewed cities');
await writeFile(new URL('../data/google-maps-city-checks.json',import.meta.url),JSON.stringify({meta:observed.meta,checks},null,2)+'\n');
console.log(`Recorded ${checks.length} Google Maps checks; ${observed.unlocalized.length} without a Chinese title.`);
