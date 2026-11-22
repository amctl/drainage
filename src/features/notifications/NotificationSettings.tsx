import { useEffect, useState } from 'react'
import { removePushSubscription, savePushSubscription } from '../../data/groundwork'

const publicVapidKey = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_VAPID_PUBLIC_KEY

function decodeVapidKey(value: string) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
  return Uint8Array.from(raw, (character) => character.charCodeAt(0))
}

function currentPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Location is not available in this browser.')); return }
    navigator.geolocation.getCurrentPosition(resolve, () => reject(new Error('Location was not shared. You can still use the map without alerts.')), {
      enableHighAccuracy: false, timeout: 9000, maximumAge: 60_000,
    })
  })
}

export function NotificationSettings({ onClose }: { onClose: () => void }) {
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [unsupported, setUnsupported] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) { setUnsupported(true); return }
    navigator.serviceWorker.getRegistration('/push-worker.js').then((registration) => registration?.pushManager.getSubscription()).then((subscription) => {
      if (!cancelled) setEnabled(Boolean(subscription))
    }).catch(() => { if (!cancelled) setError('Could not read the browser notification setting.') })
    return () => { cancelled = true }
  }, [])

  async function enable() {
    setBusy(true); setError('')
    let subscription: PushSubscription | null = null
    try {
      if (!window.isSecureContext) throw new Error('Nearby alerts require a secure HTTPS connection.')
      if (!publicVapidKey) throw new Error('Push notifications are not configured for this app yet.')
      if (Notification.permission === 'denied') throw new Error('Notifications are blocked in browser settings. You can still report and check potholes here.')
      const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission()
      if (permission !== 'granted') throw new Error(permission === 'denied' ? 'Notifications are blocked in browser settings. You can still report and check potholes here.' : 'Notification permission was not granted. You can still use the map without alerts.')
      const position = await currentPosition()
      const registration = await navigator.serviceWorker.register('/push-worker.js')
      await navigator.serviceWorker.ready
      subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeVapidKey(publicVapidKey) as BufferSource })
      const serialized = subscription.toJSON()
      if (!serialized.endpoint || !serialized.keys?.p256dh || !serialized.keys?.auth) throw new Error('The browser returned an incomplete notification subscription.')
      await savePushSubscription({
        endpoint: serialized.endpoint, p256dh: serialized.keys.p256dh, auth: serialized.keys.auth,
        // Rounded to 3 decimals (roughly a city block); this is stored only after this explicit opt-in.
        lat: Math.round(position.coords.latitude * 1000) / 1000,
        lng: Math.round(position.coords.longitude * 1000) / 1000,
      })
      setEnabled(true)
    } catch (cause) {
      await subscription?.unsubscribe().catch(() => undefined)
      setError(cause instanceof Error ? cause.message : 'Nearby alerts could not be enabled.')
    } finally { setBusy(false) }
  }

  async function disable() {
    setBusy(true); setError('')
    try {
      const registration = await navigator.serviceWorker.getRegistration('/push-worker.js')
      const subscription = await registration?.pushManager.getSubscription()
      if (subscription) {
        await removePushSubscription(subscription.endpoint)
        await subscription.unsubscribe()
      }
      setEnabled(false)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Nearby alerts could not be disabled.') }
    finally { setBusy(false) }
  }

  return <div className="absolute inset-0 z-50 flex items-end justify-center bg-[#10241b]/30 p-2 pb-[max(.5rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section aria-labelledby="alerts-title" className="w-full max-w-md rounded-[20px] border border-[#dfe3d7] bg-[#fffefb] p-5 shadow-[0_18px_55px_#10291c35] sm:p-6">
      <div className="flex items-center justify-between gap-3"><h2 id="alerts-title" className="font-serif text-2xl text-[#263b2e]">Nearby alerts</h2><button type="button" onClick={onClose} aria-label="Close notification settings" className="grid h-10 w-10 place-items-center rounded-xl text-xl hover:bg-[#eef1e9]">×</button></div>
      <p className="mt-3 text-sm leading-5 text-[#4e5c51]">Get a prompt when a new pothole is reported within 500 m and weekly check-ins for open potholes.</p>
      <p className="mt-2 text-xs leading-5 text-[#647066]">On iPhone or iPad, add this app to your Home Screen before enabling push alerts.</p>
      <p className="mt-3 rounded-xl bg-[#f2f3ed] p-3 text-xs leading-5 text-[#536156]">To target nearby reports, Groundwork stores your approximate location (rounded to about 100 m) only after you opt in. It does not track your movement. Turn alerts off here to delete that saved location and subscription.</p>
      {unsupported && <p className="mt-3 text-sm leading-5 text-[#8b3822]">This browser does not support web push. You can still use the map and answer check-ins when you visit.</p>}
      {error && <p role="alert" className="mt-3 text-sm leading-5 text-[#8b3822]">{error}</p>}
      <div className="mt-4 flex gap-2">
        {enabled ? <button type="button" disabled={busy} onClick={() => void disable()} className="min-h-12 flex-1 rounded-xl border border-[#8b3822] px-4 text-sm font-semibold text-[#8b3822] disabled:opacity-60">{busy ? 'Updating…' : 'Turn off alerts'}</button>
          : <button type="button" disabled={busy || unsupported} onClick={() => void enable()} className="min-h-12 flex-1 rounded-xl bg-[#315a44] px-4 text-sm font-semibold text-white hover:bg-[#244331] disabled:cursor-wait disabled:opacity-60">{busy ? 'Enabling alerts…' : 'Enable nearby alerts'}</button>}
        <button type="button" onClick={onClose} className="min-h-12 rounded-xl px-4 text-sm font-medium text-[#425047] hover:bg-[#eef1e9]">Not now</button>
      </div>
    </section>
  </div>
}
