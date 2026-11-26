# 11/27 실제 기록 점검 패치 검증
#  ① 판 사이 눈 쉬는 시간 없음 · 강의 뒤에는 그대로  ② 영어 목소리 높이 1.0·속도 0.82, 노란 버튼 두 번째는 천천히
#  ③ 듣기 문제는 소리가 끝나야 보기가 눌림  ④ 영어 듣기 첫 오답: 한국어 힌트에서 영어 낱말 빼고, 낱말은 영어로 천천히
#  ⑤ 국어 생각·느낌 힌트  ⑥ 복습 판 '약한 곳 연습'(같은 차시·같은 발문, 숫자·낱말만 바뀜)
import asyncio, sys
sys.path.insert(0, '.')
from harness import Sim

REC = r"""(() => { if (window.__utt) return; window.__utt = []; const o = speechSynthesis.speak.bind(speechSynthesis);
  speechSynthesis.speak = u => { window.__utt.push({ t:u.text, lang:u.lang, rate:u.rate, pitch:u.pitch }); return o(u); }; })()"""

def find_q(where, cond):
    return f"""(() => {{ for (const l of ALL_L.filter(l => {where})) for (let i = 0; i < 400; i++) {{ const q = lessonQ(l); if ({cond}) return q; }} return null; }})()"""

async def main():
    async with Sim('Z_1127패치') as s:
        await s.click('[data-a="start"]'); await s.p.wait_for_timeout(200)
        await s.ev(REC)
        # 재윤이 목소리 설정 그대로 (높이 1.6)
        await s.ev("S.tts = Object.assign({}, S.tts, { pitch:1.6, rate:1.02, preset:'custom' }); save()")

        # ---------- ① 눈 쉬는 시간 ----------
        await s.board('kor')
        txt = await s.ev("document.querySelector('.btn.big:last-of-type') ? [...document.querySelectorAll('.btn.big')].pop().dataset.v : ''")
        s.expect(txt in ('home', 'alldone'), f'판 끝 버튼이 눈 쉬기로 감: {txt}')
        await s.after_reward()
        s.expect(not getattr(s, 'saw_eyebreak', False), '판 사이에 눈 쉬는 시간이 나옴')
        # 강의 뒤에는 그대로 (afterLecture)
        await s.ev("RUN = { k:'math', b:{ done:false, idx:0, cur:{ test:false, lesson:ALL_L.find(l => l.subj==='math').id }, qs:[] } }; afterLecture(false)")
        s.expect(await s.screen() == 'eyebreak', '강의 뒤 눈 쉬는 시간이 안 나옴')
        await s.adult('set'); await s.open_folds()
        set_txt = await s.ev("document.body.innerText")
        s.expect('EBS 강의를 본 뒤 20초 눈 쉬는 시간' in set_txt, '설정의 눈 쉬는 시간 설명이 안 바뀜')
        await s.ev("go('home')")

        # ---------- ②③ 영어 듣기 ----------
        await s.ev("window.__dur = 600")
        q = await s.ev("window.__Q = " + find_q("l.subj==='eng'", "q.listen && q.input==='choice' && q.type==='cvc'"))
        s.expect(q is not None, '영어 cvc 듣기 문제를 못 찾음')
        await s.ev("window.__utt = []; RUN = { k:'eng', b:{ qs:[window.__Q], idx:0, correct:0, secs:0, log:[] } }; go('q')")
        await s.p.wait_for_timeout(100)
        locked = await s.ev("document.querySelector('.q-card').classList.contains('listen-wait') && RUN.listenWait")
        s.expect(locked, '듣기 문제인데 처음부터 보기가 눌림')
        await s.ev("answer(RUN.q.opts.find(o => String(o) !== String(RUN.q.ans)))")
        s.expect(await s.ev("RUN.tries") == 0, '소리 나오는 중에 답이 들어감')
        await s.p.wait_for_timeout(1500)
        s.expect(not await s.ev("RUN.listenWait"), '소리가 끝났는데 보기가 안 풀림')
        en = await s.ev("window.__utt.filter(u => (u.lang||'').startsWith('en'))")
        s.expect(en and all(abs(u['pitch'] - 1) < 1e-6 and abs(u['rate'] - .82) < 1e-6 for u in en), f'영어 목소리 높이·속도: {en}')
        ko = await s.ev("window.__utt.filter(u => !(u.lang||'').startsWith('en'))")
        s.expect(ko and all(abs(u['pitch'] - 1.6) < 1e-6 for u in ko), '한국어는 재윤이 설정(1.6) 그대로여야 함')
        # ④ 첫 오답
        await s.ev("window.__utt = []; answer(RUN.q.opts.find(o => String(o) !== String(RUN.q.ans)))")
        await s.p.wait_for_timeout(3500)
        u = await s.ev("window.__utt")
        kos = [x['t'] for x in u if not (x['lang'] or '').startswith('en')]
        ens = [x for x in u if (x['lang'] or '').startswith('en')]
        s.expect(kos and not any(c.isascii() and c.isalpha() for t in kos for c in t), f'한국어 목소리가 영어 낱말을 읽음: {kos}')
        s.expect(not any(t.startswith(('으로','로 ','는 ','은 ')) and len(t) < 3 for t in kos), f'힌트가 어색하게 잘림: {kos}')
        s.expect(ens and abs(ens[-1]['rate'] - .55) < 1e-6 and ens[-1]['t'] == q['listen'], f'힌트 뒤 영어 낱말을 천천히 안 읽음: {ens}')
        print('첫 오답 힌트:', kos, '→', [(x['t'], x['rate']) for x in ens])
        # ② 노란 버튼: 1번 보통, 2번 천천히, 3번 보통
        await s.ev("window.__utt = []")
        rates = []
        for i in range(3):
            await s.ev("ACT.replay()"); await s.p.wait_for_timeout(700)
            rates.append(await s.ev("window.__utt.filter(u => (u.lang||'').startsWith('en')).pop().rate"))
        s.expect(rates == [.82, .55, .82], f'노란 버튼 속도: {rates}')
        # 한국어 듣기 문제도 잠김이 걸리는지 (받아쓰기·듣고 고르기)
        kq = await s.ev("window.__K = " + find_q("l.subj==='kor'", "q.listen && q.input==='choice'"))
        if kq:
            await s.ev("RUN = { k:'kor', b:{ qs:[window.__K], idx:0, correct:0, secs:0, log:[] } }; go('q')")
            s.expect(await s.ev("RUN.listenWait"), '국어 듣기 문제도 들은 뒤에 눌려야 함')
            await s.p.wait_for_timeout(2000)
            s.expect(not await s.ev("RUN.listenWait"), '국어 듣기 문제 잠김이 안 풀림')
        # 듣기 아닌 문제는 바로 눌림
        await s.ev("window.__M = " + find_q("l.subj==='math'", "!q.listen && q.input==='choice'"))
        await s.ev("RUN = { k:'math', b:{ qs:[window.__M], idx:0, correct:0, secs:0, log:[] } }; go('q')")
        s.expect(not await s.ev("RUN.listenWait"), '듣기 아닌 문제가 잠김')
        await s.ev("window.__dur = 350")

        # ---------- ⑤ 국어 생각·느낌 힌트 ----------
        await s.ev("window.__F = " + find_q("l.subj==='kor'", "/생각이나 느낌/.test(q.prompt) && q.input==='choice'"))
        f = await s.ev("window.__F")
        s.expect(f is not None, '생각·느낌 문제를 못 찾음')
        if f:
            await s.ev("RUN = { k:'kor', b:{ qs:[window.__F], idx:0, correct:0, secs:0, log:[] } }; go('q')")
            await s.p.wait_for_timeout(900)
            await s.ev("window.__utt = []; answer(RUN.q.opts.find(o => String(o) !== String(RUN.q.ans)))")
            await s.p.wait_for_timeout(300)
            fb = await s.ev("document.querySelector('#fb').innerText")
            s.expect('마음이 나오는 문장' in fb and '한 일' in fb, f'생각·느낌 힌트가 안 바뀜: {fb}')
            await s.shot('feel_hint')

        # ---------- ⑥ 약한 곳 연습 ----------
        seed = r"""(() => {
          const t = todayKey(), mk = (sub, where, cond, misses) => { for (const l of ALL_L.filter(where)) for (let i = 0; i < 400; i++) { const q = lessonQ(l); if (cond(q)) { S.wrong.push({ id:q.key, subj:sub, q:JSON.parse(JSON.stringify(q)), due:addDays(t, 5), streak:0, misses, added:t, last:t }); return q.prompt; } } return null; };
          S.wrong = [];
          return [
            mk('eng', l => l.subj==='eng', q => q.type==='cvc' && q.listen, 3),
            mk('math', l => l.subj==='math', q => /뺄셈을 해요/.test(q.prompt), 2),
            mk('kor', l => l.subj==='kor', q => /생각이나 느낌/.test(q.prompt), 2)];
        })()"""
        seeded = await s.ev(seed)
        print('심은 오답:', seeded)
        qs = await s.ev("genReview(10).map(q => ({ w:!!q.weak, p:q.prompt, l:q.lesson, k:q.key }))")
        weak = [x for x in qs if x['w']]
        print('복습 10문제 중 약한 곳:', [(x['l'], x['p']) for x in weak])
        s.expect(sum(1 for x in seeded if x) <= len(weak) <= 4, f'약한 곳 문제 수가 이상함: {len(weak)}')
        subj = await s.ev("[...new Set(weakQs(3, []).map(q => q.subj))].sort().join(',')")
        s.expect(subj == 'eng,kor,math', f'약한 곳 3자리가 과목을 번갈아 안 고름: {subj}')
        # 밀린 오답이 많아도 약한 곳 자리(3개)는 남는다
        full = await s.ev("(() => { const keep = S.wrong; const t = todayKey(); const extra = []; for (let i = 0; i < 30; i++) { const l = ALL_L.find(l => l.subj==='math'); const q = lessonQ(l); extra.push({ id:'x'+i, subj:'math', q, due:addDays(t,-1), streak:0, misses:1, added:addDays(t,-20), last:addDays(t,-20) }); } S.wrong = [...keep, ...extra]; const r = genReview(10); S.wrong = keep; return [r.length, r.filter(q => q.weak).length, r.filter(q => q.rev).length]; })()")
        s.expect(full[0] == 10 and full[1] >= 3 and full[2] >= 6, f'오답이 밀렸을 때 복습 판 구성: {full}')
        same = await s.ev("(() => { const ws = S.wrong; return genReview(10).filter(q => q.weak).map(q => ws.some(w => w.q.lesson === q.lesson && (w.q.prompt === q.prompt || (feelQ(w.q) && feelQ(q))))); })()")
        s.expect(all(same), f'약한 곳 문제가 같은 발문이 아님: {same}')
        keys = [x['k'] for x in qs]
        s.expect(len(keys) == len(set(keys)), '복습 판에 같은 문제가 두 번')
        olds = await s.ev("S.wrong.map(w => w.id)")
        s.expect(not any(x['k'] in olds for x in weak), '약한 곳 문제가 원래 틀린 문제와 똑같음')
        # 기초 뺄셈(차시 없는 문제) 12−6을 틀렸으면 받아내림 있는 새 뺄셈(10−□ 말고)
        sub = await s.ev("(() => { const keep = S.wrong, t = todayKey(); S.wrong = [{ id:'math:sub:12-6', subj:'math', q:Object.assign(M.sub(), { key:'math:sub:12-6', vis:{ k:'eq', html:'12 − 6 = <span class=\"q\">?</span>' }, ans:6, subj:'math' }), due:addDays(t, 3), streak:0, misses:2, added:t, last:t }]; const r = []; for (let i = 0; i < 20; i++) r.push(...weakQs(1, []).map(q => q.vis.html.replace(/<[^>]+>/g, ''))); S.wrong = keep; return r; })()")
        bad = [x for x in sub if not __import__('re').match(r'1[1-8] − [2-9] = \?', x) or int(x.split(' ')[0]) % 10 >= int(x.split(' ')[2])]
        s.expect(len(sub) == 20 and not bad, f'12−6 약한 곳이 받아내림 뺄셈이 아님: {bad[:5]} / {len(sub)}')
        print('12−6 약한 곳 예:', sub[:6])
        # 오답이 없거나 오래된 것만 있으면 약한 곳 없음
        none = await s.ev("(() => { const keep = S.wrong; S.wrong = []; const r = genReview(10).filter(q => q.weak).length; S.wrong = keep.map(w => Object.assign({}, w, { last:addDays(todayKey(), -30) })); const r2 = genReview(10).filter(q => q.weak).length; S.wrong = keep; return [r, r2]; })()")
        s.expect(none == [0, 0], f'오답이 없거나 오래됐는데 약한 곳이 나옴: {none}')
        # 복습 판 화면에 꼬리표
        await s.ev("RUN = { k:'rev', b:{ qs:genReview(10).sort((a, b) => (b.weak ? 1 : 0) - (a.weak ? 1 : 0)), idx:0, correct:0, secs:0, log:[] } }; go('q')")
        s.expect('헷갈렸던 것 한 번 더' in await s.ev("document.body.innerText"), '약한 곳 꼬리표가 안 보임')
        await s.shot('weak_pill')
        # 진짜 하루: 복습 판까지 끝까지 (틀리기 섞어서)
        await s.ev("go('home')")
        await s.next_day()
        await s.full_day(lambda i: 'once' if i % 4 == 1 else ('twice' if i % 7 == 3 else None))
        s.expect(await s.ev("!!day().done"), '하루 공부가 안 끝남')
        s.expect(not getattr(s, 'saw_eyebreak', False), '하루 동안 판 사이 눈 쉬기가 나옴')
asyncio.run(main())
