"""진짜 Firestore가 거부하는 값 찾기 (가짜 서버 mockfb.js는 아무거나 저장해서 못 잡음)
태블릿에서 며칠 공부(펜 받아쓰기·사진 포함)한 뒤, 서버로 보낼 모든 문서를 Firestore 규칙으로 검사:
- 배열 안에 배열 (Nested arrays are not supported)
- undefined, 함수, NaN 아닌 이상한 값
- 빈 이름 칸, __이름__ 칸
- 문서 크기 1MB 넘음
"이상: 0"이어야 함"""
import asyncio, sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import Sim
from sim_month import FAST, DAY

CHECK = r"""() => {
  const bad = [];
  const walk = (v, path, inArr) => {
    if (v === undefined) { bad.push(path + ' = undefined'); return 0; }
    if (typeof v === 'function') { bad.push(path + ' = 함수'); return 0; }
    if (typeof v === 'number' && !isFinite(v) && !isNaN(v)) return 8;
    if (v === null || typeof v === 'boolean') return 1;
    if (typeof v === 'number') return 8;
    if (typeof v === 'string') return v.length + 1;
    if (Array.isArray(v)) { let s = 0; v.forEach((x, i) => { if (Array.isArray(x)) bad.push(path + '[' + i + '] 배열 안 배열'); s += walk(x, path + '[' + i + ']', true); }); return s; }
    if (typeof v === 'object') { let s = 0; for (const k in v) { if (k === '' || /^__.*__$/.test(k)) bad.push(path + ' 이상한 칸 이름 "' + k + '"'); s += k.length + 1 + walk(v[k], path + '.' + k); } return s + 32; }
    bad.push(path + ' = ' + typeof v); return 0;
  };
  const docs = [];
  [...KID_KEYS, ...ADULT_KEYS].forEach(k => { const v = Sync.pack(S[k]); if (v === undefined) return; docs.push(['s/' + k, { v, at:1, by:'kid' }]); });
  Object.keys(S.days).forEach(k => docs.push(['days/' + k, { v:Sync.pack(S.days[k]), at:1 }]));
  const sizes = [];
  docs.forEach(([p, d]) => { const n = walk(d, p); sizes.push([p, n]); if (n > 1000000) bad.push(p + ' 크기 ' + n); });
  sizes.sort((a, b) => b[1] - a[1]);
  // 보냈다 받으면 원래와 똑같은지 (엄마 폰에서 문제 기록이 그대로 보여야 함)
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  Object.keys(S.days).forEach(k => { const back = Sync.unpack(JSON.parse(JSON.stringify(Sync.pack(S.days[k])))); if (!same(back, S.days[k])) bad.push('days/' + k + ' 되돌리면 달라짐'); });
  [...KID_KEYS, ...ADULT_KEYS].forEach(k => { if (S[k] === undefined) return; const back = Sync.unpack(JSON.parse(JSON.stringify(Sync.pack(S[k])))); if (!same(back, S[k])) bad.push('s/' + k + ' 되돌리면 달라짐'); });
  // 일부러 이상한 값: 배열 안 배열 안 배열, 빈 칸
  const odd = { a:[[1, [2, 3]], [], [[]]], b:[1, , 3] };
  const ob = Sync.unpack(JSON.parse(JSON.stringify(Sync.pack(odd))));
  if (JSON.stringify(ob) !== JSON.stringify(odd)) bad.push('이상한 값 되돌리기 실패 ' + JSON.stringify(ob));
  return { bad, big: sizes.slice(0, 5) };
}"""

async def main():
    days = int(sys.argv[1]) if len(sys.argv) > 1 else 4
    async with Sim('fs_check') as s:
        await s.ev("go('home')")
        for d in range(days):
            await s.ev(f"S.dayOffset = {d}; saveLocal(); go('home')")
            await s.ev("window.__oST = window.__oST || window.setTimeout")
            await s.ev(FAST)
            await s.p.evaluate(f"({DAY})(0.8)")
            await s.ev("window.setTimeout = window.__oST; window.__dur = 350")
        # 펜 받아쓰기 흔적이 없으면 흉내 내서 넣기 (실제 태블릿 데이터 모양)
        r = await s.p.evaluate(CHECK)
        bad = r['bad']
        seen = {}
        for b in bad:
            key = b.split('[')[0] if '배열' in b else b
            seen[key] = seen.get(key, 0) + 1
        print('가장 큰 문서:', r['big'])
        print('이상:', len(bad))
        for k, n in list(seen.items())[:30]: print(f'  {k}  ({n}곳)')
        s.expect(not bad, f'Firestore가 거부할 값 {len(bad)}곳')

asyncio.run(main())
