"""Extract city-centre coordinates for the full Destatis roster.

Usage: python scripts/import-locations.py [data/geonames-cities1000.zip]
Coordinates are city centres, not station positions. CC BY 4.0, GeoNames.
"""
import json
import re
import sys
import unicodedata
import zipfile
from collections import defaultdict
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FIPS = {'01':'10','02':'04','03':'06','04':'03','05':'07','06':'05','07':'08','08':'01','09':'02','10':'09','11':'16','12':'11','13':'12','14':'13','15':'14','16':'15'}
ALIASES = {'Halle (Westf.)':'Halle','Halle (Saale)':'Halle (Saale)','Oldenburg (Oldenburg)':'Oldenburg','Dissen am Teutoburger Wald':'Dissen','Burgwedel':'Großburgwedel','Rotenburg a. d. Fulda':'Rotenburg an der Fulda'}
def normalized(value):
    value = unicodedata.normalize('NFKD', value.lower().replace('ß','ss'))
    return re.sub(r'[^a-z0-9]', '', ''.join(c for c in value if not unicodedata.combining(c)))
archive = Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'data/geonames-cities1000.zip'
with zipfile.ZipFile(archive) as z:
    member = next(n for n in z.namelist() if re.fullmatch(r'cities\d+\.txt', n))
    records = [line.split('\t') for line in z.read(member).decode('utf-8').splitlines()]
records = [r for r in records if r[8]=='DE' and r[6]=='P' and r[7]!='PPLX']
index = defaultdict(dict)
for r in records:
    for name in [r[1],r[2],*r[3].split(',')]:
        if name:
            index[(r[10],normalized(name))][r[0]] = r
cities = json.loads((ROOT/'data/cities.json').read_text(encoding='utf-8'))['cities']
route_ids = {r['cityId'] for r in json.loads((ROOT/'data/routes.json').read_text())['routes']}
previous = json.loads((ROOT/'data/locations.json').read_text(encoding='utf-8'))
existing = {r['cityId']:r for r in previous['locations']}
locations, unresolved, missing_routes = [], [], []
for city in cities:
    if city['name']=='Burgwedel':
        # Grossburgwedel, the city's administrative centre; reviewed GeoNames
        # child point https://www.geonames.org/2916893/grossburgwedel.html
        locations.append({'cityId':city['id'],'lat':52.49271,'lon':9.85757,'geonamesId':2916893})
        continue
    if city['name']=='Schloß Holte-Stukenbrock':
        # Composite municipality absent from the populated-place dump.
        # https://www.geonames.org/6557617/schloss-holte-stukenbrock.html
        locations.append({'cityId':city['id'],'lat':51.9,'lon':8.61667,'geonamesId':6557617})
        continue
    target = normalized(ALIASES.get(city['name'],city['name']))
    matches = list(index.get((FIPS[city['id'][:2]],target),{}).values())
    if not matches:
        # Accept shortened regional qualifiers only if unique in the state.
        short = re.split(r'\s*\(|\s+(?:am|an der|im|ob der)\s+',city['name'])[0]
        matches = list(index.get((FIPS[city['id'][:2]],normalized(short)),{}).values())
    if len(matches)!=1:
        county = [r for r in matches if r[12]==city['id'][:5] or r[11]==city['id'][:5]]
        if len(county)==1:
            matches = county
    if len(matches)!=1:
        if city['id'] in existing:
            locations.append(existing[city['id']])
            continue
        unresolved.append({'cityId':city['id'],'name':city['name'],'state':city['state'],'status':'ambiguous' if matches else 'missing','matches':[{'id':int(r[0]),'name':r[1]} for r in matches]})
        if city['id'] in route_ids:
            missing_routes.append(city['name'])
        continue
    r=matches[0]
    locations.append({'cityId':city['id'],'lat':float(r[4]),'lon':float(r[5]),'geonamesId':int(r[0])})
report={'totalCities':len(cities),'matchedCities':len(locations),'unresolved':unresolved}
(ROOT/'data/location-match-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
if missing_routes:
    raise ValueError(f"Routed cities need reviewed coordinates: {', '.join(missing_routes)}")
output={'meta':{**previous['meta'],'importedAt':date.today().isoformat(),'dataset':archive.name,'matchMethod':'Normalized name and state; county for ambiguous matches; reviewed existing points retained. Unresolved roster entries reported separately.'},'locations':locations}
(ROOT/'data/locations.json').write_text(json.dumps(output,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print(f'Imported {len(locations)} city locations; {len(unresolved)} unresolved; all {len(route_ids)} routed cities covered.')
