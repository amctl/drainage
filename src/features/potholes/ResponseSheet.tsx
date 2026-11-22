import type { PotholeResponseValue, PotholeStatus } from '../../data/groundwork'

type Props = { status: PotholeStatus; cycle: number; busy: boolean; onRespond: (response: PotholeResponseValue) => void }

export function ResponseSheet({ status, cycle, busy, onRespond }: Props) {
  if (status === 'fixed') return cycle > 0 ? <div className="mt-4 border-t border-[#e7e8df] pt-3">
    <p className="text-sm font-semibold text-[#34473a]">Is the pothole still here?</p>
    <button type="button" disabled={busy} onClick={() => onRespond('exists')} className="mt-2 min-h-10 rounded-xl border border-[#9aa994] bg-white px-3 text-xs font-semibold text-[#315a44] hover:bg-[#eef2e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315a44] disabled:cursor-wait disabled:opacity-60">{busy ? 'Saving…' : 'Report that it is still here'}</button>
    <p className="mt-2 text-[11px] leading-4 text-[#647066]">A nearby report that it remains will reopen this status for follow-up.</p>
  </div> : null
  if (status === 'active' && cycle === 0) return <p className="mt-4 rounded-xl bg-[#f2f3ed] p-3 text-xs leading-5 text-[#536156]">The next follow-up opens on the scheduled check-in date. This report remains active until then.</p>

  const choices: { value: PotholeResponseValue; label: string }[] = status === 'pending'
    ? [{ value: 'exists', label: 'Yes, it’s here' }, { value: 'cannot_find', label: 'No, can’t find it' }]
    : [{ value: 'exists', label: 'Still there' }, { value: 'fixed', label: 'It’s fixed' }, { value: 'cannot_find', label: 'Can’t find it' }]

  return <div className="mt-4 border-t border-[#e7e8df] pt-3">
    <p className="text-sm font-semibold text-[#34473a]">{status === 'pending' ? 'Have you seen this pothole?' : 'Check in on this pothole'}</p>
    <div className="mt-2 flex flex-wrap gap-2">
      {choices.map((choice) => <button key={choice.value} type="button" disabled={busy} onClick={() => onRespond(choice.value)} className="min-h-10 rounded-xl border border-[#9aa994] bg-white px-3 text-xs font-semibold text-[#315a44] hover:bg-[#eef2e9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315a44] disabled:cursor-wait disabled:opacity-60">{busy ? 'Saving…' : choice.label}</button>)}
    </div>
    {status === 'active' && <p className="mt-2 text-[11px] leading-4 text-[#647066]">Two “fixed” responses in this check-in confirm a repair. “Can’t find it” is tracked separately.</p>}
  </div>
}
