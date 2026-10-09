import {readFile, writeFile} from 'node:fs/promises';

// Snapshot the official route-page examples, not an exhaustive journey search.
// Keep dates, stations and products: a headline duration alone is insufficient.
const read = async name => JSON.parse(await readFile(new URL(`../data/${name}.json`, import.meta.url), 'utf8'));
const [db, routes] = await Promise.all(['cities', 'routes'].map(read));
const slugOverrides = {'Frankfurt am Main':'frankfurt','Oldenburg (Oldenburg)':'oldenburg','Halle (Saale)':'halle','Mülheim an der Ruhr':'muelheim-an-der-ruhr','Recklinghausen':'recklinghausen','Salzgitter':'salzgitter'};
const slug = name => slugOverrides[name] || name.toLowerCase().replaceAll('ä','ae').replaceAll('ö','oe').replaceAll('ü','ue').replaceAll('ß','ss').replaceAll(' ','-');
const clean = text => text.replace(/<[^>]*>/g,' ').replace(/&#10;|&nbsp;|\s+/g,' ').replaceAll('&amp;','&').trim();
const entries = [];
for (const city of db.cities.filter(c => c.population >= 100000)) {
  const route = routes.routes.find(r => r.cityId === city.id);
  const entry = {cityId:city.id, name:city.name, population:city.population, status:route?'pending':city.name==='Bielefeld'?'origin-excluded':'no-route-data'};
  if (route) {
    entry.previous = {station:route.station, all:route.all, regional:route.regional};
    entry.source = `https://www.bahn.de/reisen/view/verbindung/bielefeld/${slug(city.name)}.shtml`;
    try {
      const response = await fetch(entry.source, {signal:AbortSignal.timeout(20000)});
      const html = await response.text();
      entry.httpStatus = response.status;
      entry.sourceUpdatedAt = html.match(/Mögliche Verbindungen, Stand: ([^<]+)/)?.[1] || null;
      entry.samples = [];
      const table = html.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1] || '';
      for (const row of table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
        const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m=>clean(m[1]));
        const departure = cells[0]?.match(/^(.*?) (\d{2}\.\d{2}\.\d{2}) (\d{2}:\d{2})$/);
        const arrival = cells[1]?.match(/^(.*?) (\d{2}\.\d{2}\.\d{2}) (\d{2}:\d{2})$/);
        const duration = cells[2]?.match(/^(\d+):(\d{2})$/);
        if (!departure || !arrival || !duration || !/^\d+$/.test(cells[3])) continue;
        const iso = d => `20${d.slice(6)}-${d.slice(3,5)}-${d.slice(0,2)}`;
        const sample = {departureStation:departure[1], departureDate:iso(departure[2]), departureTime:departure[3], arrivalStation:arrival[1], arrivalDate:iso(arrival[2]), arrivalTime:arrival[3], minutes:Number(duration[1])*60+Number(duration[2]), transfers:Number(cells[3]), products:cells[4].split(',').map(s=>s.trim())};
        const elapsed = (Date.parse(`${sample.arrivalDate}T${sample.arrivalTime}:00Z`)-Date.parse(`${sample.departureDate}T${sample.departureTime}:00Z`))/60000;
        if (elapsed !== sample.minutes) throw new Error('Inconsistent duration');
        entry.samples.push(sample);
      }
      entry.status = entry.samples.length?'official-examples-reviewed':'no-official-examples';
    } catch (error) {entry.status='source-unavailable';entry.error=error.message;}
    console.log(`${city.name}: ${entry.status} ${entry.samples?.map(s=>`${s.minutes}/${s.transfers} ${s.products}`).join('; ')||''}`);
  }
  entries.push(entry);
}
await writeFile(new URL('../data/route-time-review.json',import.meta.url),JSON.stringify({meta:{reviewedAt:'2026-10-09',populationThreshold:100000,origin:'Bielefeld Hbf',method:'Official DB route-page example journeys. Samples vary by date and are not an exhaustive timetable search; regional examples are not proof of the fastest regional journey. Missing route data is not evidence of unreachability.'},entries},null,2)+'\n');
