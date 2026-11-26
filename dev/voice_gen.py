import asyncio, sys, json
sys.path.insert(0, '.')
from harness import Sim
from voice_inv import GEN
async def main():
    async with Sim('V_문제말') as s:
        await s.click('[data-a="start"]')
        r = await s.ev(GEN)
        json.dump(r, open('out/voice_gen.json','w'), ensure_ascii=False)
        print('문제 말(한국어):', r['ko'], '개', r['koChars'], '글자 / 영어:', r['en'], '개', r['enChars'], '글자')
        print(sorted(r['per'].items(), key=lambda x: -x[1])[:15])
asyncio.run(main())
