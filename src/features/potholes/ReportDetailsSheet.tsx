import { useEffect, useState } from 'react'
import { loadPotholePhoto, type PotholeReport, type PotholeResponseValue } from '../../data/groundwork'
import { ResponseSheet } from './ResponseSheet'

type Props = { report: PotholeReport; busy: boolean; onClose: () => void; onRespond: (response: PotholeResponseValue) => void }

const statusCopy = {
  pending: { label: 'Waiting for neighbours', color: '#8b5c1c', description: 'This report needs two nearby confirmations before it is marked active.' },
  active: { label: 'Pothole confirmed', color: '#9b4027', description: 'Neighbours confirmed this pothole is present. Check-ins will track whether it remains.' },
  fixed: { label: 'Community-confirmed fixed', color: '#32674a', description: 'Two neighbours confirmed it was repaired in the same check-in, with no conflicting “still there” response.' },
} as const

function formatDate(value?: string) {
  if (!value) return 'Not checked yet'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date unavailable' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

export function ReportDetailsSheet({ report, busy, onClose, onRespond }: Props) {
  const status = statusCopy[report.status]
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoError, setPhotoError] = useState(false)
  useEffect(() => {
    let cancelled = false
    setPhotoUrl(''); setPhotoError(false)
    if (report.hasPhoto) loadPotholePhoto(report.id).then((url) => { if (!cancelled) setPhotoUrl(url) }).catch(() => { if (!cancelled) setPhotoError(true) })
    return () => { cancelled = true }
  }, [report.id, report.hasPhoto])
  return <section aria-label="Pothole report details" className="absolute inset-x-2 bottom-[max(5rem,calc(env(safe-area-inset-bottom)+4rem))] z-20 max-h-[48dvh] overflow-y-auto rounded-[18px] border border-[#dfe3d7] bg-[#fffefb] p-4 shadow-[0_10px_34px_#182a1e2b] motion-safe:animate-[sheet-up_220ms_ease-out_both] sm:inset-x-auto sm:bottom-5 sm:left-5 sm:w-[min(25rem,calc(100vw-2.5rem))] sm:max-h-[70dvh] sm:p-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <span className="inline-flex items-center gap-2 text-xs font-semibold" style={{ color: status.color }}><span className="h-2 w-2 rounded-full" style={{ backgroundColor: status.color }} />{status.label}</span>
        <p className="mt-2 text-sm leading-5 text-[#425047]">{report.description}</p>
      </div>
      <button type="button" aria-label="Close report details" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl text-[#425047] hover:bg-[#eef1e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315a44]">×</button>
    </div>
    <p className="mt-3 text-xs text-[#56645a]">{report.lat.toFixed(4)}, {report.lng.toFixed(4)} · Reported {formatDate(report.createdAt)}</p>
    {photoUrl && <img src={photoUrl} alt="Resident photo of the reported pothole" className="mt-3 max-h-44 w-full rounded-xl object-cover" />}
    {report.hasPhoto && !photoUrl && <p className="mt-3 text-xs text-[#647066]">{photoError ? 'Photo preview is unavailable right now.' : 'Loading report photo…'}</p>}
    <p className="mt-4 text-sm leading-5 text-[#425047]">{status.description}</p>
    <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-[#e7e8df] pt-3 text-sm">
      <div><dt className="text-xs text-[#647066]">Nearby confirmations</dt><dd className="mt-1 font-semibold tabular-nums text-[#263b2e]">{report.confirmations}</dd></div>
      {report.status === 'pending' && <div><dt className="text-xs text-[#647066]">Could not find it</dt><dd className="mt-1 font-semibold tabular-nums text-[#263b2e]">{report.cannotFind}</dd></div>}
      {report.status === 'active' && report.currentCheckCycle > 0 && <><div><dt className="text-xs text-[#647066]">Still here this check-in</dt><dd className="mt-1 font-semibold tabular-nums text-[#263b2e]">{report.stillHere}</dd></div><div><dt className="text-xs text-[#647066]">Fixed responses this check-in</dt><dd className="mt-1 font-semibold tabular-nums text-[#263b2e]">{report.fixedThisCheckin}</dd></div></>}
      <div><dt className="text-xs text-[#647066]">Latest check-in</dt><dd className="mt-1 font-medium text-[#263b2e]">{formatDate(report.lastCheckedAt)}</dd></div>
      {report.status !== 'fixed' && <div className="col-span-2"><dt className="text-xs text-[#647066]">Next check-in</dt><dd className="mt-1 font-medium text-[#263b2e]">{formatDate(report.nextCheckAt)}</dd></div>}
      {report.status === 'fixed' && <div className="col-span-2"><dt className="text-xs text-[#647066]">Confirmed fixed</dt><dd className="mt-1 font-medium text-[#263b2e]">{formatDate(report.resolvedAt)}</dd></div>}
    </dl>
    <ResponseSheet status={report.status} cycle={report.status === 'pending' ? 0 : report.currentCheckCycle} busy={busy} onRespond={onRespond} />
    <p className="mt-3 text-[11px] leading-4 text-[#647066]">Community report · not an official repair record</p>
  </section>
}
