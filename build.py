#!/usr/bin/env python3
"""Optional maintainer utility. End users run index.html without building."""
from pathlib import Path
import base64
root=Path(__file__).resolve().parent
parts=root/'src'
html=(parts/'shell.html').read_text()
for marker,name in [('/*STYLE*/','style.css'),('/*WORKER*/','worker.js'),('/*APP*/','app.js')]:
    text=(parts/name).read_text()
    if name=='worker.js': text=(parts/'color.js').read_text()+'\n'+(parts/'masks.js').read_text()+'\n'+(parts/'filters.js').read_text()+'\n'+text
    if name=='app.js': text='\n'.join((parts/f).read_text() for f in ['color.js','masks.js','geometry.js','filter-settings.js','eraser-settings.js'])+'\n'+text+'\n'+'\n'.join((parts/f).read_text() for f in ['workspace.js','studio.js','filter-panel.js','eraser.js'])+'\nstart();'
    html=html.replace(marker,text)
html=html.replace('/*INPAINT*/',(parts/'inpaint.js').read_text())
html=html.replace('/*SAMPLE*/','data:image/jpeg;base64,'+base64.b64encode((parts/'sample.jpg').read_bytes()).decode())
(root/'index.html').write_text(html)
print(f'Built {root / "index.html"} ({len(html):,} bytes)')
