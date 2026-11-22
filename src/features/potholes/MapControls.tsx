import type { MapMode } from './PotholeMap'

type Props = { mode: MapMode; days: number; onModeChange: (mode: MapMode) => void; onDaysChange: (days: number) => void }

export function MapControls({ mode, days, onModeChange, onDaysChange }: Props) {
  return <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-start justify-center gap-2 sm:inset-x-auto sm:right-4 sm:top-4">
    <div className="pointer-events-auto flex min-h-12 items-center gap-1 rounded-2xl border border-[#dfe3d7] bg-[#fffefb] p-1 shadow-[0_3px_16px_#243b2618]" role="group" aria-label="Map layer">
      <button type="button" aria-pressed={mode === 'potholes'} onClick={() => onModeChange('potholes')} className={`min-h-10 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315a44] ${mode === 'potholes' ? 'bg-[#315a44] text-white' : 'text-[#33443a] hover:bg-[#eef1e9]'}`}>Potholes</button>
      <button type="button" aria-pressed={mode === 'fixes'} onClick={() => onModeChange('fixes')} className={`min-h-10 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315a44] ${mode === 'fixes' ? 'bg-[#315a44] text-white' : 'text-[#33443a] hover:bg-[#eef1e9]'}`}>Fix activity</button>
    </div>
    {mode === 'fixes' && <label className="pointer-events-auto flex min-h-12 items-center rounded-2xl border border-[#dfe3d7] bg-[#fffefb] px-2 shadow-[0_3px_16px_#243b2618]">
      <span className="sr-only">Fix activity time range</span>
      <select aria-label="Fix activity time range" value={days} onChange={(event) => onDaysChange(Number(event.target.value))} className="min-h-10 max-w-28 bg-transparent px-1 text-sm text-[#33443a] outline-none focus-visible:ring-2 focus-visible:ring-[#315a44]">
        <option value={30}>30 days</option><option value={90}>90 days</option><option value={180}>6 months</option>
      </select>
    </label>}
  </div>
}
