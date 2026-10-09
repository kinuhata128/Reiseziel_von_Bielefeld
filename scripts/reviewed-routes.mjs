const REGIONAL_PRODUCTS = new Set(['RB','RE','S','R','NX','ERB','NWB','VIA','RRB','TR','TRI','WFB','ENO','ERX','HLB']);
const LONG_DISTANCE_PRODUCTS = new Set(['ICE','IC','EC','FLX']);

export function reviewedOptions(entry, mode, reviewedAt) {
  return (entry.samples || []).filter(s =>
    s.departureStation === 'Bielefeld Hbf' && s.departureDate >= reviewedAt &&
    s.departureDate <= new Date(Date.parse(`${reviewedAt}T00:00:00Z`)+30*86400000).toISOString().slice(0,10) && s.products.length &&
    s.products.every(p => REGIONAL_PRODUCTS.has(p) || (mode === 'all' && LONG_DISTANCE_PRODUCTS.has(p)))
  ).map(sample => ({
    minutes:sample.minutes, transfers:sample.transfers, station:sample.arrivalStation,
    kind:'official-journey-example', source:entry.source, reviewedAt,
    sourceUpdatedAt:entry.sourceUpdatedAt, sample
  })).sort((a,b)=>a.minutes-b.minutes || a.transfers-b.transfers);
}

export function applyReviewedRoutes(route, entry, reviewedAt) {
  if (!entry) return;
  route.review = {reviewedAt, source:entry.source, modes:{}};
  for (const mode of ['all','regional']) {
    const options = reviewedOptions(entry, mode, reviewedAt);
    route.review.modes[mode] = options.length ? 'official-journey-examples' : 'estimate-no-matching-rail-example';
    if (!options.length) continue;
    route[mode] = options[0];
    // A transfer cap must use the sampled options too, never revive the old
    // estimate or a synthetic shortcut through an unverified corridor.
    route.alternatives[mode] = options;
  }
  if (route.all.kind==='official-journey-example') route.kind='official-examples-and-estimates';
}
