export const SIZE_OPTIONS = ['small','medium','large','metro'];
export const DEFAULT_FILTERS = { bands: [0,1], sizes: [...SIZE_OPTIONS], mode:'all', transfers:'any', excludeVisited:true };
export function timeBand(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 240) return -1;
  return minutes <= 60 ? 0 : minutes <= 120 ? 1 : minutes <= 180 ? 2 : 3;
}
export function populationBand(n) { return n < 20000 ? 'small' : n < 100000 ? 'medium' : n < 500000 ? 'large' : 'metro'; }
export function routeFor(city, mode, transfers = 'any') {
  const route = city.routes?.[mode] ?? null;
  if (transfers === 'any') return route;
  const options = [route, ...(city.routes?.alternatives?.[mode] ?? [])].filter(r => r && r.transfers <= Number(transfers));
  options.sort((a,b) => a.minutes-b.minutes || a.transfers-b.transfers);
  return options[0] ?? null;
}
export function filterCities(cities, filters, visited = []) {
  const seen = new Set(visited);
  return cities.filter(city => {
    const route = routeFor(city, filters.mode, filters.transfers);
    return route && filters.bands.includes(timeBand(route.minutes)) &&
      filters.sizes.includes(populationBand(city.population)) &&
      (filters.transfers === 'any' || route.transfers <= Number(filters.transfers)) &&
      (!filters.excludeVisited || !seen.has(city.id));
  });
}
// Rejection sampling avoids modulo bias. Each eligible city gets one ticket.
export function uniformIndex(length, random = () => crypto.getRandomValues(new Uint32Array(1))[0]) {
  if (!Number.isInteger(length) || length < 1 || length > 0x100000000) throw new RangeError('Invalid pool size');
  const ceiling = Math.floor(0x100000000 / length) * length;
  let value;
  do { value = random(); } while (value >= ceiling);
  return value % length;
}
export function pickCity(pool, drawn, random) {
  if (!pool.length) return {city:null, restarted:false};
  let available = pool.filter(city => !drawn.has(city.id));
  const restarted = !available.length;
  if (restarted) { drawn.clear(); available = pool; }
  const city = available[uniformIndex(available.length, random)];
  drawn.add(city.id);
  return {city, restarted};
}
export function formatDuration(minutes) {
  return minutes < 60 ? `${minutes} 分钟` : `${Math.floor(minutes / 60)} 小时${minutes % 60 ? ` ${minutes % 60} 分` : ''}`;
}
export const MAP_ORIGIN = Object.freeze({lat:52.03333,lon:8.53333});
export function mercatorPoint(location) {
  if(!Number.isFinite(location.lat)||!Number.isFinite(location.lon)||Math.abs(location.lat)>85||Math.abs(location.lon)>180)throw new RangeError('Invalid map coordinates');
  const sin=Math.sin(location.lat*Math.PI/180);
  return {x:256*(location.lon+180)/360,y:256*(.5-Math.log((1+sin)/(1-sin))/(4*Math.PI))};
}
// Choose the closest whole zoom that fits the destination while the origin
// stays at the viewport's centre. Reserve room for the pin and its label.
export function centeredMapZoom(location,width,height) {
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)throw new RangeError('Invalid map size');
  if(!location)return 9;
  const origin=mercatorPoint(MAP_ORIGIN),target=mercatorPoint(location);
  const dx=Math.abs(target.x-origin.x),dy=Math.abs(target.y-origin.y);
  const halfWidth=Math.max(1,width/2-80),halfHeight=Math.max(1,height/2-80);
  for(let zoom=11;zoom>=0;zoom--){if(dx*2**zoom<=halfWidth&&dy*2**zoom<=halfHeight)return zoom;}
  return 0;
}
export function normalizeFilters(input) {
  const result = structuredClone(DEFAULT_FILTERS);
  if (!input || typeof input !== 'object') return result;
  if (Array.isArray(input.bands)) result.bands = [...new Set(input.bands.filter(x => Number.isInteger(x) && x >= 0 && x < 4))];
  if (Array.isArray(input.sizes)) result.sizes = [...new Set(input.sizes.filter(x => SIZE_OPTIONS.includes(x)))];
  else if (SIZE_OPTIONS.includes(input.size)) result.sizes = [input.size]; // migrate v0.1 preferences
  if (['all','regional'].includes(input.mode)) result.mode = input.mode;
  if (['any','0','1','2'].includes(input.transfers)) result.transfers = input.transfers;
  if (typeof input.excludeVisited === 'boolean') result.excludeVisited = input.excludeVisited;
  return result;
}
