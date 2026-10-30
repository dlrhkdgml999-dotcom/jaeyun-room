"""오답노트 같이 풀기: 모든 문제를 태블릿에서 재윤이가 직접 답하기 (2026-10-30 오빠 요청)
- 태블릿 가로(1280×800): 원래 문제 모양을 아는 것(보기·숫자·글자 블록) + 모르는 것(기록에서 되살림)
  [보기 …] → 보기 문제, 숫자 답 → 숫자판, 짧은 낱말(국어·영어) → 글자 블록, 띄어 쓴 짧은 말 → 낱말 블록,
  긴 답 → 펜으로 쓰기, 받아쓰기 → 펜으로 쓰기 → 쓴 글씨 옆 정답 → 엄마 ⭕/❌
- 블록: 맞게 만들면 다음, 한 번 틀리면 비우고 다시, 두 번 틀리면 정답 · 블록 빼기(누르면 그 뒤로 지워짐)
- 펜: 안 쓰고 "다 썼어요" → 안 넘어감
- 폰(384): 받아쓰기·긴 답은 예전처럼 정답 보기 → 엄마 ⭕/❌
- 화면 넘침 없음, 원래 문제(S.wrong) 안 바뀜"""
import asyncio, sys
sys.path.insert(0, '.')
from harness import Sim

SETUP = r"""(() => {
  const k = addDays(todayKey(), -1);
  S.days[k] = S.days[k] || { boards:{}, dict:null, earned:[], bonus:false, done:false, m2:false };
  const L = (t, a, subj) => [t, a, '틀린답', 0, 20, subj];
  const orig = [
    { key:'t:c', subj:'math', prompt:'5보다 2 큰 수는?', input:'choice', opts:['6','7','8'], ans:'7', hint:'h', explain:'e' },
    { key:'t:n', subj:'math', prompt:'8 + 5 = ?', input:'numpad', ans:13, hint:'h', explain:'e' },
    { key:'t:b', subj:'kor', prompt:'잘 듣고 글자 블록으로 만들어요', listen:'나비', vis:{k:'pic', e:'🦋'}, input:'build', tiles:['비','나','낙','빈'], ans:'나비', hint:'h', explain:'e' },
  ];
  S.wrong = orig.map(q => ({ id:q.key, subj:q.subj, q:JSON.parse(JSON.stringify(q)), due:todayKey(), streak:0, misses:1, added:k, last:k }));
  const logs = orig.map(q => L(qBrief(q), String(q.ans), q.subj)).concat([
    L('알맞은 말을 골라요 · [보기 사과 · 바나나 · 포도]', '포도', 'kor'),      // 원래 모양 없음 + 보기
    L('10개씩 묶음 3개 + 낱개 4개는?', '34', 'math'),
    L('그림에 맞는 낱말은? · 🐯', '호랑이', 'kor'),
    L('What is this? · 🐱', 'cat', 'eng'),
    L('빈칸에 알맞은 말: 나는 ___ 먹어요', '밥을 맛있게', 'kor'),
    L('흉내 내는 말을 넣어 문장을 지어 봐요', '토끼가 깡충깡충 뛰어가요 빨리빨리 아주아주 멀리', 'kor'),
  ]);
  S.days[k].boards.kor = { done:true, idx:0, qs:[], secs:300, correct:0, log:logs };
  S.days[k].dict = { words:['학교','가방'], idx:2, photo:null, graded:true, sent:true };
  S.grades = S.grades || {}; S.grades[k] = { marks:[false, true], graded:true, score:1 };
  window.__wrongBefore = JSON.stringify(S.wrong);
  saveLocal(); go('home');
  return notebookItems().filter(x => !x.fixed).length;
})()"""

async def play(s, p, plan, tag):
    await s.ev("NOTE.subj = 'all'; go('notebook', { from:'home' })"); await p.wait_for_timeout(150)
    await s.click('[data-a="nbplay"]'); await p.wait_for_timeout(250)
    n = await s.ev("NBP.items.length"); seen = {}; right = 0
    for i in range(n):
        await p.wait_for_timeout(120)
        info = await s.ev("({ mode:NBP.mode, a:String(NBP.items[NBP.i].a), subj:NBP.items[NBP.i].subj, q:NBP.q && { opts:NBP.q.opts, tiles:NBP.q.tiles, parts:NBP.q.parts, sep:NBP.q.sep, ans:String(NBP.q.ans) } })")
        mode, a = info['mode'], info['a']; seen.setdefault(mode, []).append(a)
        want = plan(i, info)   # True 맞히기 / False 두 번 틀리기
        await s.overflow(f'{tag} 같이 풀기 {mode} {a}')
        if i < 12: await s.shot(f'{tag}_{i}_{mode}')
        if mode == 'choice':
            opts = info['q']['opts']; wr = [k for k, o in enumerate(opts) if str(o) != a]
            if want: await p.locator('[data-a="nbans"]').nth([str(o) for o in opts].index(a)).click()
            else:
                await p.locator('[data-a="nbans"]').nth(wr[0]).click(); await p.wait_for_timeout(80)
                if len(wr) > 1: await p.locator('[data-a="nbans"]').nth(wr[1]).click()
                else: await p.locator('[data-a="nbans"]').nth([str(o) for o in opts].index(a)).click(); want = True
        elif mode == 'numpad':
            ans = str(int(a)); tries = [ans] if want else [str(int(ans) + 1)] * 2
            for t in tries:
                for ch in t: await p.locator(f'[data-a="nbnum"][data-v="{ch}"]').click()
                await p.locator('[data-a="nbnum"][data-v="ok"]').click(); await p.wait_for_timeout(80)
        elif mode == 'build':
            q = info['q']; tiles = q['tiles']; parts = q['parts'] or list(a)
            def idxs(seq):
                used, out = set(), []
                for ch in seq:
                    k = next(k for k, t in enumerate(tiles) if t == ch and k not in used); used.add(k); out.append(k)
                return out
            right_idx = idxs(parts)
            # 블록 빼기: 두 개 누르고 첫 칸 눌러 비우기
            if len(parts) >= 2:
                for k in right_idx[:len(parts) - 1]: await p.locator('[data-a="nbtile"]').nth(k).click()
                await p.locator('[data-a="nbunbuild"]').nth(0).click(); await p.wait_for_timeout(50)
                s.expect(await s.ev("NBP.built.length") == 0, f'{a}: 첫 칸을 눌렀는데 블록이 안 빠짐')
            if want:
                for k in right_idx: await p.locator('[data-a="nbtile"]').nth(k).click()
            else:
                wrong_seq = list(reversed(right_idx)) if len(set(parts)) > 1 else None
                for t in range(2):
                    for k in wrong_seq: await p.locator('[data-a="nbtile"]').nth(k).click()
                    await p.wait_for_timeout(450)
                    if t == 0:
                        s.expect(await s.ev("NBP.i") == i and await s.ev("NBP.built.length") == 0, f'{a}: 블록을 한 번 틀렸는데 안 비워지거나 넘어감')
            await p.wait_for_timeout(400)
        elif mode == 'pen':
            await s.click('[data-a="nbpendone"]'); await p.wait_for_timeout(60)
            s.expect(not await s.ev("NBP.show"), f'{a}: 펜으로 안 썼는데 다 썼어요가 넘어감')
            box = await p.locator('#pen').bounding_box()
            await p.mouse.move(box['x'] + 40, box['y'] + 40); await p.mouse.down(); await p.mouse.move(box['x'] + 200, box['y'] + 120, steps=8); await p.mouse.up()
            await s.click('[data-a="nbpendone"]'); await p.wait_for_timeout(150)
            s.expect(await s.ev("!!document.querySelector('.nb-ink img') && !!document.querySelector('.nb-a b')"), f'{a}: 쓴 글씨 옆에 정답이 안 보임')
            await s.shot(f'{tag}_{i}_pen_judge')
            await s.click(f'[data-a="nbjudge"][data-v="{1 if want else 0}"]')
        else:   # mom
            await s.click('[data-a="nbreveal"]'); await p.wait_for_timeout(60)
            await s.click(f'[data-a="nbjudge"][data-v="{1 if want else 0}"]')
        right += 1 if want else 0
        await p.wait_for_timeout(2400)
        s.expect(await s.ev("NBP && NBP.i") == i + 1, f'{i + 1}번째({mode} {a}) 뒤에 다음으로 안 넘어감')
    got = await s.ev("NBP.right")
    s.expect(got == right, f'{tag}: 맞힌 수 {got} != {right}')
    await s.click('[data-a="nbdone"]')
    return seen, n, right

async def main():
    async with Sim('N_오답노트입력') as s:
        p = s.p
        await s.click('[data-a="start"]')
        await p.set_viewport_size({'width': 1280, 'height': 800})
        await s.ev("Object.defineProperty(screen, 'width', { get:() => 1280, configurable:true }); Object.defineProperty(screen, 'height', { get:() => 800, configurable:true })")
        todo = await s.ev(SETUP); print('다시 풀 문제:', todo)
        seen, n, right = await play(s, p, lambda i, info: True, 'tab')
        print('[태블릿] 입력 모양:', {k: v for k, v in seen.items()})
        s.expect('mom' not in seen, f"태블릿인데 엄마만 판정하는 문제가 남음 {seen.get('mom')}")
        for m in ['choice', 'numpad', 'build', 'pen']: s.expect(m in seen, f'{m} 모양이 안 나옴')
        s.expect('포도' in seen.get('choice', []), '[보기]가 남은 문제가 보기 문제로 안 됨')
        s.expect('34' in seen.get('numpad', []), '숫자 답이 숫자판으로 안 됨')
        for w in ['나비', '호랑이', 'cat', '밥을 맛있게']: s.expect(w in seen.get('build', []), f'{w}: 블록 문제로 안 됨')
        for w in ['학교']: s.expect(w in seen.get('pen', []), f'{w}: 받아쓰기가 펜으로 안 됨')
        s.expect(await s.ev("JSON.stringify(S.wrong.map(w => w.q))") == await s.ev("JSON.stringify(JSON.parse(window.__wrongBefore).filter(w => S.wrong.some(y => y.id === w.id)).map(w => w.q))"), '같이 풀기가 원래 문제(S.wrong)의 모양을 바꿈')
        left = await s.ev("notebookItems().filter(x => !x.fixed).length")
        print('다 맞힌 뒤 남은 문제:', left)
        s.expect(left == 0, f'다 맞혔는데 오답노트에 {left}개 남음')
        # 두 번 틀리기 → 그대로 남음
        await s.ev("S.days = {}; S.grades = {}; saveLocal()")
        await s.ev(SETUP)
        seen2, n2, r2 = await play(s, p, lambda i, info: i % 2 == 0, 'tab2')
        left2 = await s.ev("notebookItems().filter(x => !x.fixed).length")
        print('반만 맞힌 뒤 남은 문제:', left2, '/', n2)
        s.expect(left2 == n2 - r2, f'틀린 문제 수가 안 맞음 {left2} != {n2 - r2}')
        # 폰: 받아쓰기·긴 답은 정답 보기 → 엄마 판정
        await p.set_viewport_size({'width': 384, 'height': 832})
        await s.ev("Object.defineProperty(screen, 'width', { get:() => 384, configurable:true }); Object.defineProperty(screen, 'height', { get:() => 832, configurable:true })")
        await s.ev("S.days = {}; S.grades = {}; saveLocal()"); await s.ev(SETUP)
        seen3, _, _ = await play(s, p, lambda i, info: True, 'phone')
        print('[폰] 입력 모양:', {k: len(v) for k, v in seen3.items()})
        s.expect('pen' not in seen3 and 'mom' in seen3, '폰에서 받아쓰기가 정답 보기로 안 됨')

asyncio.run(main())
