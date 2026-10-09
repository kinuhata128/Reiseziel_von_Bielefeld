import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';

const read=async name=>JSON.parse(await readFile(new URL(`../data/${name}.json`,import.meta.url),'utf8'));

export async function createSimplifier(){
  const dictionary=new Map();
  for(const file of ['TSCharacters.txt','TSPhrases.txt']){
    const text=await readFile(new URL(`./vendor/opencc/${file}`,import.meta.url),'utf8');
    for(const line of text.split(/\r?\n/)){
      if(!line||line.startsWith('#'))continue;
      const [key,values]=line.split('\t');if(key&&values)dictionary.set(key,values.split(' ')[0]);
    }
  }
  const lengths=[...new Set([...dictionary.keys()].map(k=>[...k].length))].sort((a,b)=>b-a);
  return value=>{
    const chars=[...value.normalize('NFC')],result=[];
    for(let i=0;i<chars.length;){
      let matched=false;
      for(const size of lengths){
        const key=chars.slice(i,i+size).join('');
        if(dictionary.has(key)){result.push(dictionary.get(key));i+=size;matched=true;break;}
      }
      if(!matched)result.push(chars[i++]);
    }
    return result.join('');
  };
}

export function municipalityKey(id){
  if(!/^\d{12}$/.test(id))throw new Error(`Invalid ARS: ${id}`);
  return id.slice(0,5)+id.slice(-3);
}

export async function buildCityNames(){
  const [database,raw,overrides,maps,simplify]=await Promise.all([read('cities'),read('wikidata-city-labels'),read('city-name-overrides'),read('google-maps-city-checks'),createSimplifier()]);
  const grouped=new Map(),checked=new Map(maps.checks.map(c=>[c.cityId,c]));
  for(const r of raw.bindings){const rows=grouped.get(r.ags.value)||[];rows.push(r);grouped.set(r.ags.value,rows);}
  const ids=new Set(database.cities.map(c=>c.id));
  for(const id of [...Object.keys(overrides.overrides),...checked.keys()])if(!ids.has(id))throw new Error(`Unknown override/check city ${id}`);
  if(checked.size!==maps.checks.length)throw new Error('Duplicate Google Maps checks');
  const normalizeGoogle=s=>simplify(s).trim().replace(/\s*\(([^)]+)\)/g,'（$1）');
  const entries=[],errors=[];
  for(const city of database.cities){
    const rows=grouped.get(municipalityKey(city.id))||[];
    const items=new Set(rows.map(r=>r.item.value));
    if(items.size!==1){errors.push(`${city.id} ${city.name}: ${items.size} matching entities`);continue;}
    const selected=rows.find(r=>r.label['xml:lang']==='zh-cn')||rows.find(r=>r.label['xml:lang']==='zh-hans')||rows.find(r=>r.label['xml:lang']==='zh');
    if(!selected){errors.push(`${city.name}: no Chinese label`);continue;}
    // Parenthetical Wikipedia-style qualifiers are retained but normalized.
    const normalize=normalizeGoogle;
    const sourceName=normalize(selected.label.value),google=checked.get(city.id),override=overrides.overrides[city.id];
    if(google&&google.name!==city.name)throw new Error(`Google Maps check name mismatch ${city.id}`);
    const nameZh=normalize(override?.nameZh||google?.nameZh||sourceName);
    if(!/\p{Script=Han}/u.test(nameZh)||/[A-Za-z0-9]/.test(nameZh)){errors.push(`${city.name}: invalid Chinese name ${nameZh}`);continue;}
    const aliases=[...new Set([sourceName,...rows.map(r=>normalize(r.label.value)),...(google?.nameZh?[normalize(google.nameZh)]:[]),...(override?.aliases||[]).map(normalize)])].filter(n=>n!==nameZh);
    entries.push({cityId:city.id,name:city.name,state:city.state,nameZh,aliases,wikidataId:selected.item.value.split('/').at(-1),sourceName,sourceLanguage:selected.label['xml:lang'],sourceUrl:selected.item.value.replace('http:','https:'),googleMapsChecked:!!google,googleMapsName:google?.nameZh||null,googleMapsUrl:google?.url||null,displaySource:override?(override.source||'reviewed-override'):google?.nameZh?'google-maps':'wikidata',reviewNote:override?.note||null});
  }
  if(errors.length)throw new Error(errors.join('\n'));
  const byId=Object.fromEntries(entries.map(e=>[e.cityId,e.nameZh]));
  const aliasesById=Object.fromEntries(entries.filter(e=>e.aliases.length).map(e=>[e.cityId,e.aliases]));
  const nameGroups=new Map();for(const e of entries){const rows=nameGroups.get(e.name)||[];rows.push(e);nameGroups.set(e.name,rows);}
  // Name-only compatibility map omits ambiguous names with differing labels.
  const byName=Object.fromEntries([...nameGroups].filter(([,rows])=>new Set(rows.map(r=>r.nameZh)).size===1).map(([name,rows])=>[name,rows[0].nameZh]));
  const source={meta:{importedAt:raw.retrievedAt,source:'Wikidata Chinese labels matched by P439 (AGS), with explicit user corrections and partial Google Maps review.',license:'CC0 for Wikidata labels',languagePreference:['zh-cn','zh-hans','zh'],conversion:'OpenCC 1.1.9 TSPhrases/TSCharacters dictionaries',totalCities:entries.length,googleMapsChecked:checked.size,googleMapsNationallyVerified:false},entries};
  await writeFile(new URL('../data/city-names-zh.json',import.meta.url),JSON.stringify(source,null,2)+'\n');
  const report={totalCities:entries.length,missingNames:[],ambiguousEntities:[],googleMapsChecked:checked.size,googleMapsNotChecked:entries.length-checked.size,googleMapsDifferences:entries.filter(e=>e.googleMapsName&&e.googleMapsName!==e.sourceName).map(e=>({cityId:e.cityId,name:e.name,wikidata:e.sourceName,googleMaps:e.googleMapsName})),reviewedExceptions:entries.filter(e=>e.googleMapsName&&e.nameZh!==normalizeGoogle(e.googleMapsName)).map(e=>({cityId:e.cityId,name:e.name,nameZh:e.nameZh,googleMaps:e.googleMapsName,note:e.reviewNote})),homonyms:[...nameGroups].filter(([,rows])=>rows.length>1).map(([name,rows])=>({name,cities:rows.map(e=>({cityId:e.cityId,state:e.state,nameZh:e.nameZh}))})),issues:errors};
  await writeFile(new URL('../data/city-name-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
  const module=`// Generated by scripts/import-city-names.mjs; edit source overrides instead.\n// Source details and partial Google Maps checks: data/city-names-zh.json.\nexport const CITY_NAMES_ZH_BY_ID = Object.freeze(${JSON.stringify(byId,null,2)});\nexport const CITY_NAMES_ZH = Object.freeze(${JSON.stringify(byName,null,2)});\nexport const CITY_NAME_ALIASES_ZH_BY_ID = Object.freeze(${JSON.stringify(aliasesById,null,2)});\nexport function cityNameZh(city) { return CITY_NAMES_ZH_BY_ID[city.id] ?? CITY_NAMES_ZH[city.name] ?? ''; }\nexport function cityNameAliasesZh(city) { return CITY_NAME_ALIASES_ZH_BY_ID[city.id] ?? []; }\n`;
  await writeFile(new URL('../assets/city-names.js',import.meta.url),module);
  console.log(JSON.stringify({totalCities:entries.length,googleMapsChecked:checked.size,googleMapsDifferences:report.googleMapsDifferences.length,homonymGroups:report.homonyms.length,issues:errors},null,2));
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await buildCityNames();
