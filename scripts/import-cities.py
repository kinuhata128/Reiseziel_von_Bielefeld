"""Convert the official Destatis Stadt workbook to a small browser dataset.

Usage: python scripts/import-cities.py data/cities-source.xlsx
Requires openpyxl only for data maintenance, never for the website.
"""
import json
import sys
from pathlib import Path
import openpyxl

ROOT = Path(__file__).resolve().parents[1]
STATES = {'01':'Schleswig-Holstein','02':'Hamburg','03':'Niedersachsen','04':'Bremen','05':'Nordrhein-Westfalen','06':'Hessen','07':'Rheinland-Pfalz','08':'Baden-Württemberg','09':'Bayern','10':'Saarland','11':'Berlin','12':'Brandenburg','13':'Mecklenburg-Vorpommern','14':'Sachsen','15':'Sachsen-Anhalt','16':'Thüringen'}
source = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'data/cities-source.xlsx'
workbook = openpyxl.load_workbook(source, read_only=True, data_only=True)
cities = []
for row in workbook['Städte'].iter_rows(min_row=3, values_only=True):
    ars, name, population = row[1], row[2], row[5]
    if not isinstance(ars, str) or len(ars) != 12 or not ars.isdigit():
        continue
    # The last three ARS digits are the municipality identifier;
    # 000 denotes the independent city itself in this Stadt-only file.
    cities.append({'id':ars, 'name':name.split(',')[0], 'officialName':name,
                   'state':STATES[ars[:2]], 'population':int(population),
                   'type':'independent' if ars[-3:] == '000' else 'county'})
assert len(cities) == len({c['id'] for c in cities})
output = {'meta':{'source':'Statistisches Bundesamt (Destatis), Städte in Deutschland',
                  'sourceUrl':'https://www.destatis.de/DE/Themen/Laender-Regionen/Regionales/Gemeindeverzeichnis/Administrativ/05-staedte.html',
                  'populationAsOf':'2024-12-31','importedAt':'2026-10-09',
                  'typeMethod':'Derived from municipality identifier in official ARS: 000 = independent city; otherwise county city.'},
          'cities':cities}
(ROOT / 'data/cities.json').write_text(json.dumps(output, ensure_ascii=False, separators=(',',':')), encoding='utf-8')
print(f'Imported {len(cities)} cities.')
