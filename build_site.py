"""GitHub Pages용 사이트(dist/site) 만들기: index.html + Firebase + 앱 설치(PWA) 파일"""
import pathlib, json, time, re, shutil
root = pathlib.Path(__file__).parent
src = root / 'src'
site = root / 'dist' / 'site'
site.mkdir(parents=True, exist_ok=True)

css = (src / 'style.css').read_text()
order = ['content.js', 'content2.js', 'voices.js', 'app.js', 'levels.js', 'draw.js', 'curriculum.js', 'kor_curr.js', 'eng_curr.js', 'currcore.js', 'curr_ui.js', 'sync.js', 'pen.js', 'write.js', 'report.js', 'weekly.js', 'capsule.js', 'boot.js']
js = '\n'.join((src / f).read_text() for f in order)
cfg = (root / 'firebase' / 'firebase-config.js').read_text().replace('const firebaseConfig', 'window.FIREBASE_CONFIG')
version = time.strftime('%Y%m%d%H%M%S')
FB = '10.14.1'

html = f'''<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>재윤이 공부방</title>
<meta name="theme-color" content="#FFF4F7">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="재윤이 공부방">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="icon-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Dodum&family=Jua&display=swap">
<style>
:root{{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}
body{{margin:0}} img{{max-width:100%}} [hidden]{{display:none!important}}
{css}
</style>
</head>
<body>
<main class="app" id="app"></main>
<script src="https://www.gstatic.com/firebasejs/{FB}/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/{FB}/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/{FB}/firebase-firestore-compat.js"></script>
<script>
{cfg}
window.APP_VERSION = "{version}";
</script>
<script>
{js}
</script>
<script>
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {{}}));
</script>
</body>
</html>
'''
(site / 'index.html').write_text(html)

manifest = {
  "name": "재윤이 공부방", "short_name": "재윤이 공부방", "lang": "ko",
  "start_url": "./", "scope": "./", "display": "standalone", "orientation": "any",
  "background_color": "#FFF4F7", "theme_color": "#FFF4F7",
  "icons": [
    {"src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
    {"src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
    {"src": "icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}
  ]
}
(site / 'manifest.webmanifest').write_text(json.dumps(manifest, ensure_ascii=False, indent=1))

sw = f'''// 재윤이 공부방 · 오프라인에서도 열리게 (새 버전이 있으면 바로 받기)
const CACHE = 'jaeyun-{version}';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {{ e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); }});
self.addEventListener('activate', e => {{ e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); }});
self.addEventListener('fetch', e => {{
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.origin === location.origin) {{
    // 앱 파일: 인터넷이 되면 새 것, 안 되면 저장해 둔 것
    e.respondWith(fetch(e.request).then(r => {{ const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; }}).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
  }} else if (/fonts\\.(googleapis|gstatic)\\.com|gstatic\\.com\\/firebasejs/.test(u.href)) {{
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {{ const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; }})));
  }}
}});
'''
(site / 'sw.js').write_text(sw)
(site / '.nojekyll').write_text('')
print('site built', version, len(html))
