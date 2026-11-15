/* CLA PWA service worker (Web Push receive-only). No fetch handler; no cached
 * authenticated pages or student data. Backend sends a minimal data payload.
 * Never put scores, profiles, recommendation details or tokens in notifications.
 */
self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let data;
    try { data=event.data?.json(); } catch { return; }
    if (data?.type!=='cla-companion-reminder'
      || !['morning','study','checkIn'].includes(data.kind)) return;
    await self.registration.showNotification('CLA · Daily Companion', {
      body:'Đến giờ dành một chút thời gian cho kế hoạch học tập. Mở CLA để xem nhé.',
      icon:'/cla-icon-192.png',
      tag:`cla-remote-${data.kind}`, renotify:false,
      data:{url:'/student/companion'},
    });
  })());
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const target=new URL('/student/companion',self.location.origin).href;
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    const existing=windows.find(client => new URL(client.url).origin===self.location.origin);
    if (existing) { await existing.focus(); if ('navigate' in existing) await existing.navigate(target); }
    else await self.clients.openWindow(target);
  })());
});
