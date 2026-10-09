import {readFile,writeFile} from 'node:fs/promises';
import {buildRoutes} from './calculate-routes.mjs';
// Hand-authored prototype estimates, NOT timetable observations. Keep this
// distinction in metadata and UI until replaced by a licensed sampled dataset.
const rows = [
// city | visitor station | all minutes | all transfers | regional minutes | regional transfers
['Gütersloh','Gütersloh Hbf',15,0,15,0],['Herford','Herford',10,0,10,0],
['Bad Salzuflen','Bad Salzuflen',35,1,35,1],['Bünde','Bünde (Westf)',25,0,25,0],
['Löhne','Löhne (Westf)',25,0,25,0],['Minden','Minden (Westf)',40,0,40,0],
['Porta Westfalica','Porta Westfalica',35,0,35,0],['Bad Oeynhausen','Bad Oeynhausen',30,0,30,0],
['Lübbecke','Lübbecke (Westf)',65,1,65,1],['Espelkamp','Espelkamp',75,1,75,1],
['Rahden','Rahden (Kr Lübbecke)',85,1,85,1],['Rheda-Wiedenbrück','Rheda-Wiedenbrück',25,0,25,0],
['Rietberg','Rietberg',null,null,null,null],
['Halle (Westf.)','Halle (Westf)',25,0,25,0],['Borgholzhausen','Borgholzhausen',40,0,40,0],
['Dissen am Teutoburger Wald','Dissen-Bad Rothenfelde',45,0,45,0],
['Versmold','Versmold',null,null,null,null],
['Oelde','Oelde',35,0,35,0],['Ahlen','Ahlen (Westf)',45,0,45,0],
['Hamm','Hamm (Westf) Hbf',50,0,55,0],['Beckum','Neubeckum',40,0,40,0],
['Paderborn','Paderborn Hbf',60,0,60,0],['Detmold','Detmold',45,0,45,0],
['Lage','Lage (Lippe)',30,0,30,0],['Lemgo','Lemgo',45,0,45,0],
['Schloß Holte-Stukenbrock','Schloß Holte',25,0,25,0],
['Höxter','Höxter Rathaus',110,1,110,1],['Warburg','Warburg (Westf)',110,1,110,1],
['Osnabrück','Osnabrück Hbf',55,0,70,0],['Melle','Melle',40,0,40,0],
['Bremen','Bremen Hbf',125,1,160,1],['Oldenburg (Oldenburg)','Oldenburg (Oldb) Hbf',175,2,195,2],
['Hannover','Hannover Hbf',55,0,110,0],['Wunstorf','Wunstorf',90,0,90,0],
['Stadthagen','Stadthagen',70,0,70,0],['Bückeburg','Bückeburg',50,0,50,0],
['Hameln','Hameln',100,1,100,1],['Hildesheim','Hildesheim Hbf',110,1,150,1],
['Braunschweig','Braunschweig Hbf',110,1,175,1],['Wolfsburg','Wolfsburg Hbf',110,0,190,1],
['Celle','Celle',110,1,145,1],['Lüneburg','Lüneburg',170,1,210,1],
['Göttingen','Göttingen',120,1,155,1],['Einbeck','Einbeck Mitte',165,2,165,2],
['Kassel','Kassel-Wilhelmshöhe',130,1,160,1],['Marburg','Marburg (Lahn)',180,2,230,2],
['Münster','Münster (Westf) Hbf',90,1,90,1],['Dortmund','Dortmund Hbf',65,0,90,0],
['Bochum','Bochum Hbf',80,0,105,0],['Essen','Essen Hbf',95,0,120,0],
['Duisburg','Duisburg Hbf',110,0,135,0],['Düsseldorf','Düsseldorf Hbf',125,0,155,0],
['Köln','Köln Hbf',155,0,190,1],['Bonn','Bonn Hbf',185,1,225,2],
['Wuppertal','Wuppertal Hbf',130,1,150,1],['Hagen','Hagen Hbf',100,1,115,1],
['Gelsenkirchen','Gelsenkirchen Hbf',105,1,130,1],['Oberhausen','Oberhausen Hbf',115,1,145,1],
['Krefeld','Krefeld Hbf',150,1,175,1],['Mönchengladbach','Mönchengladbach Hbf',160,1,195,1],
['Aachen','Aachen Hbf',220,1,255,2],['Solingen','Solingen Hbf',155,1,175,1],
['Soest','Soest',85,1,85,1],['Lippstadt','Lippstadt',85,1,85,1],
['Arnsberg','Arnsberg (Westf)',110,1,110,1],['Meschede','Meschede',130,1,130,1],
['Warendorf','Warendorf',100,1,100,1],['Siegen','Siegen Hbf',195,2,195,2],
['Hamburg','Hamburg Hbf',180,1,250,2],['Berlin','Berlin Hbf',170,0,355,2],
['Magdeburg','Magdeburg Hbf',175,1,250,2],['Halle (Saale)','Halle (Saale) Hbf',230,1,340,3],
['Leipzig','Leipzig Hbf',240,1,360,3],['Frankfurt am Main','Frankfurt (Main) Hbf',210,1,330,3],
['Fulda','Fulda',165,1,240,2],['Erfurt','Erfurt Hbf',205,1,310,3],
['Koblenz','Koblenz Hbf',230,1,300,3]
];
const db=JSON.parse(await readFile(new URL('../data/cities.json',import.meta.url),'utf8'));
const routes=[];
for (const [name,station,minutes,transfers,regionalMinutes,regionalTransfers] of rows) {
  if (minutes === null) continue;
  const matches=db.cities.filter(c=>c.name===name);
  if (matches.length!==1) { console.log('Unmatched / ambiguous:',name); continue; }
  routes.push({cityId:matches[0].id, station, all:{minutes,transfers}, regional:{minutes:regionalMinutes,transfers:regionalTransfers}});
}
await writeFile(new URL('../data/routes-manual.json',import.meta.url), JSON.stringify({meta:{preparedAt:'2026-10-09',kind:'manual-estimates',verified:false,origin:'Bielefeld Hbf',method:'Hand-authored indicative estimates for prototype filtering. No sampled departure dates or verified itineraries. Transfers are also estimates. Regional means regional trains only, not a ticket-validity guarantee.'},routes},null,2));
console.log(`Prepared ${routes.length} prototype destinations.`);
await buildRoutes();
