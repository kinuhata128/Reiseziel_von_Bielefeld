# 下一站 · Bielefeld

## 写给自己和小🦴

从 Bielefeld Hbf 出发的铁路出游抽签网页。按单程用时、城市人口、列车类型和换乘次数筛选目的地，再从候选城市中随机抽取一个。

项目使用 HTML、CSS 和 JavaScript，无后端，也无需安装 npm 依赖。支持手机和桌面浏览器，可部署到 GitHub Pages。

## 本地运行

需要 Node.js 18 或更高版本。在项目根目录运行：

```sh
npm run dev
```

打开 [http://127.0.0.1:4173](http://127.0.0.1:4173)。也可以直接运行 `node scripts/serve.mjs`。请通过本地服务器访问。

## 使用方式

1. 选择单程用时和人口范围，两项均支持多选。
2. 选择全部铁路或仅区域铁路，设置换乘上限。
3. 点击“抽一个”，查看目的地、到达站、参考用时和地图位置。
4. 通过“跳转到DB”查询实际班次，或打开 Google 地图查看城市。

单程用时分为四档：`0 < t ≤ 60`、`60 < t ≤ 120`、`120 < t ≤ 180`、`180 < t ≤ 240` 分钟。人口分为不足 2 万、2–10 万、10–50 万和 50 万以上。

候选城市等概率抽取，同一轮不会重复；候选池变化后重新开始一轮。候选列表支持德文名、中文名和译名别名搜索，可按用时、名称或人口排序。

已去城市记录保存在当前浏览器的 `localStorage` 中，可在筛选时排除。跨设备迁移需要导出 JSON，再在另一台设备上合并导入。

DB 链接预填 Bielefeld Hbf 和所选方案的实际到达站，出发日期与时间在 DB 页面选择。复制按钮复制目的地德文城市名。

## 数据范围

截至 2026-10-09，项目数据如下：

| 项目 | 数量 |
| --- | ---: |
| 德国城市底库 | 2,059 |
| 有中文名的城市 | 2,059 |
| 有铁路用时数据的城市 | 262 |
| 有地图坐标的城市 | 1,903 |
| 全部铁路参考用时在 4 小时内 | 259 |
| 区域铁路参考用时在 4 小时内 | 236 |
| 采用 DB 班次示例的城市：全部铁路 | 45 |
| 采用 DB 班次示例的城市：区域铁路 | 28 |

Bielefeld 本身不参与抽签。缺少用时数据的 1,797 座城市也不进入候选池；缺少数据不表示铁路不可达。实际候选数量还取决于人口、换乘上限和已去记录。

### 铁路用时

`data/routes.json` 包含人工估算、走廊计算结果和 DB 官方页面提供的具体班次示例。页面显示的用时用于筛选目的地，出行前需要在 DB 查询实际班次。项目未接入实时查询 API，也未完整核验所有日期和模式。“仅区域铁路”不保证某种票券适用。

用时数据以 75 座城市的人工参考为基础，沿区域铁路走廊补充了 187 座城市，主要覆盖 NRW、下萨克森、不来梅和黑森。走廊各段用时为人工估算，换乘预留 12 分钟；线路结构参考 [mobil.nrw 区域铁路网络](https://infoportal.mobil.nrw/information-service/regionalverkehrsplan-nrw.html) 和 [DB 线路图](https://www.bahn.de/service/fahrplaene/streckennetz)。

2026-10-09 的复查覆盖底库中全部 80 座人口至少十万的城市：45 座已有路线取得官方示例，34 座尚无路线数据，Bielefeld 为起点。其中 28 座同时取得区域铁路示例，其余 17 座的区域铁路用时仍为未核验估算。逐城记录见 [用时复查表](data/route-time-review.md)，原始证据保存在 `data/route-time-review.json`。

采样只接受从 Bielefeld Hbf 出发、复查日起 30 天内且列车产品已识别的方案，排除 BUS。每个方案保留日期、起终站、换乘次数、列车产品和来源链接。示例不能代表全天最快班次，也不能保证其他日期可用。不同列车模式可能对应不同到达站。

已有官方示例的模式按采样方案筛选；若没有符合换乘上限的示例，该城市不进入候选池。其余模式使用估算路径。官方示例不会用于推算邻近城市的用时。

### 城市名单与坐标

城市名单、人口和行政代码来自 [德国统计局 Destatis 城市名单](https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/Administrativ/05-staedte.html)，人口统计日期为 2024-12-31。底库只收录具有 Stadt 资格的城市，按 12 位行政代码去重。原始文件为 `data/cities-source.xlsx`，导入结果为 `data/cities.json`。

坐标来自 [GeoNames](https://www.geonames.org/)，采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 许可，保存于 `data/locations.json`。匹配依据为城市名、州和必要时的县代码，每项保留 GeoNames ID。坐标表示城市中心，并非车站位置。156 座未能唯一匹配的城市列在 `data/location-match-report.json`；全部有用时数据的城市均有坐标。

### 中文名称

基础中文名来自 [Wikidata](https://www.wikidata.org/)，通过 [P439 德国市镇代码](https://www.wikidata.org/wiki/Property:P439) 与城市行政代码关联。

截至 2026-10-09，已在 Google 地图简体中文界面核对 297 座城市，覆盖全部有用时数据的城市和人口最多的 80 座城市。其余 1,762 座尚未逐一核对。名称差异、别名和复核理由保存在审核文件中。

## 离线使用

首次使用需联网。Service Worker 成功缓存页面和数据后，可以离线抽签、查看候选列表及管理已去记录。地图底图、Google 地图和 DB 查询需要网络。

支持 PWA 安装，入口取决于浏览器；iOS 可通过 Safari 分享菜单添加到主屏幕。地图使用本地 Leaflet 1.9.4 和 OpenStreetMap 瓦片，仅请求当前视野内的瓦片。Service Worker 不预下载外部地图瓦片。

## 目录结构

```text
├── index.html              页面入口
├── app.js                  页面交互、地图和本地记录
├── core.js                 筛选、抽签和路线选择
├── styles.css              页面样式
├── sw.js                   离线缓存
├── manifest.webmanifest    PWA 配置
├── assets/                 图标、中文名称表和 Leaflet
├── data/                   城市、路线、坐标及审核记录
├── scripts/                本地服务和数据维护脚本
├── tests/                  自动化测试
└── .github/workflows/      GitHub Pages 部署流程
```

## 检查与维护

运行测试和数据审计：

```sh
npm test
npm run data:audit
```

数据审计检查数量、城市关联、中文名称、坐标和路径记录，不核验实际铁路班次。

### 更新城市与坐标

城市和坐标导入脚本需要 Python 及 `openpyxl`，前端运行不需要这些依赖。

将新的 Destatis 城市名单保存为 `data/cities-source.xlsx`。从 [GeoNames 下载目录](https://download.geonames.org/export/dump/)获取 `cities1000.zip`，保存为 `data/geonames-cities1000.zip`，然后运行：

```sh
python scripts/import-cities.py data/cities-source.xlsx
npm run data:routes
npm run data:locations
```

坐标脚本匹配整个底库；有用时数据的城市缺少坐标时会中止并生成报告。原始 ZIP 不参与发布。底库变化后还需更新中文名称，并执行测试和数据审计。

### 更新路线

人工参考定义在 `scripts/seed-routes.mjs`，生成后保存为 `data/routes-manual.json`。区域铁路走廊定义在 `scripts/rail-network.mjs`。增加目的地时录入城市、实际到达站和逐段估算用时；不具有 Stadt 资格的车站可以作为中转节点。

```sh
npm run data:routes
```

该命令重建人工参考并计算走廊路线。只修改走廊时，运行 `node scripts/calculate-routes.mjs` 即可。两种方式都会在计算后应用已保存的官方示例。

走廊计算最多考虑 5 次换乘，同时保留用时和换乘次数各有优势的备选路径，以便按换乘上限选择。每条计算路径记录参考城市、沿途车站和走廊编号。

重新采样 DB 示例前，先更新 `scripts/review-large-city-routes.mjs` 中的 `reviewedAt`，并核对相关施工公告。采样需要联网，会重写复查记录。

```sh
node scripts/review-large-city-routes.mjs
node scripts/calculate-routes.mjs
node scripts/report-route-review.mjs
npm run data:audit
npm test
```

### 更新中文名称

| 文件 | 内容 |
| --- | --- |
| `data/city-names-zh.json` | 中文名、别名、Wikidata 实体及地图核查状态 |
| `data/city-name-audit.json` | 覆盖率、同名城市、名称差异与复核例外 |
| `data/google-maps-name-pairs.json` | 实际观察到的地图标题 |
| `data/google-maps-city-checks.json` | 对应德文名和地图查询链接 |
| `data/city-name-overrides.json` | 手动修正和额外别名 |
| `assets/city-names.js` | 生成的前端名称表，请通过脚本更新 |

修改审核记录或译名后运行：

```sh
node scripts/record-google-map-names.mjs
npm run data:names
npm run data:audit
npm test
```

需要重新获取 Wikidata 基础名称时，运行 `node scripts/fetch-city-labels.mjs`，此步骤需要联网。导入时若城市缺少唯一匹配来源或中文名，脚本会报错。

### 更新缓存

修改前端资源或发布数据后，递增 `sw.js` 中的缓存版本。缓存只处理本站公共资源，旧缓存清理限定在当前应用 scope 内。

## 第三方许可

- Leaflet 1.9.4：BSD-2-Clause，见 [许可文件](assets/leaflet/LICENSE)。
- GeoNames 坐标：CC BY 4.0，页面保留来源链接。
- OpenStreetMap 底图：地图内保留 OpenStreetMap 署名。
- Wikidata 结构化名称：[CC0](https://www.wikidata.org/wiki/Wikidata:Licensing)。
- OpenCC 1.1.9 字典：Apache-2.0，见 [许可文件](scripts/vendor/opencc/LICENSE)。
