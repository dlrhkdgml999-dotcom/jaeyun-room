"""배포하면 바로 새 버전 (11/4 오후, 서비스 워커) 검증
GitHub Pages처럼 모든 파일에 'Cache-Control: max-age=600'(10분)을 붙이는 가짜 서버로:
1. 앱을 한 번 열어 서비스 워커 설치 → 2. 새 버전 배포(index.html의 APP_VERSION 바꿈) → 3. 앱 다시 열기
   → 새 버전이 바로 나와야 함 (11/4 14:50 사고: 10분 동안 예전 화면)
4. 인터넷 끊고 다시 열기 → 마지막으로 받은 버전이 열려야 함
비교로 예전 서비스 워커(git 1eb1a74)도 돌려서, 이 시뮬레이션이 그 사고를 잡는지 확인 (예전 것은 예전 화면이 나와야 정상)
먼저 python3 build.py && python3 build_site.py"""
import asyncio, os, shutil, subprocess, tempfile, threading, http.server, functools
from harness import CHROME
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'max-age=600'); super().end_headers()
    def log_message(self, *a): pass

def serve(d, port):
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', port), functools.partial(H, directory=d))
    threading.Thread(target=srv.serve_forever, daemon=True).start(); return srv

def deploy(d, ver):
    p = os.path.join(d, 'index.html'); h = open(p, encoding='utf8').read()
    import re; h = re.sub(r'window\.APP_VERSION = "[^"]*"', f'window.APP_VERSION = "{ver}"', h)
    open(p, 'w', encoding='utf8').write(h)

async def run(sw_text, port, label):
    d = tempfile.mkdtemp(prefix='swsim_')
    for f in ('index.html', 'manifest.webmanifest'): shutil.copy(os.path.join(ROOT, 'dist', 'site', f), d)
    for f in ('icon-192.png', 'icon-512.png', 'icon-maskable-512.png'): shutil.copy(os.path.join(ROOT, f), d)
    open(os.path.join(d, 'sw.js'), 'w', encoding='utf8').write(sw_text)
    deploy(d, 'v1'); srv = serve(d, port)
    pw = await async_playwright().start(); b = await pw.chromium.launch(executable_path=CHROME)
    ctx = await b.new_context(); p = await ctx.new_page(); errs = []
    p.on('pageerror', lambda e: errs.append(str(e)))
    url = f'http://127.0.0.1:{port}/'
    await p.goto(url); await p.wait_for_timeout(1500)
    await p.evaluate("navigator.serviceWorker.ready"); await p.reload(); await p.wait_for_timeout(800)
    r = {'처음': await p.evaluate('window.APP_VERSION'), 'sw': await p.evaluate('!!navigator.serviceWorker.controller')}
    deploy(d, 'v2')
    await p.close(); p = await ctx.new_page(); p.on('pageerror', lambda e: errs.append(str(e)))   # 앱 껐다 켜기
    await p.goto(url); await p.wait_for_timeout(800)
    r['배포 뒤'] = await p.evaluate('window.APP_VERSION')
    await ctx.set_offline(True); await p.close(); p = await ctx.new_page()
    try: await p.goto(url); await p.wait_for_timeout(800); r['인터넷 없이'] = await p.evaluate('window.APP_VERSION'); r['화면'] = await p.evaluate("!!document.querySelector('#app')")
    except Exception as e: r['인터넷 없이'] = f'안 열림 {e}'[:60]
    await b.close(); await pw.stop(); srv.shutdown(); shutil.rmtree(d, ignore_errors=True)
    print(f'[{label}]', r, '| 오류:', errs[:2] or '없음')
    return r, errs

async def main():
    issues = []
    new = open(os.path.join(ROOT, 'dist', 'site', 'sw.js'), encoding='utf8').read()
    r, e = await run(new, 8795, '지금 서비스 워커')
    if not r['sw']: issues.append('서비스 워커가 앱을 맡지 않음')
    if r['배포 뒤'] != 'v2': issues.append(f"배포 뒤 다시 열었는데 예전 버전 {r['배포 뒤']}")
    if r.get('인터넷 없이') != 'v2' or not r.get('화면'): issues.append(f"인터넷 없이 열기 이상 {r.get('인터넷 없이')}")
    if e: issues.append(f'오류 {e[:2]}')
    try:
        old = subprocess.run(['git', '-C', ROOT, 'show', '1eb1a74:sw.js'], capture_output=True, text=True, check=True).stdout
        r2, _ = await run(old, 8796, '예전 서비스 워커(비교)')
        if r2['배포 뒤'] != 'v1': issues.append('예전 서비스 워커인데도 새 버전이 나옴 → 이 시뮬레이션이 10분 캐시를 못 흉내 냄')
    except subprocess.CalledProcessError: print('(예전 sw.js를 git에서 못 찾아 비교는 건너뜀)')
    print('\n===== SW_배포 =====\npage errors: 없음\nissues:', issues or '없음')

asyncio.run(main())
