export type Status = 'Needs attention' | 'Work underway' | 'Resolved'
export type Report = { id: number; title: string; area: string; place: string; kind: string; status: Status; time: string; age: number; votes: number; author: string; reputation: number; lng: number; lat: number; photo?: boolean; source: string }
export type Comment = { id: number; report: number; parent?: number; author: string; text: string; score: number; date: number; local?: boolean }
export type SourceLink = { id: number; zone: string; url: string; label: string }
export type GroundworkSnapshot = { reports: Report[]; comments: Comment[]; sourceLinks: SourceLink[]; connected: boolean; error?: string }

const fallbackReports: Report[] = [
  { id: 1, title: 'A little rain. A very familiar problem.', area: 'Central', place: 'Connaught Place · Ward 84', kind: 'Waterlogging', status: 'Needs attention', time: '2 hours ago', age: 2, votes: 42, author: 'Aditi S.', reputation: 128, lng: 77.219, lat: 28.631, photo: true, source: 'Resident report' },
  { id: 2, title: 'Blocked drain outside the neighbourhood market', area: 'Central', place: 'Karol Bagh · Ward 83', kind: 'Blocked drain', status: 'Needs attention', time: '4 hours ago', age: 4, votes: 31, author: 'Rahul M.', reputation: 86, lng: 77.188, lat: 28.651, photo: true, source: 'Resident report' },
  { id: 3, title: 'Open manhole needs a cover, not a branch', area: 'South', place: 'Lajpat Nagar · Ward 144', kind: 'Open manhole', status: 'Needs attention', time: '6 hours ago', age: 6, votes: 56, author: 'Meera K.', reputation: 214, lng: 77.243, lat: 28.567, source: 'Resident report' },
  { id: 4, title: 'Desilting work is underway on the main road', area: 'South', place: 'Vasant Vihar · Ward 153', kind: 'Desilting', status: 'Work underway', time: '1 day ago', age: 24, votes: 24, author: 'Neighbourhood desk', reputation: 160, lng: 77.158, lat: 28.56, source: 'Sample agency update' },
  { id: 5, title: 'Overflow cleared. Let’s keep an eye on it.', area: 'North Delhi', place: 'Civil Lines · Ward 73', kind: 'Drain overflow', status: 'Resolved', time: '2 days ago', age: 48, votes: 18, author: 'Arjun B.', reputation: 72, lng: 77.222, lat: 28.68, source: 'Resident report' },
]
const fallbackComments: Comment[] = [
  { id: 1, report: 1, author: 'Nikhil R.', text: 'The crossing near the inner circle is affected too. Would help to check the connecting drain.', score: 8, date: 1 },
  { id: 2, report: 1, parent: 1, author: 'Aditi S.', text: 'Yes, that is where the water starts collecting. Adding this as a sample follow-up.', score: 3, date: 2 },
  { id: 3, report: 2, author: 'Sana A.', text: 'This stretch gets blocked after every spell of rain.', score: 5, date: 3 },
  { id: 4, report: 3, author: 'Dev P.', text: 'Please be careful walking along this stretch after dark.', score: 6, date: 4 },
  { id: 5, report: 4, author: 'Ritika S.', text: 'Would like to see the work order linked to this update.', score: 5, date: 5 },
  { id: 6, report: 5, author: 'Arjun B.', text: 'Water has receded in this sample update. No official closure record is linked.', score: 2, date: 6 },
]

const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env || {}
// Accept either the Supabase project URL or its REST endpoint URL. The public
// project URL is preferred, but stripping an accidental /rest/v1 suffix keeps
// requests from becoming /rest/v1/rest/v1/...
const url = env.VITE_SUPABASE_URL?.trim().replace(/\/+$/, '').replace(/\/rest\/v1$/i, '')
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY
const sessionKey = 'groundwork-supabase-session'
type Session = { access_token: string; expires_at?: number }
let accessTokenProvider: (() => Promise<string | null>) | null = null

export function setAccessTokenProvider(provider: () => Promise<string | null>) { accessTokenProvider = provider }
export async function getAccessToken() { return accessTokenProvider?.() ?? null }

export function isSupabaseConfigured() { return Boolean(url && key) }
function supabaseRequestUrl(baseUrl: string, path: string) {
  const base = baseUrl.trim().replace(/\/+$/, '').replace(/\/rest\/v1$/i, '')
  const route = path.trim().replace(/^\/+/, '')
  return `${base}/${route}`
}
export function buildRestUrl(baseUrl: string, table: string, filters: Record<string, string> = {}) {
  const query = Object.entries(filters).map(([name, value]) => `${encodeURIComponent(name)}=eq.${encodeURIComponent(value)}`).join('&')
  return `${supabaseRequestUrl(baseUrl, `/rest/v1/${table}`)}${query ? `?${query}` : ''}`
}
function ago(value: string) { const hours = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 3_600_000)); return hours < 24 ? `${hours} hours ago` : `${Math.round(hours / 24)} days ago` }
function fail(message: string): never { throw new Error(message) }
async function request(path: string, init: RequestInit = {}, accessToken?: string) {
  if (!url || !key) fail('Supabase is not configured.')
  const response = await fetch(supabaseRequestUrl(url, path), { ...init, headers: { apikey: key, Authorization: `Bearer ${accessToken || key}`, 'Content-Type': 'application/json', ...(init.headers || {}) } })
  if (!response.ok) { const body = await response.text(); fail(body || `Supabase request failed (${response.status}).`) }
  return response.status === 204 ? null : response.json()
}
async function session(): Promise<Session> {
  const firebaseToken = await getAccessToken()
  if (firebaseToken) return { access_token: firebaseToken }
  const saved = localStorage.getItem(sessionKey)
  if (saved) { const parsed = JSON.parse(saved) as Session; if (!parsed.expires_at || parsed.expires_at * 1000 > Date.now() + 60_000) return parsed }
  const result = await request('/auth/v1/signup', { method: 'POST', body: JSON.stringify({ data: {} }) }) as { access_token?: string; expires_at?: number }
  if (!result.access_token) fail('Anonymous sign-in is unavailable. Enable Anonymous Sign-Ins in Supabase Auth.')
  localStorage.setItem(sessionKey, JSON.stringify(result)); return result as Session
}
function report(row: any): Report { return { id: Number(row.id), title: row.title, area: row.area, place: row.place, kind: row.kind, status: row.status, time: ago(row.created_at), age: Math.max(1, Math.round((Date.now() - new Date(row.created_at).getTime()) / 3_600_000)), votes: Number(row.vote_score || 0), author: row.author, reputation: Number(row.reputation || 0), lng: Number(row.lng), lat: Number(row.lat), photo: Boolean(row.photo), source: row.source } }
function comment(row: any): Comment { return { id: Number(row.id), report: Number(row.report_id), parent: row.parent_id ? Number(row.parent_id) : undefined, author: row.author, text: row.text, score: Number(row.vote_score || 0), date: new Date(row.created_at).getTime(), local: false } }

export async function loadGroundwork(): Promise<GroundworkSnapshot> {
  if (!isSupabaseConfigured()) return { reports: fallbackReports, comments: fallbackComments, sourceLinks: [], connected: false, error: 'Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.' }
  try {
    const [reports, comments, sourceLinks] = await Promise.all([
      request('/rest/v1/report_summaries?select=*&order=created_at.desc'),
      request('/rest/v1/comment_summaries?select=*&order=created_at.asc'),
      request('/rest/v1/source_links?select=*&order=created_at.desc'),
    ])
    return { reports: (reports as any[]).map(report), comments: (comments as any[]).map(comment), sourceLinks: (sourceLinks as any[]).map(row => ({ id: Number(row.id), zone: row.zone, url: row.url, label: row.label })), connected: true }
  } catch (error) {
    return {
      reports: fallbackReports,
      comments: fallbackComments,
      sourceLinks: [],
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown Supabase connection error.',
    }
  }
}
export async function createComment(input: { report: number; parent?: number; text: string }) {
  const auth = await session(); const rows = await request('/rest/v1/comments', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ report_id: input.report, parent_id: input.parent || null, text: input.text.trim(), author: 'Neighbour' }) }, auth.access_token) as any[]
  return comment({ ...rows[0], vote_score: 0 })
}
async function vote(table: 'report_votes' | 'comment_votes', keyName: 'report_id' | 'comment_id', id: number, value: number) {
  const auth = await session(); const existing = await request(`/rest/v1/${table}?select=value&${keyName}=eq.${id}`, {}, auth.access_token) as { value: number }[]
  if (existing[0]?.value === value) { await request(`/rest/v1/${table}?${keyName}=eq.${id}`, { method: 'DELETE' }, auth.access_token); return 0 }
  await request(`/rest/v1/${table}?on_conflict=${keyName},user_id`, { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ [keyName]: id, value }) }, auth.access_token); return value
}
export const setReportVote = (id: number, value: number) => vote('report_votes', 'report_id', id, value)
export const setCommentVote = (id: number, value: number) => vote('comment_votes', 'comment_id', id, value)
export async function createSourceLink(input: { zone: string; label: string; url: string }) {
  const parsed = new URL(input.url); if (!['http:', 'https:'].includes(parsed.protocol)) fail('Use an http(s) URL.')
  const auth = await session(); const rows = await request('/rest/v1/source_links', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ zone: input.zone, label: input.label.trim(), url: parsed.href }) }, auth.access_token) as any[]
  return { id: Number(rows[0].id), zone: rows[0].zone, label: rows[0].label, url: rows[0].url } as SourceLink
}

export type PotholeStatus = 'pending' | 'active' | 'fixed'
export type PotholeResponseValue = 'exists' | 'fixed' | 'cannot_find'
export type PotholeReport = {
  id: number
  description: string
  lat: number
  lng: number
  hasPhoto: boolean
  status: PotholeStatus
  createdAt: string
  lastCheckedAt?: string
  nextCheckAt?: string
  currentCheckCycle: number
  nextCheckCycle: number
  resolvedAt?: string
  confirmations: number
  cannotFind: number
  stillHere: number
  fixedThisCheckin: number
  fixedResponses: number
}
export type PushSubscriptionRecord = { endpoint: string; p256dh: string; auth: string; lat: number; lng: number }

function pothole(row: any): PotholeReport {
  return {
    id: Number(row.id), description: String(row.description), lat: Number(row.lat), lng: Number(row.lng),
    hasPhoto: row.has_photo === true, status: row.status as PotholeStatus, createdAt: row.created_at,
    lastCheckedAt: row.last_checked_at || undefined, nextCheckAt: row.next_check_at || undefined,
    currentCheckCycle: Number(row.current_check_cycle || 0), nextCheckCycle: Number(row.next_check_cycle || 1),
    resolvedAt: row.resolved_at || undefined, confirmations: Number(row.confirmation_count || 0),
    cannotFind: Number(row.cannot_find_count || 0), stillHere: Number(row.still_here_count || 0),
    fixedThisCheckin: Number(row.fixed_this_checkin_count || 0),
    fixedResponses: Number(row.fixed_response_count || 0),
  }
}

export async function loadPotholes(): Promise<PotholeReport[]> {
  if (!isSupabaseConfigured()) fail('Supabase is not configured. Add the Supabase project URL and publishable key.')
  const rows = await request('/rest/v1/pothole_summaries?select=*&order=created_at.desc') as any[]
  return rows.map(pothole)
}

export async function loadFixActivity(windowDays = 90): Promise<PotholeReport[]> {
  if (!Number.isInteger(windowDays) || windowDays < 1 || windowDays > 365) fail('Choose a fix activity window between 1 and 365 days.')
  if (!isSupabaseConfigured()) fail('Supabase is not configured. Add the Supabase project URL and publishable key.')
  const since = new Date(Date.now() - windowDays * 86_400_000).toISOString()
  const rows = await request(`/rest/v1/pothole_summaries?select=*&status=eq.fixed&resolved_at=gte.${encodeURIComponent(since)}&order=resolved_at.desc`) as any[]
  return rows.map(pothole)
}

export async function createPothole(input: { description: string; lat: number; lng: number; photoPath?: string }) {
  const description = input.description.trim()
  if (description.length < 3 || description.length > 500) fail('Describe the pothole in 3 to 500 characters.')
  if (!Number.isFinite(input.lat) || input.lat < -90 || input.lat > 90 || !Number.isFinite(input.lng) || input.lng < -180 || input.lng > 180) fail('Choose a valid location on the map.')
  const auth = await session()
  const columns = 'id,description,lat,lng,status,created_at,last_checked_at,next_check_at,current_check_cycle,next_check_cycle,resolved_at'
  const rows = await request(`/rest/v1/pothole_reports?select=${columns}`, {
    method: 'POST', headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ description, lat: input.lat, lng: input.lng, photo_path: input.photoPath || null }),
  }, auth.access_token) as any[]
  return pothole({ ...rows[0], has_photo: Boolean(input.photoPath) })
}

export async function respondToPothole(reportId: number, cycle: number, response: PotholeResponseValue) {
  if (!Number.isInteger(reportId) || reportId <= 0 || !Number.isInteger(cycle) || cycle < 0) fail('This pothole check-in is no longer valid.')
  if (cycle === 0 && response === 'fixed') fail('A new report needs an existence confirmation, not a repair confirmation.')
  const auth = await session()
  const rows = await request('/rest/v1/pothole_responses?on_conflict=report_id,user_id,cycle&select=id,report_id,cycle,response,created_at', {
    method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({ report_id: reportId, cycle, response }),
  }, auth.access_token) as any[]
  return rows[0]
}

export async function savePushSubscription(input: PushSubscriptionRecord) {
  if (!input.endpoint.startsWith('https://') || !input.p256dh || !input.auth) fail('The browser returned an incomplete push subscription.')
  if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng)) fail('Choose a location to receive nearby alerts.')
  const auth = await session()
  await request('/rest/v1/push_subscriptions?on_conflict=endpoint', {
    method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ ...input, active: true, updated_at: new Date().toISOString() }),
  }, auth.access_token)
}

export async function removePushSubscription(endpoint: string) {
  const auth = await session()
  await request(`/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`, { method: 'DELETE' }, auth.access_token)
}

export async function notifyNearbyReport(reportId: number): Promise<{ delivered: number; eligible: number }> {
  if (!Number.isInteger(reportId) || reportId <= 0 || !url || !key) fail('Nearby alerts need a configured Supabase project.')
  const auth = await session()
  const response = await fetch(`${url}/functions/v1/notify-nearby-report`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${auth.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ report_id: reportId }),
  })
  if (!response.ok) {
    const body = await response.text()
    fail(body || `Nearby notification dispatch failed (${response.status}).`)
  }
  return await response.json() as { delivered: number; eligible: number }
}

const photoBucket = 'pothole-photos'
const photoLimit = 8 * 1024 * 1024
const photoTypes: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

export async function uploadPotholePhoto(file: File) {
  const extension = photoTypes[file.type]
  if (!extension || file.size === 0 || file.size > photoLimit) fail('Choose a JPEG, PNG, or WebP image under 8 MB.')
  if (!url || !key) fail('Photo uploads need a configured Supabase project.')
  const auth = await session()
  let userId = ''
  try {
    const encoded = auth.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    userId = String(JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '='))).sub || '')
  } catch { fail('Could not verify the upload session. Sign in again and retry.') }
  if (!userId) fail('Could not verify the upload session. Sign in again and retry.')
  const path = `${userId}/${crypto.randomUUID()}.${extension}`
  const response = await fetch(`${url}/storage/v1/object/${photoBucket}/${path}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${auth.access_token}`, 'Content-Type': file.type, 'x-upsert': 'false' },
    body: file,
  })
  if (!response.ok) {
    const body = await response.text()
    fail(body || `Photo upload failed (${response.status}).`)
  }
  return path
}

export async function deletePotholePhoto(path: string) {
  if (!url || !key) return
  const auth = await session()
  const encodedPath = path.split('/').map(encodeURIComponent).join('/')
  const response = await fetch(`${url}/storage/v1/object/${photoBucket}/${encodedPath}`, {
    method: 'DELETE', headers: { apikey: key, Authorization: `Bearer ${auth.access_token}` },
  })
  if (!response.ok) throw new Error(`Unused photo could not be removed (${response.status}).`)
}

export async function loadPotholePhoto(reportId: number): Promise<string> {
  if (!Number.isInteger(reportId) || reportId <= 0 || !url || !key) fail('Photo is not available.')
  const auth = await session()
  const response = await fetch(`${url}/functions/v1/pothole-photo-url`, {
    method: 'POST',
    headers: { apikey: key, Authorization: `Bearer ${auth.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ report_id: reportId }),
  })
  if (!response.ok) {
    const body = await response.text()
    fail(body || `Photo preview unavailable (${response.status}).`)
  }
  const result = await response.json() as { signed_url?: string }
  if (!result.signed_url) fail('Photo preview unavailable.')
  return result.signed_url
}
