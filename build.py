import pathlib
src = pathlib.Path(__file__).parent / 'src'
css = (src / 'style.css').read_text()
import json as _json
_relay = 'const RELAY_GS = ' + _json.dumps((src.parent / 'firebase' / 'apps_script.gs').read_text(), ensure_ascii=False) + ';\nconst RELAY_MANIFEST = ' + _json.dumps((src.parent / 'firebase' / 'appsscript.json').read_text(), ensure_ascii=False) + ';\n'
js = _relay + '\n'.join((src / f).read_text() for f in ['content.js', 'content2.js', 'voices.js', 'app.js', 'levels.js', 'draw.js', 'curriculum.js', 'kor_curr.js', 'eng_curr.js', 'eng2.js', 'math12.js', 'kor12.js', 'currcore.js', 'curr_ui.js', 'sync.js', 'push.js', 'ntfy.js', 'pen.js', 'write.js', 'report.js', 'weekly.js', 'study.js', 'notebook.js', 'capsule.js', 'tori.js', 'boot.js'])
html = f'''<title>재윤이 공부방</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="theme-color" content="#FFF4F7">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Dodum&family=Jua&display=swap">
<style>
{css}
</style>
<main class="app" id="app"></main>
<script>
{js}
</script>
'''
out = pathlib.Path(__file__).parent / 'dist'
out.mkdir(exist_ok=True)
(out / 'jaeyun-room.html').write_text(html)
print('built', len(html))
