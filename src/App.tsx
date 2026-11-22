import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPothole, deletePotholePhoto, loadFixActivity, loadPotholes, notifyNearbyReport, respondToPothole, type PotholeReport, type PotholeResponseValue, uploadPotholePhoto } from './data/groundwork'
import { MapControls } from './features/potholes/MapControls'
import { PotholeMap, type MapMode, type MapPoint } from './features/potholes/PotholeMap'
import { ReportPotholeSheet } from './features/potholes/ReportPotholeSheet'
import { ReportDetailsSheet } from './features/potholes/ReportDetailsSheet'
import { NotificationSettings } from './features/notifications/NotificationSettings'

export default function App() {
  const [reports, setReports] = useState<PotholeReport[]>([])
  const [fixes, setFixes] = useState<PotholeReport[]>([])
  const [mode, setMode] = useState<MapMode>('potholes')
  const [windowDays, setWindowDays] = useState(90)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [mapCenter, setMapCenter] = useState<MapPoint>()
  const [draftPoint, setDraftPoint] = useState<MapPoint>()
  const [locationLabel, setLocationLabel] = useState('Delhi')
  const [choosingLocation, setChoosingLocation] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [responseBusy, setResponseBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const refreshReports = useCallback(async () => {
    setLoading(true)
    try {
      const result = await loadPotholes()
      setReports(result)
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Pothole reports could not load.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void refreshReports() }, [refreshReports])

  useEffect(() => {
    const reportId = Number(new URLSearchParams(window.location.search).get('report'))
    if (Number.isSafeInteger(reportId) && reportId > 0) { setMode('potholes'); setSelectedId(reportId) }
  }, [])

  useEffect(() => {
    if (mode !== 'fixes') return
    let cancelled = false
    loadFixActivity(windowDays).then((result) => { if (!cancelled) setFixes(result) }).catch((cause) => {
      if (!cancelled) setNotice(cause instanceof Error ? cause.message : 'Fix activity could not load.')
    })
    return () => { cancelled = true }
  }, [mode, windowDays])

  const selected = useMemo(() => reports.find((report) => report.id === selectedId) || null, [reports, selectedId])
  const visibleReports = useMemo(() => reports.filter((report) => report.status !== 'fixed'), [reports])

  function locateMe() {
    if (!navigator.geolocation) {
      setNotice('Location is not available in this browser. You can still move the map and choose a location manually.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const point = { lat: coords.latitude, lng: coords.longitude }
        setMapCenter(point)
        setLocationLabel(`${point.lat.toFixed(3)}, ${point.lng.toFixed(3)}`)
        setNotice('Map centered on your current location. It is not saved unless you opt in to nearby alerts.')
      },
      () => setNotice('Location was not shared. Move the map manually or choose a report location.'),
      { enableHighAccuracy: false, timeout: 9000, maximumAge: 60_000 },
    )
  }

  function openReport() {
    setSelectedId(null)
    setChoosingLocation(false)
    setDraftPoint(undefined)
    setReportOpen(true)
  }

  function chooseReportLocation() {
    setDraftPoint(undefined)
    setReportOpen(false)
    setChoosingLocation(true)
    setNotice('Tap the map where you saw the pothole.')
  }

  async function saveReport(description: string, point: MapPoint, photo?: File) {
    let photoPath: string | undefined
    try {
      if (photo) photoPath = await uploadPotholePhoto(photo)
      const report = await createPothole({ description, lat: point.lat, lng: point.lng, photoPath })
      await refreshReports()
      setMode('potholes')
      setSelectedId(report.id)
      setMapCenter({ lat: report.lat, lng: report.lng })
      setReportOpen(false)
      try {
        const result = await notifyNearbyReport(report.id)
        setNotice(result.delivered > 0 ? `Report saved. ${result.delivered} opted-in neighbour${result.delivered === 1 ? '' : 's'} notified nearby.` : 'Report saved. There are no opted-in neighbours within 500 m yet.')
      } catch (cause) {
        console.warn('Nearby notifications are not available:', cause)
        setNotice('Report saved. Nearby push delivery is not set up yet; people can still find it on the map.')
      }
      return true
    } catch (cause) {
      if (photoPath) await deletePotholePhoto(photoPath).catch((cleanupError) => console.warn('Unused pothole photo could not be removed:', cleanupError))
      setNotice(cause instanceof Error ? cause.message : 'Pothole report could not be saved.')
      return false
    }
  }

  async function respond(response: PotholeResponseValue) {
    if (!selected) return
    const cycle = selected.status === 'pending' ? 0 : selected.currentCheckCycle
    if (selected.status === 'active' && cycle === 0) {
      setNotice('The next scheduled check-in is not open yet.')
      return
    }
    setResponseBusy(true)
    try {
      await respondToPothole(selected.id, cycle, response)
      await refreshReports()
      setNotice('Your neighbourhood check-in was recorded.')
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : 'Your response could not be saved. Try again.')
    } finally { setResponseBusy(false) }
  }

  return <div className="fixed inset-0 flex h-dvh min-h-0 flex-col overflow-hidden bg-[#f8f7f3] font-sans text-[#292f29]">
    <header className="z-20 shrink-0 border-b border-[#dedfd5] bg-[#fffefb] pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex min-h-14 max-w-[1600px] items-center justify-between gap-3 px-3 py-2 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#315a44] text-lg font-semibold text-[#f1efd9]">G</span>
          <div className="min-w-0"><h1 className="truncate font-serif text-xl font-semibold leading-6 tracking-[-.02em] text-[#243d2e]">Groundwork</h1><p className="text-xs leading-4 text-[#647066]">Pothole watch</p></div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={locateMe} className="flex min-h-10 max-w-[9rem] items-center gap-2 truncate rounded-xl border border-[#dfe3d7] bg-white px-3 text-xs font-medium text-[#33443a] hover:bg-[#f1f3ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315a44] sm:max-w-none sm:text-sm">
            <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/><path d="M12 2v2m0 16v2m10-10h-2M4 12H2"/></svg>
            <span className="truncate">{locationLabel}</span>
          </button>
          <button type="button" onClick={() => setNotificationsOpen(true)} aria-label="Nearby notification settings" className="grid h-10 w-10 place-items-center rounded-xl text-[#33443a] hover:bg-[#eef1e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315a44]">
            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-8 13h4"/></svg>
          </button>
        </div>
      </div>
    </header>

    <main className="relative min-h-0 flex-1" aria-label="Pothole map">
      <PotholeMap reports={visibleReports} fixes={fixes} mode={mode} selectedId={selectedId} center={mapCenter} choosingLocation={choosingLocation}
        onSelect={(id) => { setChoosingLocation(false); setSelectedId(id) }}
        onChooseLocation={(point) => { setChoosingLocation(false); setDraftPoint(point); setMapCenter(point); setReportOpen(true); setNotice('Location selected. Add a short description to continue.') }}
        onMapError={setNotice} />

      <MapControls mode={mode} days={windowDays} onModeChange={(next) => { setMode(next); setSelectedId(null) }} onDaysChange={setWindowDays} />

      <div className="pointer-events-none absolute left-3 top-[4.5rem] z-10 flex max-w-[70vw] items-center gap-2 rounded-full border border-[#dfe3d7] bg-[#fffefb]/95 px-3 py-2 text-xs text-[#48564b] shadow-[0_2px_10px_#243b2612] sm:left-4 sm:top-[4.5rem]">
        <span className="h-2 w-2 shrink-0 rounded-full bg-[#b74b2b]" />
        {mode === 'potholes' ? `${visibleReports.length} open pothole${visibleReports.length === 1 ? '' : 's'}` : `${fixes.length} community-confirmed fix${fixes.length === 1 ? '' : 'es'} · ${windowDays} days`}
      </div>

      {loading && <div role="status" className="absolute left-1/2 top-28 z-10 -translate-x-1/2 rounded-xl bg-[#fffefb] px-4 py-2 text-sm text-[#405848] shadow-md">Loading reports…</div>}
      {error && <div role="status" className="absolute left-3 right-3 top-28 z-10 mx-auto max-w-md rounded-xl border border-[#c98b70] bg-[#fff8ed] p-3 text-sm leading-5 text-[#663922] shadow-md sm:left-1/2 sm:right-auto sm:w-[min(28rem,calc(100vw-2rem))] sm:-translate-x-1/2">
        <p>{error}</p><button type="button" onClick={() => void refreshReports()} className="mt-2 min-h-10 font-semibold underline underline-offset-4">Try again</button>
      </div>}

      {choosingLocation && <div role="status" className="absolute inset-x-3 bottom-24 z-10 mx-auto w-fit rounded-full bg-[#213f30] px-4 py-2 text-sm font-medium text-white shadow-md">Tap the map to place the report</div>}
      {selected && mode === 'potholes' && <ReportDetailsSheet report={selected} busy={responseBusy} onClose={() => setSelectedId(null)} onRespond={(response) => void respond(response)} />}

      <button type="button" onClick={openReport} className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-30 flex min-h-12 -translate-x-1/2 items-center gap-2 rounded-full bg-[#315a44] px-5 text-sm font-semibold text-white shadow-[0_5px_18px_#10291c40] transition-colors hover:bg-[#244331] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#315a44]">
        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Report a pothole
      </button>

      {notice && <div className="absolute inset-x-3 bottom-20 z-40 mx-auto max-w-lg">
        <div role="status" className="flex items-start gap-3 rounded-xl bg-[#213f30] px-4 py-3 text-sm leading-5 text-white shadow-[0_8px_24px_#10291c35]">
          <span className="min-w-0 flex-1">{notice}</span><button type="button" aria-label="Dismiss message" onClick={() => setNotice('')} className="-mr-2 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-lg hover:bg-white/10">×</button>
        </div>
      </div>}

      {reportOpen && <ReportPotholeSheet initialPoint={draftPoint} onClose={() => setReportOpen(false)} onChooseMap={chooseReportLocation} onSubmit={saveReport} />}
      {notificationsOpen && <NotificationSettings onClose={() => setNotificationsOpen(false)} />}
    </main>
  </div>
}
