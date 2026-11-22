import { useState, type FormEvent } from 'react'
import type { MapPoint } from './PotholeMap'

type Props = {
  initialPoint?: MapPoint
  onClose: () => void
  onChooseMap: () => void
  onSubmit: (description: string, point: MapPoint, photo?: File) => Promise<boolean>
}

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const maxPhotoBytes = 8 * 1024 * 1024

export function ReportPotholeSheet({ initialPoint, onClose, onChooseMap, onSubmit }: Props) {
  const [description, setDescription] = useState('')
  const [point, setPoint] = useState<MapPoint | undefined>(initialPoint)
  const [photo, setPhoto] = useState<File>()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function useCurrentLocation() {
    if (!navigator.geolocation) { setError('Location is not available in this browser. Choose the spot on the map instead.'); return }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setPoint({ lat: coords.latitude, lng: coords.longitude }); setError('') },
      () => setError('Location was not shared. Choose the spot on the map instead.'),
      { enableHighAccuracy: false, timeout: 9000, maximumAge: 60_000 },
    )
  }

  function choosePhoto(file?: File) {
    if (!file) { setPhoto(undefined); return }
    if (!allowedTypes.has(file.type) || file.size === 0 || file.size > maxPhotoBytes) {
      setError('Choose a JPEG, PNG, or WebP photo under 8 MB.')
      return
    }
    setError('')
    setPhoto(file)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!point) { setError('Choose where you saw the pothole.'); return }
    if (description.trim().length < 3) { setError('Add a short description of at least 3 characters.'); return }
    setSaving(true); setError('')
    const saved = await onSubmit(description.trim(), point, photo)
    if (!saved) setError('The report could not be saved. Check your connection and retry.')
    setSaving(false)
  }

  return <div className="absolute inset-0 z-40 flex items-end justify-center bg-[#10241b]/30 p-2 pb-[max(.5rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <form onSubmit={submit} className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-[20px] border border-[#dfe3d7] bg-[#fffefb] p-5 shadow-[0_18px_55px_#10291c35] sm:p-6">
      <div className="flex items-center justify-between gap-3"><h2 className="font-serif text-2xl text-[#263b2e]">Report a pothole</h2><button type="button" onClick={onClose} aria-label="Close report form" className="grid h-10 w-10 place-items-center rounded-xl text-xl hover:bg-[#eef1e9]">×</button></div>
      <p className="mt-2 text-sm leading-5 text-[#56645a]">Pin the spot and describe what you saw. Nearby neighbours can help confirm it.</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={useCurrentLocation} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#9aa994] px-2 text-sm font-medium text-[#315a44] hover:bg-[#f1f3ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315a44]">
          <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/><path d="M12 2v2m0 16v2m10-10h-2M4 12H2"/></svg>Use my location
        </button>
        <button type="button" onClick={() => { setPoint(undefined); onChooseMap() }} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#9aa994] px-2 text-sm font-medium text-[#315a44] hover:bg-[#f1f3ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315a44]">
          <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>Choose on map
        </button>
      </div>
      <p className="mt-2 min-h-4 text-xs text-[#647066]">{point ? `Selected · ${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}` : 'Location required · your location is not saved unless you enable alerts'}</p>
      <label className="mt-3 block text-sm font-medium text-[#34473a]">What did you notice?
        <textarea required minLength={3} maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="For example: a deep pothole in the left lane near the bus stop." className="mt-2 w-full resize-y rounded-xl border border-[#cbd3c7] bg-white p-3 text-sm leading-5 text-[#263b2e] placeholder:text-[#69766c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315a44]" />
      </label>
      <p className="mt-1 text-right text-xs tabular-nums text-[#647066]">{description.length}/500</p>
      <label className="mt-3 block text-sm font-medium text-[#34473a]">Photo <span className="font-normal text-[#647066]">(optional)</span>
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => choosePhoto(event.target.files?.[0])} className="mt-2 block min-h-11 w-full rounded-xl border border-[#cbd3c7] bg-white p-2 text-sm file:mr-3 file:min-h-8 file:rounded-lg file:border-0 file:bg-[#edf0e5] file:px-3 file:text-xs file:font-semibold file:text-[#315a44] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315a44]" />
      </label>
      {photo && <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[#425047]"><span className="truncate">{photo.name} · {Math.ceil(photo.size / 1024)} KB</span><button type="button" onClick={() => setPhoto(undefined)} className="min-h-9 shrink-0 underline underline-offset-4">Remove</button></div>}
      <p className="mt-2 text-xs leading-4 text-[#647066]">Upload road photos only. Avoid faces, number plates, and personal details.</p>
      {error && <p role="alert" className="mt-2 text-sm leading-5 text-[#8b3822]">{error}</p>}
      <button disabled={saving} className="mt-4 min-h-12 w-full rounded-xl bg-[#315a44] px-4 text-sm font-semibold text-white hover:bg-[#244331] disabled:cursor-wait disabled:opacity-70">{saving ? 'Saving report…' : 'Submit pothole report'}</button>
    </form>
  </div>
}
