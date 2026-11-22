import { buildPushPayload, type PushSubscription, type PushMessage, type VapidKeys } from 'npm:@block65/webcrypto-web-push@2.0.0'

type StoredSubscription = { endpoint: string; p256dh: string; auth: string }
type NotificationMessage = { title: string; body: string; url: string; tag: string }

function vapidConfig(): VapidKeys {
  const subject = Deno.env.get('VAPID_SUBJECT')
  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY')
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY')
  if (!subject || !publicKey || !privateKey) throw new Error('VAPID push secrets are not configured.')
  return { subject, publicKey, privateKey }
}

export async function sendWebPush(subscription: StoredSubscription, message: NotificationMessage) {
  if (!subscription.endpoint.startsWith('https://')) throw new Error('Push endpoint must use HTTPS.')
  const pushSubscription: PushSubscription = {
    endpoint: subscription.endpoint,
    expirationTime: null,
    keys: { p256dh: subscription.p256dh, auth: subscription.auth },
  }
  const payload: PushMessage = {
    data: JSON.stringify(message),
    options: { ttl: 120, urgency: 'normal' },
  }
  const request = await buildPushPayload(payload, pushSubscription, vapidConfig())
  return await fetch(pushSubscription.endpoint, request)
}
