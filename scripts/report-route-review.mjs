import {readFile,writeFile} from 'node:fs/promises';
const read=async name=>JSON.parse(await readFile(new URL(`../data/${name}.json`,import.meta.url),'utf8'));
const [review,data]=await Promise.all(['route-time-review','routes'].map(read));
const duration=r=>`${Math.floor(r.minutes/60)}:${String(r.minutes%60).padStart(2,'0')} / ${r.transfers} 次换乘`;
const rows=['# 十万人口以上城市铁路用时复查','',`复查日期：${review.meta.reviewedAt}。共 ${review.entries.length} 座：45 座已有路线，34 座没有路线数据，1 座为起点。`,'','45 座已有路线的全部铁路模式采用 DB 官方页面中的具体班次示例，28 座同时取得纯区域铁路示例。用时取已取得的铁路示例中最短者；不是对全天班次的完整搜索。日期、换乘次数、列车产品和到达站见 JSON 证据。含 BUS 或未知产品的示例不采用。换乘上限也只从对应已采样方案中选取。','', '其余 17 座的区域铁路模式仍为估算，未获得匹配的纯区域铁路示例，页面明确标记。无数据的城市未被认定为不可达。不同日期和不同证据等级不能直接比较为最快用时。','', '柏林：2026-10-18 示例 11:38–15:18，ICE 直达，220 分钟。2026-10-02 至 2026-12-12 汉诺威—柏林施工绕行，ICE 10 增加约 60–70 分钟；以前正常线路两小时多的用时不能代表当前施工期。施工结束后需重新采样，不能自动当作永久用时。','', '[DB 施工公告](https://assets-ri.extranet.deutschebahn.com/db_fernverkehr/2025-10-31/013e66c7-bbd6-4364-b8d8-ace08239a2e7Details%2BBauarbeiten%2Bzwischen%2BHannover%2Bund%2BBerlin.pdf)','', '| 城市 | 全部铁路：旧 → 复查参考 | 区域铁路：旧 → 复查参考 | 到达站（全部 / 区域） | 参考日期 | 来源 / 状态 |','| --- | --- | --- | --- | --- | --- |'];
for(const entry of review.entries){
  const route=data.routes.find(r=>r.cityId===entry.cityId);
  if(!route){rows.push(`| ${entry.name} | — | — | — | — | ${entry.status==='origin-excluded'?'起点，不参与抽签':'尚无路线数据'} |`);continue;}
  const regional=route.regional.kind==='official-journey-example'?duration(route.regional):'保留估算，未核验';
  rows.push(`| ${entry.name} | ${duration(entry.previous.all)} → ${duration(route.all)} | ${duration(entry.previous.regional)} → ${regional} | ${route.all.station||route.station} / ${route.regional.station||route.station} | ${route.all.sample.departureDate}${route.regional.sample&&route.regional.sample.departureDate!==route.all.sample.departureDate?' / '+route.regional.sample.departureDate:''} | [DB 示例](${entry.source}) |`);
}
await writeFile(new URL('../data/route-time-review.md',import.meta.url),rows.join('\n')+'\n');
