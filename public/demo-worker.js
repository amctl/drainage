/* Browser-only simulator. No photo or report is forwarded or persisted. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin === self.location.origin && url.pathname === '/api/verify' && event.request.method === 'POST') {
    event.respondWith((async () => {
      try {
        const data = await event.request.formData();
        if (!data.get('photo')) return Response.json({ error: 'Missing demo photo' }, { status: 400 });
        await new Promise(resolve => setTimeout(resolve, 1600));
        if (data.get('outcome') === 'error') return Response.json({ simulated: true, error: 'Requested demo failure' }, { status: 422 });
        return Response.json({ simulated: true, location: 'Simulated Connaught Place', duplicateCheck: 'simulated', message: 'Demo checks passed. Nothing has been published or sent to an authority.' });
      } catch {
        return Response.json({ error: 'Unable to read demo photo' }, { status: 400 });
      }
    })());
  }
});
