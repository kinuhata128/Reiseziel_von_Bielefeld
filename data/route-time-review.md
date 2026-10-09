# 十万人口以上城市铁路用时复查

复查日期：2026-10-09。共 80 座：45 座已有路线，34 座没有路线数据，1 座为起点。

45 座已有路线的全部铁路模式采用 DB 官方页面中的具体班次示例，28 座同时取得纯区域铁路示例。用时取已取得的铁路示例中最短者；不是对全天班次的完整搜索。日期、换乘次数、列车产品和到达站见 JSON 证据。含 BUS 或未知产品的示例不采用。换乘上限也只从对应已采样方案中选取。

其余 17 座的区域铁路模式仍为估算，未获得匹配的纯区域铁路示例，页面明确标记。无数据的城市未被认定为不可达。不同日期和不同证据等级不能直接比较为最快用时。

柏林：2026-10-18 示例 11:38–15:18，ICE 直达，220 分钟。2026-10-02 至 2026-12-12 汉诺威—柏林施工绕行，ICE 10 增加约 60–70 分钟；以前正常线路两小时多的用时不能代表当前施工期。施工结束后需重新采样，不能自动当作永久用时。

[DB 施工公告](https://assets-ri.extranet.deutschebahn.com/db_fernverkehr/2025-10-31/013e66c7-bbd6-4364-b8d8-ace08239a2e7Details%2BBauarbeiten%2Bzwischen%2BHannover%2Bund%2BBerlin.pdf)

| 城市 | 全部铁路：旧 → 复查参考 | 区域铁路：旧 → 复查参考 | 到达站（全部 / 区域） | 参考日期 | 来源 / 状态 |
| --- | --- | --- | --- | --- | --- |
| Berlin | 2:50 / 0 次换乘 → 3:40 / 0 次换乘 | 5:55 / 2 次换乘 → 保留估算，未核验 | Berlin Hbf / Berlin Hbf | 2026-10-18 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/berlin.shtml) |
| Hamburg | 3:00 / 1 次换乘 → 2:19 / 1 次换乘 | 4:10 / 2 次换乘 → 保留估算，未核验 | Hamburg Hbf / Hamburg Hbf | 2026-10-16 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/hamburg.shtml) |
| München | — | — | — | — | 尚无路线数据 |
| Köln | 2:35 / 0 次换乘 → 1:41 / 0 次换乘 | 3:10 / 1 次换乘 → 2:38 / 1 次换乘 | Köln Hbf / Köln Hbf | 2026-10-20 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/koeln.shtml) |
| Frankfurt am Main | 3:30 / 1 次换乘 → 3:12 / 1 次换乘 | 5:30 / 3 次换乘 → 保留估算，未核验 | Frankfurt (Main) Hbf / Frankfurt (Main) Hbf | 2026-10-18 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/frankfurt.shtml) |
| Düsseldorf | 2:05 / 0 次换乘 → 1:42 / 0 次换乘 | 2:35 / 0 次换乘 → 保留估算，未核验 | Düsseldorf Hbf / Düsseldorf Hbf | 2026-10-14 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/duesseldorf.shtml) |
| Stuttgart | — | — | — | — | 尚无路线数据 |
| Leipzig | 4:00 / 1 次换乘 → 3:48 / 1 次换乘 | 6:00 / 3 次换乘 → 保留估算，未核验 | Leipzig Hbf / Leipzig Hbf | 2026-10-22 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/leipzig.shtml) |
| Dortmund | 1:05 / 0 次换乘 → 0:44 / 0 次换乘 | 1:30 / 0 次换乘 → 1:05 / 0 次换乘 | Dortmund Hbf / Dortmund Hbf | 2026-10-20 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/dortmund.shtml) |
| Bremen | 2:05 / 1 次换乘 → 1:54 / 2 次换乘 | 2:40 / 1 次换乘 → 保留估算，未核验 | Bremen Hbf / Bremen Hbf | 2026-10-17 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/bremen.shtml) |
| Essen | 1:35 / 0 次换乘 → 1:14 / 0 次换乘 | 2:00 / 0 次换乘 → 1:30 / 0 次换乘 | Essen Hbf / Essen Hbf | 2026-10-16 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/essen.shtml) |
| Dresden | — | — | — | — | 尚无路线数据 |
| Nürnberg | — | — | — | — | 尚无路线数据 |
| Hannover | 0:55 / 0 次换乘 → 0:50 / 0 次换乘 | 1:50 / 0 次换乘 → 保留估算，未核验 | Hannover Hbf / Hannover Hbf | 2026-10-22 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/hannover.shtml) |
| Duisburg | 1:50 / 0 次换乘 → 1:31 / 0 次换乘 | 2:15 / 0 次换乘 → 保留估算，未核验 | Duisburg Hbf / Duisburg Hbf | 2026-10-14 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/duisburg.shtml) |
| Bochum | 1:20 / 0 次换乘 → 1:00 / 0 次换乘 | 1:45 / 0 次换乘 → 1:18 / 0 次换乘 | Bochum Hbf / Bochum Hbf | 2026-10-22 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/bochum.shtml) |
| Wuppertal | 2:10 / 1 次换乘 → 1:11 / 0 次换乘 | 2:30 / 1 次换乘 → 2:02 / 1 次换乘 | Wuppertal Hbf / Wuppertal Hbf | 2026-10-22 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/wuppertal.shtml) |
| Bielefeld | — | — | — | — | 起点，不参与抽签 |
| Bonn | 3:05 / 1 次换乘 → 2:21 / 1 次换乘 | 3:45 / 2 次换乘 → 3:25 / 2 次换乘 | Bonn Hbf / Bonn Hbf | 2026-10-22 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/bonn.shtml) |
| Mannheim | — | — | — | — | 尚无路线数据 |
| Karlsruhe | — | — | — | — | 尚无路线数据 |
| Münster | 1:30 / 1 次换乘 → 0:59 / 1 次换乘 | 1:30 / 1 次换乘 → 1:17 / 1 次换乘 | Münster (Westf) Hbf / Münster (Westf) Hbf | 2026-10-22 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/muenster.shtml) |
| Augsburg | — | — | — | — | 尚无路线数据 |
| Wiesbaden | — | — | — | — | 尚无路线数据 |
| Gelsenkirchen | 1:45 / 1 次换乘 → 1:18 / 1 次换乘 | 2:10 / 1 次换乘 → 1:49 / 1 次换乘 | Gelsenkirchen Hbf / Gelsenkirchen Hbf | 2026-10-20 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/gelsenkirchen.shtml) |
| Mönchengladbach | 2:40 / 1 次换乘 → 2:16 / 1 次换乘 | 3:15 / 1 次换乘 → 2:44 / 1 次换乘 | Mönchengladbach Hbf / Mönchengladbach Hbf | 2026-10-15 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/moenchengladbach.shtml) |
| Aachen | 3:40 / 1 次换乘 → 2:41 / 1 次换乘 | 4:15 / 2 次换乘 → 3:40 / 2 次换乘 | Aachen Hbf / Aachen Hbf | 2026-10-16 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/aachen.shtml) |
| Braunschweig | 1:50 / 1 次换乘 → 1:27 / 0 次换乘 | 2:55 / 1 次换乘 → 保留估算，未核验 | Braunschweig Hbf / Braunschweig Hbf | 2026-10-22 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/braunschweig.shtml) |
| Kiel | — | — | — | — | 尚无路线数据 |
| Chemnitz | — | — | — | — | 尚无路线数据 |
| Magdeburg | 2:55 / 1 次换乘 → 2:24 / 0 次换乘 | 4:10 / 2 次换乘 → 保留估算，未核验 | Magdeburg Hbf / Magdeburg Hbf | 2026-10-22 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/magdeburg.shtml) |
| Freiburg im Breisgau | — | — | — | — | 尚无路线数据 |
| Krefeld | 2:30 / 1 次换乘 → 2:08 / 1 次换乘 | 2:55 / 1 次换乘 → 保留估算，未核验 | Krefeld Hbf / Krefeld Hbf | 2026-10-22 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/krefeld.shtml) |
| Halle (Saale) | 3:50 / 1 次换乘 → 3:24 / 1 次换乘 | 5:40 / 3 次换乘 → 保留估算，未核验 | Halle (Saale) Hbf / Halle (Saale) Hbf | 2026-10-16 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/halle.shtml) |
| Mainz | — | — | — | — | 尚无路线数据 |
| Erfurt | 3:25 / 1 次换乘 → 3:26 / 1 次换乘 | 5:10 / 3 次换乘 → 保留估算，未核验 | Erfurt Hbf / Erfurt Hbf | 2026-10-13 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/erfurt.shtml) |
| Lübeck | — | — | — | — | 尚无路线数据 |
| Oberhausen | 1:55 / 1 次换乘 → 1:27 / 1 次换乘 | 2:25 / 1 次换乘 → 1:51 / 0 次换乘 | Oberhausen Hbf / Oberhausen Hbf | 2026-10-18 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/oberhausen.shtml) |
| Rostock | — | — | — | — | 尚无路线数据 |
| Kassel | 2:10 / 1 次换乘 → 2:14 / 2 次换乘 | 2:40 / 1 次换乘 → 保留估算，未核验 | Kassel Hbf / Kassel-Wilhelmshöhe | 2026-10-18 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/kassel.shtml) |
| Hagen | 1:40 / 1 次换乘 → 0:52 / 0 次换乘 | 1:55 / 1 次换乘 → 1:38 / 1 次换乘 | Hagen Hbf / Hagen Hbf | 2026-10-16 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/hagen.shtml) |
| Potsdam | — | — | — | — | 尚无路线数据 |
| Saarbrücken | — | — | — | — | 尚无路线数据 |
| Hamm | 0:50 / 0 次换乘 → 0:27 / 0 次换乘 | 0:55 / 0 次换乘 → 0:42 / 0 次换乘 | Hamm (Westf) Hbf / Hamm (Westf) Hbf | 2026-10-15 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/hamm.shtml) |
| Ludwigshafen am Rhein | — | — | — | — | 尚无路线数据 |
| Oldenburg (Oldenburg) | 2:55 / 2 次换乘 → 2:29 / 2 次换乘 | 3:15 / 2 次换乘 → 2:29 / 2 次换乘 | Oldenburg (Oldb) Hbf / Oldenburg (Oldb) Hbf | 2026-10-21 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/oldenburg.shtml) |
| Mülheim an der Ruhr | 1:52 / 1 次换乘 → 1:26 / 1 次换乘 | 2:07 / 1 次换乘 → 1:39 / 0 次换乘 | Mülheim (Ruhr) Hbf / Mülheim (Ruhr) Hbf | 2026-10-22 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/muelheim-an-der-ruhr.shtml) |
| Leverkusen | 2:43 / 1 次换乘 → 2:11 / 1 次换乘 | 2:48 / 1 次换乘 → 3:03 / 2 次换乘 | Leverkusen Mitte / Leverkusen Mitte | 2026-10-22 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/leverkusen.shtml) |
| Darmstadt | — | — | — | — | 尚无路线数据 |
| Osnabrück | 0:55 / 0 次换乘 → 0:48 / 1 次换乘 | 1:10 / 0 次换乘 → 0:48 / 1 次换乘 | Osnabrück Hbf / Osnabrück Hbf | 2026-10-22 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/osnabrueck.shtml) |
| Solingen | 2:35 / 1 次换乘 → 1:33 / 1 次换乘 | 2:55 / 1 次换乘 → 2:14 / 1 次换乘 | Solingen Hbf / Solingen Hbf | 2026-10-19 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/solingen.shtml) |
| Paderborn | 1:00 / 0 次换乘 → 0:53 / 0 次换乘 | 1:00 / 0 次换乘 → 0:53 / 0 次换乘 | Paderborn Hbf / Paderborn Hbf | 2026-10-22 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/paderborn.shtml) |
| Herne | 1:40 / 1 次换乘 → 1:10 / 1 次换乘 | 2:05 / 1 次换乘 → 1:49 / 1 次换乘 | Herne / Herne | 2026-10-20 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/herne.shtml) |
| Heidelberg | — | — | — | — | 尚无路线数据 |
| Neuss | 2:29 / 1 次换乘 → 2:00 / 1 次换乘 | 2:59 / 1 次换乘 → 2:32 / 1 次换乘 | Neuss Hbf / Neuss Hbf | 2026-10-22 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/neuss.shtml) |
| Regensburg | — | — | — | — | 尚无路线数据 |
| Ingolstadt | — | — | — | — | 尚无路线数据 |
| Pforzheim | — | — | — | — | 尚无路线数据 |
| Würzburg | — | — | — | — | 尚无路线数据 |
| Offenbach am Main | — | — | — | — | 尚无路线数据 |
| Fürth | — | — | — | — | 尚无路线数据 |
| Heilbronn | — | — | — | — | 尚无路线数据 |
| Ulm | — | — | — | — | 尚无路线数据 |
| Wolfsburg | 1:50 / 0 次换乘 → 2:02 / 1 次换乘 | 3:10 / 1 次换乘 → 保留估算，未核验 | Wolfsburg Hbf / Wolfsburg Hbf | 2026-10-14 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/wolfsburg.shtml) |
| Göttingen | 2:00 / 1 次换乘 → 1:39 / 1 次换乘 | 2:35 / 1 次换乘 → 保留估算，未核验 | Göttingen / Göttingen | 2026-10-16 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/goettingen.shtml) |
| Reutlingen | — | — | — | — | 尚无路线数据 |
| Bremerhaven | 3:07 / 2 次换乘 → 2:55 / 2 次换乘 | 3:39 / 2 次换乘 → 3:19 / 1 次换乘 | Bremerhaven Hbf / Bremerhaven Hbf | 2026-10-15 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/bremerhaven.shtml) |
| Bottrop | 2:02 / 1 次换乘 → 1:37 / 1 次换乘 | 2:26 / 2 次换乘 → 2:13 / 1 次换乘 | Bottrop Hbf / Bottrop Hbf | 2026-10-15 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/bottrop.shtml) |
| Erlangen | — | — | — | — | 尚无路线数据 |
| Recklinghausen | 2:12 / 2 次换乘 → 1:34 / 1 次换乘 | 2:22 / 1 次换乘 → 1:54 / 2 次换乘 | Recklinghausen Hbf / Recklinghausen Hbf | 2026-10-20 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/recklinghausen.shtml) |
| Remscheid | 2:52 / 2 次换乘 → 1:40 / 2 次换乘 | 3:00 / 2 次换乘 → 3:21 / 2 次换乘 | Remscheid Hbf / Remscheid Hbf | 2026-10-18 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/remscheid.shtml) |
| Koblenz | 3:50 / 1 次换乘 → 3:04 / 2 次换乘 | 5:00 / 3 次换乘 → 4:27 / 2 次换乘 | Koblenz Hbf / Koblenz Hbf | 2026-10-20 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/koblenz.shtml) |
| Bergisch Gladbach | — | — | — | — | 尚无路线数据 |
| Jena | — | — | — | — | 尚无路线数据 |
| Salzgitter | 2:02 / 1 次换乘 → 2:02 / 1 次换乘 | 2:43 / 2 次换乘 → 2:49 / 1 次换乘 | Salzgitter-Ringelheim / Salzgitter-Bad | 2026-10-18 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/salzgitter.shtml) |
| Trier | — | — | — | — | 尚无路线数据 |
| Siegen | 3:15 / 2 次换乘 → 3:17 / 2 次换乘 | 3:15 / 2 次换乘 → 保留估算，未核验 | Siegen Hbf / Siegen Hbf | 2026-10-19 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/siegen.shtml) |
| Moers | — | — | — | — | 尚无路线数据 |
| Gütersloh | 0:15 / 0 次换乘 → 0:08 / 0 次换乘 | 0:15 / 0 次换乘 → 0:08 / 0 次换乘 | Gütersloh Hbf / Gütersloh Hbf | 2026-10-17 | [DB 示例](https://www.bahn.de/reisen/view/verbindung/bielefeld/guetersloh.shtml) |
| Kaiserslautern | — | — | — | — | 尚无路线数据 |
