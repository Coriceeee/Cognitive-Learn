/** CLA Companion web-push policy — pure functions, no Firebase dependencies.
 * Times are per registered device IANA zone. A reminder is a best-effort
 * notification, not a guarantee of delivery at a precise minute.
 */
export const REMINDER_KINDS = Object.freeze(['morning', 'study', 'checkIn']);
export const PUSH_NOTIFICATION = Object.freeze({
  title: 'CLA · Daily Companion',
  body: 'Đến giờ dành một chút thời gian cho kế hoạch học tập. Mở CLA để xem nhé.',
  url: '/student/companion',
});

const clockPattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
export const isClock = value => typeof value === 'string' && clockPattern.test(value);
export const isDayKey = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
function minutes(s) { const [h,m] = s.split(':').map(Number); return h * 60 + m; }
export function isQuiet(clock, start, end) {
  if (![clock,start,end].every(isClock)) return true;
  const n=minutes(clock), a=minutes(start), b=minutes(end);
  return a === b ? false : a < b ? n >= a && n < b : n >= a || n < b;
}
export function isValidZone(zone) {
  if (typeof zone !== 'string' || zone.length > 64) return false;
  try { new Intl.DateTimeFormat('en-US',{timeZone:zone}); return true; } catch { return false; }
}
export function civilTime(at, zone) {
  if (!(at instanceof Date) || !Number.isFinite(at.getTime()) || !isValidZone(zone)) return null;
  const pieces=new Intl.DateTimeFormat('en-GB',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(at);
  const get=type=>pieces.find(part=>part.type===type)?.value;
  const hour=get('hour') === '24' ? '00' : get('hour');
  return {date:`${get('year')}-${get('month')}-${get('day')}`,clock:`${hour}:${get('minute')}`};
}
export function validSettings(s) {
  return !!s && s.schemaVersion===1 && s.enabled===true && !!s.schedule
    && REMINDER_KINDS.every(k=>isClock(s.schedule[k]))
    && isClock(s.quietStart) && isClock(s.quietEnd)
    && Array.isArray(s.completedDays) && s.completedDays.every(isDayKey);
}
/** Five-minute interval is evaluated in *absolute minutes*, including across midnight/DST.
 * Ledger keys dedupe repeated local times on the DST fall-back transition.
 */
export function dueForDevice(settings, zone, now, lookbackMinutes=4) {
  if (!validSettings(settings) || !isValidZone(zone) || !Number.isInteger(lookbackMinutes) || lookbackMinutes<0 || lookbackMinutes>9) return [];
  const unique=new Map();
  for (let offset=0;offset<=lookbackMinutes;offset++) {
    const time=civilTime(new Date(now.getTime()-offset*60_000),zone);
    if (!time || settings.completedDays.includes(time.date)
      || isQuiet(time.clock,settings.quietStart,settings.quietEnd)) continue;
    for (const kind of REMINDER_KINDS) if (settings.schedule[kind]===time.clock) {
      unique.set(`${time.date}_${kind}`, {kind,date:time.date});
    }
  }
  return [...unique.values()];
}
export function deliveryKey(date,kind,deviceId) {
  if (!isDayKey(date) || !REMINDER_KINDS.includes(kind) || typeof deviceId!=='string' || !/^[a-f0-9]{32}$/.test(deviceId)) throw new Error('Invalid delivery identifier');
  return `${date}_${kind}_${deviceId}`;
}
export function hasActiveConsent(c,uid) {
  return !!c && c.userId===uid && c.schemaVersion===1 && c.noticeVersion==='cla-student-privacy-v1'
    && c.productAccepted===true && c.researchConsent===false;
}
export function hasActiveStudentAccount(a) { return !!a && a.role==='student' && a.active===true; }
// Avoid SSRF: only recognized Web Push endpoints are eligible for server dispatch.
export function validPushEndpoint(endpoint) {
  if (typeof endpoint !== 'string' || endpoint.length > 2048) return false;
  try {
    const parsed=new URL(endpoint);
    if (parsed.protocol!=='https:' || parsed.port || parsed.username || parsed.password || !parsed.pathname.startsWith('/')) return false;
    const host=parsed.hostname.toLowerCase();
    return host==='fcm.googleapis.com' || host==='android.googleapis.com'
      || host==='updates.push.services.mozilla.com' || host==='web.push.apple.com'
      || /^[a-z0-9-]+\.notify\.windows\.com$/.test(host);
  } catch { return false; }
}
export function validDevice(d, uid) {
  return !!d && d.userId===uid && d.schemaVersion===1 && d.enabled===true
    && isValidZone(d.timeZone) && validPushEndpoint(d.endpoint)
    && typeof d.keys?.p256dh==='string' && /^[A-Za-z0-9_-]{40,200}$/.test(d.keys.p256dh)
    && typeof d.keys?.auth==='string' && /^[A-Za-z0-9_-]{10,60}$/.test(d.keys.auth);
}
export function safePayload(kind) {
  if (!REMINDER_KINDS.includes(kind)) throw new Error('Invalid reminder kind');
  return JSON.stringify({type:'cla-companion-reminder',kind});
}
