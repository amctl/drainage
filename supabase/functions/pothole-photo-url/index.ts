import { withSupabase } from '@supabase/server'

export default {
  fetch: withSupabase({ auth: 'user' }, async (request, context) => {
    if (request.method !== 'POST') return Response.json({ error: 'Method not allowed.' }, { status: 405 })
    let reportId: number
    try { reportId = Number((await request.json()).report_id) }
    catch { return Response.json({ error: 'A report id is required.' }, { status: 400 }) }
    if (!Number.isSafeInteger(reportId) || reportId < 1) return Response.json({ error: 'A valid report id is required.' }, { status: 400 })

    const { data: report, error: reportError } = await context.supabaseAdmin
      .from('pothole_reports').select('photo_path').eq('id', reportId).maybeSingle()
    if (reportError) return Response.json({ error: 'Could not look up this report photo.' }, { status: 502 })
    if (!report?.photo_path) return Response.json({ error: 'This report has no photo.' }, { status: 404 })

    const { data, error } = await context.supabaseAdmin.storage.from('pothole-photos').createSignedUrl(report.photo_path, 1800)
    if (error || !data?.signedUrl) return Response.json({ error: 'Photo preview is temporarily unavailable.' }, { status: 502 })
    return Response.json({ signed_url: data.signedUrl })
  }),
}
