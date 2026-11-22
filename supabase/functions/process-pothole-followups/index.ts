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
  fetch: withSupabase({ auth: 'secret' }, async (request, context) => {
    if (request.method !== 'POST') return Response.json({ error: 'Method not allowed.' }, { status: 405 })

    const { error: enqueueError } = await context.supabaseAdmin.rpc('enqueue_due_pothole_followups', { batch_size: 100 })
    if (enqueueError) {
      console.error('Could not enqueue due pothole follow-ups', enqueueError)
      return Response.json({ error: 'Due check-ins could not be scheduled.' }, { status: 502 })
    }
    const { data: jobs, error: leaseError } = await context.supabaseAdmin.rpc('lease_pothole_followup_jobs', { batch_size: 100 })
    if (leaseError) {
      console.error('Could not lease pothole follow-up jobs', leaseError)
      return Response.json({ error: 'Scheduled check-ins could not be loaded.' }, { status: 502 })
    }

    let completed = 0
    let retried = 0
    for (const job of jobs || []) {
      const latitudeRadius = radiusMeters / 111_320
      const longitudeRadius = radiusMeters / Math.max(1, 111_320 * Math.cos(Number(job.lat) * Math.PI / 180))
      const { data: candidates, error } = await context.supabaseAdmin
        .from('push_subscriptions').select('id,user_id,endpoint,p256dh,auth,lat,lng').eq('active', true)
        .neq('user_id', job.user_id || '').gte('lat', Math.max(-90, Number(job.lat) - latitudeRadius))
        .lte('lat', Math.min(90, Number(job.lat) + latitudeRadius))
        .gte('lng', Math.max(-180, Number(job.lng) - longitudeRadius))
        .lte('lng', Math.min(180, Number(job.lng) + longitudeRadius))
      if (error) {
        console.error('Could not find nearby check-in recipients', error)
        await context.supabaseAdmin.rpc('complete_pothole_followup_job', { job_report_id: job.report_id, job_cycle: job.cycle, delivery_succeeded: false })
        retried++
        continue
      }

      const nearby = (candidates || []).filter((item) => distanceMeters(
        { lat: Number(job.lat), lng: Number(job.lng) }, { lat: Number(item.lat), lng: Number(item.lng) },
      ) <= radiusMeters)
      let delivered = 0
      let retry = false
      for (const item of nearby) {
        try {
          const response = await sendWebPush(item, {
            title: 'Weekly pothole check-in',
            body: 'Is this pothole still here, or has it been fixed?',
            url: `/?report=${job.report_id}&cycle=${job.cycle}`,
            tag: `pothole-${job.report_id}-cycle-${job.cycle}`,
          })
          if (response.ok || response.status === 201) delivered++
          else if (response.status === 404 || response.status === 410) {
            await context.supabaseAdmin.from('push_subscriptions').delete().eq('id', item.id)
          } else retry = true
        } catch (cause) {
          console.error('Scheduled check-in push failed', cause)
          retry = true
        }
      }
      const complete = !retry && (delivered > 0 || nearby.length === 0)
      await context.supabaseAdmin.rpc('complete_pothole_followup_job', {
        job_report_id: job.report_id, job_cycle: job.cycle, delivery_succeeded: complete,
      })
      if (complete) completed++
      else retried++
    }

    return Response.json({ completed, retried, leased: (jobs || []).length })
  }),
}
