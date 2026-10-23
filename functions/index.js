/* 재윤이 공부방 · 폰 알림 서버 (Firebase Cloud Functions)
   1) 알림함에 새 글(families/{fid}/notes/{id})이 생기면 → 그 알림을 받기로 한 폰(families/{fid}/push)으로 보낸다
   2) 10분마다: 오늘 공부 알림 시간이 30분 넘게 지났는데 재윤이가 아직 시작 안 했으면 → 엄마 폰으로 한 번
   지역(REGION)은 Firestore 데이터베이스 위치와 같아야 해요. 다르면 배포할 때 오류가 나니, 그때 오류에 나온 위치로 바꿔요. */
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { setGlobalOptions } = require('firebase-functions/v2');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

const REGION = process.env.JAEYUN_REGION || 'asia-northeast3';   // 서울
setGlobalOptions({ region: REGION, maxInstances: 2, memory: '256MiB' });
initializeApp();
const db = getFirestore();
const APP_URL = 'https://dlrhkdgml999-dotcom.github.io/jaeyun-room/';

/* fid 가족에서 roles 알림을 받기로 한 폰들로 보내기. 없어진 폰(앱 지움 등)은 목록에서 지운다 */
async function sendTo(fid, roles, msg) {
  const snap = await db.collection(`families/${fid}/push`).where('roles', 'array-contains-any', roles).get();
  const docs = snap.docs.filter(d => d.get('token'));
  if (!docs.length) return 0;
  const res = await getMessaging().sendEachForMulticast({
    tokens: docs.map(d => d.get('token')),
    data: { title: msg.title || '재윤이 공부방', body: String(msg.body || '').slice(0, 300), tag: msg.tag || '', url: APP_URL },
    webpush: { headers: { Urgency: 'high', TTL: String(msg.ttl || 6 * 3600) } },
  });
  const dead = [];
  res.responses.forEach((r, i) => {
    const code = r.error && r.error.code;
    if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token' || code === 'messaging/invalid-argument') dead.push(docs[i].ref.delete());
  });
  await Promise.all(dead);
  return res.successCount;
}

/* 1) 알림함 → 폰 */
exports.notePush = onDocumentCreated('families/{fid}/notes/{nid}', async (event) => {
  const n = event.data && event.data.data(); if (!n || !n.text || !n.to) return;
  if (n.at && Date.now() - n.at > 3 * 3600 * 1000) return;           // 오래된 알림(늦게 올라온 것)은 폰으로 안 보냄
  if (!['mom', 'oppa'].includes(n.to)) return;
  const tag = /공부를 모두 끝냈어요/.test(n.text) ? 'done' : /받아쓰기/.test(n.text) ? 'dict' : /시작했어요/.test(n.text) ? 'start' : '';
  await sendTo(event.params.fid, [n.to], { body: n.text, tag });
});

/* 2) 알림 시간 30분 지나도 시작 안 함 → 엄마 (하루 한 번) */
const pad = x => String(x).padStart(2, '0');
function seoulNow() {
  const d = new Date(Date.now() + 9 * 3600 * 1000);   // 한국은 서머타임이 없어서 +9시간 고정
  return { key: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`, dow: d.getUTCDay(), mins: d.getUTCHours() * 60 + d.getUTCMinutes() };
}
exports.lateNudge = onSchedule({ schedule: 'every 10 minutes', timeZone: 'Asia/Seoul' }, async () => {
  const t = seoulNow();
  const fams = new Set((await db.collectionGroup('push').select().get()).docs.map(d => d.ref.parent.parent.id));
  for (const fid of fams) {
    try {
      const base = `families/${fid}`;
      const al = ((await db.doc(`${base}/s/alarms`).get()).get('v')) || null;
      if (!al || al.nudge === false || !al.on || !al.on[t.dow]) continue;
      const [hh, mm] = String((al.time || [])[t.dow] || '16:00').split(':').map(Number);
      const late = t.mins - (hh * 60 + mm);
      if (late < 30 || late > 180) continue;
      const meta = db.doc(`${base}/meta/nudge`);
      if (((await meta.get()).get('d')) === t.key) continue;
      const day = (await db.doc(`${base}/days/${t.key}`).get()).get('v');
      if (day && day.boards && Object.keys(day.boards).length) continue;   // 이미 시작함
      await meta.set({ d: t.key, at: Date.now() });
      await sendTo(fid, ['mom'], { body: `⏰ ${pad(hh)}:${pad(mm)} 공부 알림 뒤 ${late}분이 지났는데 재윤이가 아직 시작하지 않았어요. (태블릿이 인터넷에 연결돼 있는지도 확인해 주세요)`, tag: 'late' });
    } catch (e) { console.warn('lateNudge', fid, e); }
  }
});
