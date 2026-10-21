"""펜 + 손바닥: 펜으로 쓰는 동안 손바닥이 닿아도 선이 안 그려지는지, 펜이 없으면 손가락으로 쓸 수 있는지"""
import asyncio, sys
sys.path.insert(0, '.')
from harness import Sim
JS = """async (mode) => {
  S.dictMode = 'pen'; RUN = { k:'eng', b:{ qs:[], idx:0, correct:0, secs:0, phase:'eng', cur:{ subj:'eng', lesson:'e6-2', test:false, items:[] } } }; PEN = { drawn:false }; go('write');
  await new Promise(r => setTimeout(r, 200));
  const cv = document.querySelector('#pen'), b = cv.getBoundingClientRect();
  const ev = (t, id, type, x, y) => cv.dispatchEvent(new PointerEvent(t, { pointerId:id, pointerType:type, clientX:b.left + x, clientY:b.top + y, pressure:.5, bubbles:true, cancelable:true }));
  const ink = (x, y) => { const c = cv.getContext('2d').getImageData(Math.round(x * cv.width / b.width), Math.round(y * cv.height / b.height), 1, 1).data; return c[0] < 120; };
  if (mode === 'palm') {
    ev('pointerdown', 2, 'pen', 40, 40); for (let i = 1; i <= 20; i++) ev('pointermove', 2, 'pen', 40 + i * 8, 40);
    ev('pointerdown', 7, 'touch', 200, 100); for (let i = 1; i <= 10; i++) ev('pointermove', 7, 'touch', 200 + i * 5, 100 + i * 2);   // 손바닥
    for (let i = 21; i <= 30; i++) ev('pointermove', 2, 'pen', 40 + i * 8, 40); ev('pointerup', 2, 'pen', 280, 40); ev('pointerup', 7, 'touch', 250, 120);
    ev('pointerdown', 8, 'touch', 100, 125); ev('pointermove', 8, 'touch', 160, 125); ev('pointerup', 8, 'touch', 160, 125);   // 펜 쓴 뒤 손가락
    const px = (x, y) => Array.from(cv.getContext('2d').getImageData(Math.round(x * cv.width / b.width), Math.round(y * cv.height / b.height), 1, 1).data); return { pen:ink(120, 40) && ink(260, 40), palm:ink(225, 110), finger:ink(130, 125), dbg:[px(325, 110), px(325, 60), b.width, b.height, cv.width, cv.height] };
  }
  PEN.penSeen = false; setupPen(2);
  ev('pointerdown', 9, 'touch', 60, 100); for (let i = 1; i <= 10; i++) ev('pointermove', 9, 'touch', 60 + i * 10, 100); ev('pointerup', 9, 'touch', 160, 100);
  return { finger:ink(110, 100) };
}"""
async def main():
    async with Sim('P_펜과 손바닥') as s:
        await s.click('[data-a="start"]')
        r = await s.p.evaluate(JS, 'palm'); print('펜 쓰는 중 손바닥:', r)
        s.expect(r['pen'], '펜 선이 안 그려짐'); s.expect(not r['palm'], '손바닥이 선으로 그려짐'); s.expect(not r['finger'], '펜을 쓴 뒤 손가락이 그려짐')
        r2 = await s.p.evaluate(JS, 'finger'); print('펜 없이 손가락:', r2)
        s.expect(r2['finger'], '펜이 없을 때 손가락으로 못 씀')
asyncio.run(main())
