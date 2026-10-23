/* 재윤이 공부방 · 알림 서버 (구글 Apps Script, 무료)
   - 재윤이 태블릿·폰에서 알림이 생기면 이 스크립트로 보내고 → 엄마·오빠 폰으로 앱 알림을 보낸다 (Firebase 클라우드 메시징)
   - 10분마다: 공부 알림 시간이 30분 넘게 지났는데 재윤이가 아직 시작 안 했으면 → 엄마 폰으로 하루 한 번
   - 매주 월요일 주간 리포트 메일 (메일 주소를 넣었을 때만)
   처음 한 번: 위쪽 함수 고르는 곳에서 setup 을 고르고 ▶ 실행 → 권한 허용. 실행 로그에 "준비 끝"이 나오면 성공 */
const KEY = '{{KEY}}';
const TO = '{{TO}}';
const FID = '{{FID}}';
const PROJECT = 'jaeyun-room';
const APP_URL = 'https://dlrhkdgml999-dotcom.github.io/jaeyun-room/';

function doPost(e) {
  let d = {};
  try { d = JSON.parse(e.postData.contents); } catch (x) { return out_('no'); }
  if (d.key !== KEY) return out_('no');
  if (d.type === 'note') {
    if (!['mom', 'oppa'].includes(d.to) || !d.text) return out_('no');
    if (d.at && Date.now() - d.at > 3 * 3600 * 1000) return out_('old');   // 늦게 올라온 오래된 알림은 폰으로 안 보냄
    return out_('sent ' + pushTo_([d.to], String(d.text).slice(0, 300), tagOf_(d.text)));
  }
  if (!TO || !d.subject) return out_('no');
  MailApp.sendEmail({ to: TO, subject: String(d.subject).slice(0, 100), htmlBody: String(d.html || '').slice(0, 20000) });
  return out_('ok');
}
function out_(s) { return ContentService.createTextOutput(s); }
function tagOf_(t) { return /공부를 모두 끝냈어요/.test(t) ? 'done' : /받아쓰기/.test(t) ? 'dict' : /시작했어요/.test(t) ? 'start' : ''; }

/* ---------- Firestore (오빠 계정 권한으로 읽기) ---------- */
function auth_() { return { Authorization: 'Bearer ' + ScriptApp.getOAuthToken(), 'x-goog-user-project': PROJECT }; }
function fs_(path, method) {
  const r = UrlFetchApp.fetch('https://firestore.googleapis.com/v1/projects/' + PROJECT + '/databases/(default)/documents/' + path,
    { method: method || 'get', headers: auth_(), muteHttpExceptions: true });
  const code = r.getResponseCode(); let json = {};
  try { json = JSON.parse(r.getContentText() || '{}'); } catch (x) {}
  if (code >= 400 && code !== 404) throw new Error('Firestore ' + code + ' ' + String(r.getContentText()).slice(0, 300));
  return { code: code, json: json };
}
/* Firestore 값 → 보통 값 */
function val_(v) {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(val_);
  if ('mapValue' in v) { const o = {}, f = v.mapValue.fields || {}; for (const k in f) o[k] = val_(f[k]); return o; }
  return null;
}
function doc_(path) { const r = fs_(path); if (r.code === 404) return null; const o = {}, f = r.json.fields || {}; for (const k in f) o[k] = val_(f[k]); return o; }

/* ---------- 폰 알림 보내기 ---------- */
function pushTo_(roles, body, tag) {
  const list = (fs_('families/' + FID + '/push?pageSize=50').json.documents || [])
    .map(function (d) { return { name: d.name, token: val_((d.fields || {}).token), roles: val_((d.fields || {}).roles) || [] }; })
    .filter(function (d) { return d.token && d.roles.some(function (r) { return roles.indexOf(r) >= 0; }); });
  let ok = 0;
  list.forEach(function (d) {
    const r = UrlFetchApp.fetch('https://fcm.googleapis.com/v1/projects/' + PROJECT + '/messages:send', {
      method: 'post', contentType: 'application/json', headers: auth_(), muteHttpExceptions: true,
      payload: JSON.stringify({ message: { token: d.token, data: { title: '재윤이 공부방', body: body, tag: tag || '', url: APP_URL },
        webpush: { headers: { Urgency: 'high', TTL: '21600' } } } }) });
    const code = r.getResponseCode();
    if (code === 200) ok++;
    else if (code === 404 || /UNREGISTERED|INVALID_ARGUMENT/.test(r.getContentText())) {   // 앱을 지웠거나 알림을 끈 폰 → 목록에서 지움
      UrlFetchApp.fetch('https://firestore.googleapis.com/v1/' + d.name, { method: 'delete', headers: auth_(), muteHttpExceptions: true });
    } else console.warn('FCM ' + code + ' ' + r.getContentText().slice(0, 300));
  });
  return ok;
}

/* ---------- 10분마다: 알림 시간 지났는데 시작 안 함 ---------- */
function checkLate() {
  const now = new Date(), key = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd');
  const dow = Number(Utilities.formatDate(now, 'Asia/Seoul', 'u')) % 7;   // 0 = 일요일
  const mins = Number(Utilities.formatDate(now, 'Asia/Seoul', 'H')) * 60 + Number(Utilities.formatDate(now, 'Asia/Seoul', 'm'));
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('late') === key) return;
  const a = doc_('families/' + FID + '/s/alarms'), al = a && a.v;
  if (!al || al.nudge === false || !al.on || !al.on[dow]) return;
  const t = String((al.time || [])[dow] || '16:00').split(':'), hh = Number(t[0]), mm = Number(t[1]);
  const late = mins - (hh * 60 + mm);
  if (late < 30 || late > 180) return;
  const day = doc_('families/' + FID + '/days/' + key), v = day && day.v;
  if (v && v.boards && Object.keys(v.boards).length) return;   // 이미 시작함
  props.setProperty('late', key);
  pushTo_(['mom'], '⏰ ' + t[0] + ':' + t[1] + ' 공부 알림 뒤 ' + late + '분이 지났는데 재윤이가 아직 시작하지 않았어요. (태블릿이 인터넷에 연결돼 있는지도 확인해 주세요)', 'late');
}

/* ---------- 처음 한 번 실행 ---------- */
function setup() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'checkLate') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('checkLate').timeBased().everyMinutes(10).create();
  const fam = doc_('families/' + FID);
  if (!fam) throw new Error('가족방을 못 찾았어요. 앱 설정 탭의 코드를 다시 복사해 주세요');
  const phones = (fs_('families/' + FID + '/push?pageSize=50').json.documents || []).length;
  console.log('준비 끝! 알림 받는 폰 ' + phones + '대' + (phones ? '' : ' (폰에서 "알림 켜기"를 누르면 생겨요)'));
}
