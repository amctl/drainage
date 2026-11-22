self.addEventListener('push', (event) => {
  let payload = {}
  try { payload = event.data ? event.data.json() : {} } catch { payload = { body: event.data?.text() || '' } }
  const title = payload.title || 'Groundwork · Pothole Watch'
  const options = {
    body: payload.body || 'A pothole update needs your help nearby.',
    icon: '/icons/groundwork-192.png',
    badge: '/icons/groundwork-192.png',
    tag: payload.tag || 'groundwork-pothole-update',
    renotify: false,
    data: { url: payload.url || '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const destination = new URL(event.notification.data?.url || '/', self.location.origin).href
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of clients) {
      if (new URL(client.url).origin === self.location.origin) {
        await client.navigate(destination)
        return client.focus()
      }
    }
    return self.clients.openWindow(destination)
  })())
})
