import {readFile,writeFile} from 'node:fs/promises';

// P439 (AGS) identifies the municipality, rather than a name-only match.
const query=`SELECT ?item ?ags ?label WHERE {
  ?item wdt:P439 ?ags; rdfs:label ?label.
  FILTER(LANG(?label) IN ("zh", "zh-hans", "zh-cn"))
}`;
const url='https://query.wikidata.org/sparql?format=json&query='+encodeURIComponent(query);
const response=await fetch(url,{headers:{'Accept':'application/sparql-results+json','User-Agent':'BielefeldCityNames/1.0 (local data maintenance)'},signal:AbortSignal.timeout(55000)});
if(!response.ok)throw new Error(`Wikidata labels: HTTP ${response.status}`);
const result=await response.json();
const cities=JSON.parse(await readFile(new URL('../data/cities.json',import.meta.url),'utf8')).cities;
const wanted=new Set(cities.map(c=>c.id.slice(0,5)+c.id.slice(-3)));
const bindings=result.results.bindings.filter(r=>wanted.has(r.ags.value));
await writeFile(new URL('../data/wikidata-city-labels.json',import.meta.url),JSON.stringify({retrievedAt:new Date().toISOString().slice(0,10),source:'Wikidata',license:'CC0',query,bindings},null,2)+'\n');
const keys=new Set(bindings.map(r=>r.ags.value));
console.log(JSON.stringify({labels:bindings.length,matchedCities:cities.filter(c=>keys.has(c.id.slice(0,5)+c.id.slice(-3))).length}));
