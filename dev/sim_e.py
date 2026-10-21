import asyncio, sys
sys.path.insert(0,'.')
from harness import Sim
async def main():
    async with Sim('E_목소리') as s:
        p=s.p
        await s.ev("""(()=>{ const vs=[{name:'ko-kr-x-ism-network',lang:'ko-KR',localService:false},{name:'ko-kr-x-kod-local',lang:'ko-KR',localService:true},{name:'Samsung 여성 1',lang:'ko_KR',localService:true},{name:'en-us-x-sfg-network',lang:'en-US',localService:false}];
          speechSynthesis.getVoices=()=>vs; const o=speechSynthesis.speak; speechSynthesis.speak=(u)=>{ (window.__u=window.__u||[]).push([u.text,u.pitch,u.rate,u.voice&&u.voice.name]); o.call(speechSynthesis,u); }; loadVoices(); })()""")
        await s.click('[data-a="start"]')
        await s.adult('set'); await s.shot('settings')
        n = await p.locator('[data-a="ttsvoice"]').count(); s.expect(n==3, f'한국어 목소리 목록 {n}개')
        await s.click('[data-a="ttspreset"][data-v="sister"]'); await p.wait_for_timeout(200)
        await s.click('[data-a="ttsvoice"][data-v="Samsung 여성 1"]'); await p.wait_for_timeout(200)
        await p.locator('#ttspitch').fill('1.5'); await p.wait_for_timeout(200)
        await s.click('[data-a="ttstest"]'); await p.wait_for_timeout(200)
        u = await s.ev('window.__u'); print(*u, sep='\n')
        last=u[-1]; s.expect(abs(last[1]-1.5)<1e-6 and last[3]=='Samsung 여성 1', f'설정이 목소리에 반영 안 됨: {last}')
        # 영어는 영어 목소리로
        await s.ev("speak('apple','en-US')"); await p.wait_for_timeout(100)
        u = await s.ev('window.__u'); s.expect(u[-1][3]=='en-us-x-sfg-network', f'영어 목소리 이상: {u[-1]}')
        # 다시 열어도 유지
        await p.reload(); await p.wait_for_timeout(300)
        t = await s.ev('S.tts'); print('저장된 설정:', t); s.expect(t['voice']=='Samsung 여성 1', '목소리 설정이 저장 안 됨')
        await s.overflow('settings')
asyncio.run(main())
