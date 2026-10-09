# 下一站 · Bielefeld 铁路出游抽签器（v0.2）

纯静态网页、无后端，无需安装依赖。地图使用本地打包的 Leaflet 1.9.4。手机和 PC 使用同一网页；静态文件可以直接部署到 GitHub Pages。

## 本地运行

需要 Node.js 18 或更高版本。无需安装 npm 包。

```powershell
node scripts/serve.mjs
```

浏览器打开 http://127.0.0.1:4173 。不要双击 `index.html`，浏览器的 `file://` 模式无法正常加载数据与离线缓存。

检查核心逻辑：

```powershell
node --test tests/*.test.mjs
```

## 第一版功能

- 固定起点 Bielefeld Hbf；德国具有 Stadt 资格的城市按行政代码去重。
- 用时档位多选：`0 < t ≤ 60`、`60 < t ≤ 120`、`120 < t ≤ 180`、`180 < t ≤ 240` 分钟。
- 人口档位多选：不足 2 万、2–10 万、10–50 万、50 万以上。行政类型不再参与筛选，旧设置会自动迁移。
- 全部铁路 / 仅区域铁路；估算换乘上限。
- 候选城市等概率抽签，同一轮不重复，候选池变化后重置本轮。
- 候选列表搜索、排序、查看城市；已去记录保存在 localStorage。
- 足迹 JSON 导出与合并导入，用于手动跨设备迁移。
- 抽中后地图以 Bielefeld 居中，根据目的地距离与地图实际尺寸自动缩放；随后可自由拖动和缩放，再次抽取时重新居中。目的地使用小红色图钉，不显示额外名称标签。城市名称旁显示中文译名，下方展示到达站、约用时与换乘次数。
- 抽中后打开 DB 查询页，自动填入 Bielefeld Hbf 和当前方案的到达站；出发日期与时间在 DB 中选择。
- 蓝白主题辅以 `#f5abb9` 粉色；中文优先使用黑体，中文译名小于德文名称。用时、人口与列车采用方框选择样式，排除已去城市使用开关。结果展示起点与到达站，地图采用紧凑尺寸。一键复制按钮只复制目的地德文城市名称，谷歌地图按钮按城市名、州和国家打开目的地，并指定简体中文界面。全库 2,059 座城市都有中文名，按行政代码读取；候选列表支持中文主名和译名别名搜索。
- PWA 安装与离线缓存。首次使用需联网，Service Worker 成功缓存后可以离线抽签；地图与 DB 查询仍需网络。安装入口视浏览器支持情况而定，iOS 可通过 Safari 分享菜单添加到主屏幕。

## 数据范围与限制

**全国城市底库：2,059 座；用时覆盖：262 座（基础为 75 座人工参考 + 187 座走廊计算，其中 45 座大城市以 DB 班次示例更新全部铁路用时，28 座同时更新区域铁路用时）；地图坐标：1,903 座。尚未完整核验所有模式和日期。**

城市名单、人口、地区代码来自 [德国统计局（Destatis）城市名单](https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/Administrativ/05-staedte.html)，统计日期 **2024-12-31**，来源发布于 2025 年 9 月。原始文件保存在 `data/cities-source.xlsx`，导入结果为 `data/cities.json`。来源归属：Statistisches Bundesamt (Destatis)。行政类型由 12 位 Amtlicher Regionalschlüssel 的末三位推导：000 为独立市，其余为县属市；Hannover、Göttingen 等属于特殊地区组织但在此仍按县属市处理。

`data/routes.json` 混合了**估算**和**DB 官方页面的具体班次参考**，不是实时查询 API 结果，不保证其他出行日期或实时延误。2026-10-09 复查了底库中全部 80 座十万人口以上城市：45 座已有路线取得官方示例，34 座尚无路线，Bielefeld 为起点。全部铁路更新 45 座，区域铁路更新 28 座；其余 17 座区域铁路保留估算并标为未核验。只接受从 Bielefeld Hbf 出发、30 天内、列车产品已识别的示例，排除 BUS；保留日期、起终站、换乘次数、产品与来源，不把页面少量示例宣称为全天最快班次。不同模式可以使用不同到达站，页面显示所选方案实际到达站。完整逐城记录见 [用时复查表](data/route-time-review.md)，结构化证据在 `data/route-time-review.json`。

柏林当前参考为 2026-10-18 的 ICE 11:38–15:18，即 **220 分钟、直达**。汉诺威—柏林段在 2026-10-02 至 2026-12-12 施工绕行，ICE 10 增加约 60–70 分钟，详见 [DB 施工公告](https://assets-ri.extranet.deutschebahn.com/db_fernverkehr/2025-10-31/013e66c7-bbd6-4364-b8d8-ace08239a2e7Details%2BBauarbeiten%2Bzwischen%2BHannover%2Bund%2BBerlin.pdf)。旧值 170 分钟不适合代表当前施工期；施工结束后仍需重新查询，不能把 220 分钟当作永久用时。

原有人工参考独立保存在 `data/routes-manual.json`；其他目的地沿 `scripts/rail-network.mjs` 中的区域铁路走廊计算，各段用时为人工估算，换乘预留 12 分钟。线路结构参考 [mobil.nrw 区域铁路网络](https://infoportal.mobil.nrw/information-service/regionalverkehrsplan-nrw.html) 与 [DB 线路图入口](https://www.bahn.de/service/fahrplaene/streckennetz)，尚未逐段核验当前运营班次。官方示例在走廊计算完成后覆盖对应城市模式，不用于推算邻近目的地；走廊仍使用原有估算锚点。页面在用时前保留“约”，并区分班次参考和未核验估算。仅区域铁路不代表特定票券保证适用。

未有用时数据的 1,797 座城市不参与抽签，也不被宣称不可达。Bielefeld 本身不参与抽签。262 座有用时数据的城市中，全部铁路参考用时在 4 小时以内的有 259 座，仅区域铁路有 236 座；人口、换乘和已去记录筛选会进一步缩小候选池。范围主要扩展到 NRW、下萨克森、不来梅和黑森；没有采用直线距离来假定城市之间存在铁路连接。

铁路查询入口使用 [DB 官方查询首页](https://www.bahn.de/buchung/start)，通过链接片段参数 `so`、`zo` 预填起点 Bielefeld Hbf 和当前方案的实际到达站。2026-10-09 已在 DB 页面验证预填；出发日期与时间在 DB 中选择。

地图使用本地打包的 Leaflet 1.9.4（BSD-2-Clause，许可见 `assets/leaflet/LICENSE`），底图为 OpenStreetMap，仅请求当前视野内的瓦片。浏览器按服务器缓存头缓存瓦片；Service Worker 不抓取或离线预下载外部瓦片。`data/locations.json` 保存 1,903 座城市的城市中心坐标（不是车站坐标），来自 [GeoNames](https://www.geonames.org/)，许可 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。批量匹配使用 `cities1000`，按名称、州及必要时县代码约束；组合城市保留已复核中心点，Burgwedel 使用行政中心 Großburgwedel 的点。每项保存 GeoNames ID。156 座未能唯一匹配的城市记录在 `data/location-match-report.json`，不会猜测坐标；全部有用时数据的城市均有坐标。地图内保留 OpenStreetMap 署名，页面保留 GeoNames 来源链接。

核查数据数量、关联完整性及计算路径：`npm run data:audit`。数据关联检查不等于铁路班次核验。

维护坐标：下载 `https://download.geonames.org/export/dump/cities1000.zip` 为 `data/geonames-cities1000.zip`，运行 `npm run data:locations`。脚本匹配整个底库；有用时城市缺少坐标时中止并生成报告。原始 ZIP 不参与发布。

## GitHub Pages 部署

1. 新建 GitHub 仓库，例如 `Reiseziel_von_Bielefeld`，将本目录文件上传到 `main` 分支。
2. 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
3. 已提供 `.github/workflows/pages.yml`；推送 `main` 或手动运行工作流即可发布。工作流先检查核心逻辑，再打包公开页面和精简 JSON 数据；不发布原始 XLSX、维护脚本与测试。
4. 在 Actions 的 `github-pages` 部署结果中打开网址。手机与 PC 共用它。

所有资源、manifest 路径与 Service Worker 均采用相对路径，支持 `https://用户名.github.io/仓库名/` 子路径。GitHub 托管限制及权限以仓库设置为准。本地项目尚未关联 GitHub 仓库，也未在线发布。

## 维护数据

### 城市中文名

中文名覆盖全库 **2,059 座城市**。基础名称来自 [Wikidata](https://www.wikidata.org/)，按 [P439 德国市镇代码](https://www.wikidata.org/wiki/Property:P439) 与 Destatis ARS 转换出的 AGS 精确关联；全部城市均唯一匹配到实体，没有用字符串近似匹配或自动音译兜底。优先采用 `zh-cn`，其次 `zh-hans`、`zh`；必要时用随维护脚本保存的 OpenCC 1.1.9 字典规范简繁体。Wikidata 结构化名称为 [CC0](https://www.wikidata.org/wiki/Wikidata:Licensing)，OpenCC 字典为 Apache-2.0，许可保存在 `scripts/vendor/opencc/LICENSE`。

2026-10-09 在 Google 地图简体中文界面实际核对 **297 座城市**，包含全部 262 座有用时数据的城市和人口最多的 80 座城市（两组有重叠）。296 座显示中文标题，`Rotenburg a. d. Fulda` 只显示德文，保留 Wikidata 中文名。其余 1,762 座城市尚未逐一核对 Google 地图；不能把全库中文覆盖等同于全库地图验证。地图与基础来源有 58 项名称差异，主要采用地图标题，并保留完整限定名及常见译名作为搜索别名。

用户指定的 **Lübbecke → 吕伯克** 固定优先，**Lübeck → 吕贝克**；错误旧译名不保留为 Lübbecke 的别名。三个已复核例外保留市镇常用名：Wolfsburg 的地图标题为“沃尔夫”，概况则使用“沃尔夫斯堡”；Moers 的标题为“莫尔斯-维恩”，保留市镇名“默尔斯”；Porta Westfalica 的标题附加“山口”，保留概况中的市镇名“波塔韦斯特法利卡”。地图标题均保留为搜索别名，理由记录在审核数据中。

- `data/city-names-zh.json`：每城中文名、别名、Wikidata 实体、来源语言及地图核查状态。
- `data/city-name-audit.json`：覆盖率、8 组德文同名城市、地图差异与复核例外。
- `data/google-maps-name-pairs.json`：实际观察到的地图中文标题及无中文标题记录；`data/google-maps-city-checks.json` 补充对应德文名和查询链接。
- `data/city-name-overrides.json`：用户指定修正、审核例外及额外别名。
- `assets/city-names.js`：由维护脚本生成的前端名称与别名表，不直接手工修改。

更新审核记录或修正译名后运行：

```powershell
node scripts/record-google-map-names.mjs
node scripts/import-city-names.mjs
node scripts/audit-data.mjs
node --test tests/*.test.mjs
```

`node scripts/fetch-city-labels.mjs` 可重新获取 Wikidata 基础名称，需要联网；正常运行页面和重建名称表不需要联网、不需要安装 npm 包。新底库城市如果缺少唯一来源或中文名称，导入会报错，不会悄悄留下空名。前端优先按 12 位城市 ID 取名；同一德文名若对应不同中文名，兼容名称表不合并，避免跨州同名城市串名。

城市更新工具需要 Python 和 openpyxl；这只是维护工具，不属于前端依赖：

```powershell
python scripts/import-cities.py data/cities-source.xlsx
node scripts/seed-routes.mjs
python scripts/import-locations.py
node scripts/audit-data.mjs
node --test tests/*.test.mjs
```

`npm run data:routes` 重建人工参考并调用走廊计算；只修改走廊时可运行 `node scripts/calculate-routes.mjs`。要增加目的地，在 `scripts/rail-network.mjs` 中录入城市、真实到达站和逐段估算用时，再运行上述维护流程。没有 Stadt 资格的车站可以作为中转节点，但不会加入城市抽签底库。

计算按到达站、上一条走廊和换乘次数分别保留最快状态，并保存耗时与换乘数互不支配的备选路径（最多计算 5 次换乘）。全部铁路模式可从人工长途参考站延伸；区域铁路模式只用区域铁路参考。未有官方示例的模式沿用人工参考或计算路径，显式换乘上限会选择最快合格备选。已有官方示例的城市模式只从相应已采样方案选择，避免换乘限制复活旧估算；缺少符合换乘上限的示例时不加入候选池。结果、列表与排序使用同一路线。每条计算路径保存参考城市、沿途车站与走廊编号。

重新采样及生成复查表：

```powershell
node scripts/review-large-city-routes.mjs
node scripts/calculate-routes.mjs
node scripts/report-route-review.mjs
node scripts/audit-data.mjs
node --test tests/*.test.mjs
```

采样脚本按本次复查日期筛选，未来复查时须更新 `reviewedAt`，并重新核对施工公告。运行种子或走廊脚本会在计算后自动应用已保存的官方示例，不会将它们覆盖回旧估算。

引入实际采样后不要再用这些脚本覆盖正式数据。后续可用合法授权的路由数据，按固定采样日期、出发时段、模式与换乘上限，计算每城最快合格行程，保存采样来源、时间、行程证据、票券限制、查询失败状态，并替换估算元数据及 UI 标识。

修改前端资源后递增 `sw.js` 缓存版本，部署后浏览器会更新。缓存只处理本站公共资源，不缓存 DB 或其他外部链接。清理仅限当前应用 scope。
