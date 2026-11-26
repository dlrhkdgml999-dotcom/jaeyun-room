# 토리가 읽는 말 전부 세기 (오빠 목소리로 미리 만들 분량 가늠)
# python3 voice_inv.py [하루 수]
import asyncio, sys, json
sys.path.insert(0, '.')
from harness import Sim
DAYS = int(sys.argv[1]) if len(sys.argv) > 1 else 12

GEN = r"""
(() => {
  const ko = new Map(), en = new Map(), per = {};
  const add = (t, lang) => { if (!t) return; t = softText(String(t)).trim(); if (!t) return; const m = (lang || '').startsWith('en') ? en : ko; m.set(t, (m.get(t) || 0) + 1); };
  for (const l of ALL_L) {
    const before = ko.size + en.size;
    for (let i = 0; i < 2000; i++) {
      let q; try { q = lessonQ(l); } catch (e) { break; }
      if (q.listen) { add(q.say); add(q.listen, q.lang); } else add(q.say || q.prompt);
      if (q.read) add(q.read);
      if (q.eng) add(q.ans, 'en-US');
    }
    (l.cards || []).forEach(cd => add(cd.say));
    per[l.id] = ko.size + en.size - before;
  }
  const sum = m => [...m.keys()].reduce((a, t) => a + t.length, 0);
  return { ko:ko.size, koChars:sum(ko), en:en.size, enChars:sum(en), per, sampleKo:[...ko.keys()].slice(0, 40), sampleEn:[...en.keys()].slice(0, 15) };
})()
"""
HOOK = r"""
(() => { if (window.__said) return; window.__said = []; const o = window.speak;
  window.speak = function(t, lang, r){ window.__said.push([String(t), lang || 'ko-KR', SCREEN]); return o.apply(this, arguments); }; })()
"""
async def main():
    async with Sim('V_목소리') as s:
        await s.click('[data-a="start"]')
        r = await s.ev(GEN)
        print('문제 말(한국어):', r['ko'], '개', r['koChars'], '글자 / 영어:', r['en'], '개', r['enChars'], '글자')
        top = sorted(r['per'].items(), key=lambda x: -x[1])[:12]
        print('차시별 많은 곳:', top)
        print('예시:', *r['sampleKo'][:25], sep='\n  ')
        await s.ev(HOOK)
        for d in range(DAYS):
            try: await s.full_day()
            except Exception as e: print('day', d, e)
            await s.next_day(); await s.ev(HOOK)
        said = await s.ev('window.__said')
        json.dump(said, open('out/voice_said.json', 'w'), ensure_ascii=False)
        uniq = {}
        for t, lg, sc in said: uniq.setdefault((t, lg), sc)
        print(f'{DAYS}일 동안 실제로 읽은 말: {len(said)}번, 서로 다른 말 {len(uniq)}개, {sum(len(t) for t, _ in uniq)}글자')
        sc = {}
        for (t, lg), v in uniq.items(): sc[v] = sc.get(v, 0) + 1
        print('화면별:', sc)
if __name__ == "__main__": asyncio.run(main())
