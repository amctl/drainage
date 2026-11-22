import { withSupabase } from '@supabase/server'
import { sendWebPush } from '../_shared/web-push.ts'

const radiusMeters = 500
const earthRadiusMeters = 6_371_000

function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const radians = (degrees: number) => degrees * Math.PI / 180
  const dLat = radians(b.lat - a.lat)
  const dLng = radians(b.lng - a.lng)
  const arc = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc))
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (request, context) => {
    if (request.method !== 'POST') return Response.json({ error: 'Method not allowed.' }, { status: 405 })
    let reportId: number
    try { reportId = Number((await request.json()).report_id) }
    catch { return Response.json({ error: 'A report id is required.' }, { status: 400 }) }
    if (!Number.isSafeInteger(reportId) || reportId < 1) return Response.json({ error: 'A valid report id is required.' }, { status: 400 })

    const { data: report, error: reportError } = await context.supabaseAdmin
      .from('pothole_reports').select('id,user_id,description,lat,lng').eq('id', reportId).maybeSingle()
    if (reportError) return Response.json({ error: 'Could not load the pothole report.' }, { status: 502 })
    if (!report) return Response.json({ error: 'Pothole report not found.' }, { status: 404 })
    if (String(context.userClaims.sub) !== String(report.user_id)) return Response.json({ error: 'Only the report creator can start its nearby notification.' }, { status: 403 })

    const latitudeRadius = radiusMeters / 111_320
    const longitudeRadius = radiusMeters / Math.max(1, 111_320 * Math.cos(report.lat * Math.PI / 180))
    const minLat = Math.max(-90, report.lat - latitudeRadius)
    const maxLat = Math.min(90, report.lat + latitudeRadius)
    const minLng = Math.max(-180, report.lng - longitudeRadius)
    const maxLng = Math.min(180, report.lng + longitudeRadius)
    const { data: candidates, error: subscriptionsError } = await context.supabaseAdmin
      .from('push_subscriptions')
      .select('id,user_id,endpoint,p256dh,auth,lat,lng')
      .eq('active', true).neq('user_id', report.user_id)
      .gte('lat', minLat).lte('lat', maxLat).gte('lng', minLng).lte('lng', maxLng)
    if (subscriptionsError) return Response.json({ error: 'Nearby alert subscriptions could not be loaded.' }, { status: 502 })

    const nearby = (candidates || []).filter((item) => distanceMeters({ lat: report.lat, lng: report.lng }, { lat: Number(item.lat), lng: Number(item.lng) }) <= radiusMeters)
    let delivered = 0
    for (const item of nearby) {
      try {
        const response = await sendWebPush(item, {
          title: 'Pothole reported nearby',
          body: 'Can you confirm whether this pothole is here?',
          url: `/?report=${report.id}&cycle=0`,
          tag: `pothole-${report.id}-confirm`,
        })
        if (response.ok || response.status === 201) delivered++
        else if (response.status === 404 || response.status === 410) {
          await context.supabaseAdmin.from('push_subscriptions').delete().eq('id', item.id)
        }
      } catch (error) { console.error('Nearby push send failed', error) }
    }
    return Response.json({ delivered, eligible: nearby.length })
  }),
}
