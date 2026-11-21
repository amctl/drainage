import { useEffect, useMemo, useRef, useState } from 'react';
import { createComment, createSourceLink, loadGroundwork, setCommentVote, setReportVote, type Comment, type Report, type Status } from './data/groundwork';
import { getFirebaseToken, initializeFirebaseAuth, signInWithGoogle, signOut, subscribeAuth } from './auth/firebase';
import { setAccessTokenProvider } from './data/groundwork';

const initialReports: Report[] = [
  { id: 1, title: 'A little rain. A very familiar problem.', area: 'Central', place: 'Connaught Place · Ward 84', kind: 'Waterlogging', status: 'Needs attention', time: '2 hours ago', age: 2, votes: 42, author: 'Aditi S.', reputation: 128, lng: 77.219, lat: 28.631, photo: true, source: 'Resident report' },
  { id: 2, title: 'Blocked drain outside the neighbourhood market', area: 'Central', place: 'Karol Bagh · Ward 83', kind: 'Blocked drain', status: 'Needs attention', time: '4 hours ago', age: 4, votes: 31, author: 'Rahul M.', reputation: 86, lng: 77.188, lat: 28.651, photo: true, source: 'Resident report' },
  { id: 3, title: 'Open manhole needs a cover, not a branch', area: 'South', place: 'Lajpat Nagar · Ward 144', kind: 'Open manhole', status: 'Needs attention', time: '6 hours ago', age: 6, votes: 56, author: 'Meera K.', reputation: 214, lng: 77.243, lat: 28.567, source: 'Resident report' },
  { id: 4, title: 'Desilting work is underway on the main road', area: 'South', place: 'Vasant Vihar · Ward 153', kind: 'Desilting', status: 'Work underway', time: '1 day ago', age: 24, votes: 24, author: 'Neighbourhood desk', reputation: 160, lng: 77.158, lat: 28.56, source: 'Sample agency update' },
  { id: 5, title: 'Overflow cleared. Let’s keep an eye on it.', area: 'North Delhi', place: 'Civil Lines · Ward 73', kind: 'Drain overflow', status: 'Resolved', time: '2 days ago', age: 48, votes: 18, author: 'Arjun B.', reputation: 72, lng: 77.222, lat: 28.68, source: 'Resident report' },
];
const seedComments: Comment[] = [
  { id: 1, report: 1, author: 'Nikhil R.', text: 'The crossing near the inner circle is affected too. Would help to check the connecting drain.', score: 8, date: 1 },
  { id: 2, report: 1, parent: 1, author: 'Aditi S.', text: 'Yes, that is where the water starts collecting. Adding this as a sample follow-up.', score: 3, date: 2 },
  { id: 3, report: 2, author: 'Sana A.', text: 'This stretch gets blocked after every spell of rain.', score: 5, date: 3 },
  { id: 4, report: 3, author: 'Dev P.', text: 'Please be careful walking along this stretch after dark.', score: 6, date: 4 },
  { id: 5, report: 4, author: 'Ritika S.', text: 'Would like to see the work order linked to this update.', score: 4, date: 5 },
  { id: 6, report: 5, author: 'Arjun B.', text: 'Water has receded in this sample update. No official closure record is linked.', score: 2, date: 6 },
];
const zones = [{ name: 'West Zone', amount: 6.35, target: '48 km of drains', progress: 19 }, { name: 'Najafgarh', amount: 4.73, target: '36 km of drains', progress: 12 }, { name: 'South Zone', amount: 3.21, target: '24 km of drains', progress: 9 }];
// Delhi's current revenue-district layout, effective 1 January 2026.
const delhiRegions = ['All Delhi', 'South East', 'Old Delhi', 'North', 'New Delhi', 'Central', 'Central North', 'South West', 'Outer North', 'North West', 'North East', 'East', 'South', 'West'];
const normalizeDistrictName = (value: unknown) => typeof value === 'string'
  ? value.toLowerCase().replace(/\b(delhi|district)\b/g, '').replace(/\s+/g, ' ').trim()
  : '';
const normalizeWardName = (value: unknown) => typeof value === 'string' ? value.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
const wardDistrictByName: Record<string, string> = {};
const wardNameGroups: Record<string, string> = {
  'Outer North': 'NARELA|BANKNER|ALIPUR|BAKHTAWAR PUR|BAKHTAWARPUR|HOLAMBI KALAN|HOLAMBI KHURD|BAWANA|POOTH KALAN|POOTH KHURD|SHAHBAAD DAIRY|SHAHBAD DAIRY|NANGAL THAKRAN|KANJHAWALA|RANI KHERA|NILOTHI|MUNDAKA|KARALA|SAHIBABAD DAULAT PUR|BEGUMPUR',
  North: 'BURARI|MUKUND PUR|MUKUNDPUR|JHARODA|SANT NAGAR|MALKAGANJ|MALKA GANJ|TIMAR PUR|TIMARPUR|MUKHERJEE NAGAR|G.T.B. NAGAR|GTB NAGAR|DHIR PUR|DHIRPUR|ADARASH NAGAR|ADARSH NAGAR|AZADPUR|SARAI PIPAL THALA|JAHANGIRPURI-I|JAHANGIR PURI -II|JAHANGIR PURI|SAMAYPUR BADLI|BADLI|LIBAS PUR|BHALASWA|BHALSWA|BHALSWA JAHAGIR PUR|BHALASWA JAHAGIR PUR|SARUP NAGAR',
  'North West': 'ROHINI|ROHINI-A|ROHINI-B|ROHINI-C|ROHINI-E|ROHINI-F|ROHINI-CENTRAL|ROHINI-EAST|ROHINI-NORTH|ROHINI-SOUTH|RITHALA|BUDH VIHAR|VIJAY VIHAR|SULTANPURI|SULTAN PURI|SULTANPURI EAST|SULTANPURI SOUTH|SULTANPUR MAJRA|MANGOLPURI|MANGOL PURI|MANGOLPURI EAST|MANGOLPURI WEST|MANGOL PURI NORTH|KIRARI|KIRARI SULEMAN NAGAR|NANGLOI EAST|NANGLOI JAT|NANGLOI JAT WEST|NITHARI|PREM NAGAR|GURU HARKISHAN NAGAR|PERAGHARHI|QUAMMRUDDIN NAGAR|JAWALAPURI|NIHAL VIHAR|AMAN VIHAR|MUBARIKPUR',
  'Central North': 'ROHINI-D|SHALIMAR BAGH|SHALIMAR BAGH NORTH|SHALIMAR BAGH SOUTH|PITAMPUR|PITAMPURA|PITAMPUR NORTH|PITAMPURA SOUTH|NAHARPUR|SARASWATI VIHAR|PASCHIM VIHAR|PASCHIM VIHAR NORTH|PASCHIM VIHAR SOUTH|RANI BAGH|TRI NAGAR|RAMPURA|KOHAT ENCLAVE|SHAKUR PUR|WAZIRPUR|WAJIRPUR|ASHOK VIHAR|NIMRI COLONY|SAWAN PARK|SANGAM PARK|MODEL TOWN|KAMLA NAGAR|INDER LOK COLONY|RANA PRATAP BAGH|KESHAV PURAM',
  'Old Delhi': 'CHANDNI CHOWK|MINTO ROAD|KUCHA PANDIT|BAZAR SITARAM|BAZAR SITA RAM|IDGAH ROAD|TURKMAN GATE|JAMA MASJID|BALLIMARAN|RAM NAGAR|QASABPURA|QURAISH NAGAR|KISHAN GANJ|DEPUTY GANJ|KASHMERE GATE|MAJNU KA TILA|CIVIL LINES|SADAR BAZAR|SHASTRI NAGAR',
  Central: 'KAROL BAGH|DEV NAGAR|BALJIT NAGAR|BALJEET NAGAR|WEST PATEL NAGAR|EAST PATEL NAGAR|NEW RANJIT NAGAR|RANJEET NAGAR|KARAM PURA|MOTI NAGAR|RAMESH NAGAR|MODEL BASTI|PUSA|RAJENDER NAGAR|RAJINDER NAGAR|INDER PURI|NARAINA|PAHAR GANJ',
  West: 'KIRTI NAGAR|MANSAROWER GARDEN|RAJA GARDEN|RAGHUBIR NAGAR|RAJOURI GARDEN|PUNJABI BAGH|MADIPUR|VISHNU GARDEN|TAGORE GARDEN|NANGAL RAYA|HARI NAGAR|SUBHASH NAGAR|TILAK NAGAR|JANAK PURI|JANAKPURI|JANAK PURI NORTH|JANAK PURI SOUTH|JANAK PURI WEST|MILAP NAGAR|SITA PURI|VIKASPURI|VIKASPURI EAST|VIKAS PURI|HASTSAL|VIKAS NAGAR|MAJOR BHUPINDAR SINGH NAGAR|KUNWAR SINGH NAGAR|KHYALA|KESHOPUR|BAPROLA|SAINIK ENCLAVE|FATEH NAGAR|CHOKHANDI NAGAR|TILANGPUR KOTLA|PRATAP VIHAR|MAHAVIR NAGAR|MOHAN GARDEN|NAWADA|UTTAM NAGAR|BINDAPUR|DABRI',
  'South West': 'MANGLAPURI|SAGARPUR|SAGARPUR WEST|CHHAWLA|NANGLI SAKRAVATI|KAKRAULA|MATIALA|ROSHANPURA|NAJAFGARH|DICHAON KALAN|BIJWASAN|KAPASHERA|MAHIPALPUR|RAJ NAGAR|PALAM|SADH NAGAR|MAHAVIR ENCLAVE|MADHU VIHAR|KHERA|ISAPUR|DWARKA|DWARKA-A|DWARKA-B|DWARKA-C',
  'South East': 'DARYAGANJ|NIZAMUDDIN|LAJPAT NAGAR|BHOGAL|KASTURBA NAGAR|KOTLA MUBARAKPUR|ANDREWSGANJ|AMAR COLONY|TUGHLAKABAD EXTN|TUGHLAKABAD EXTENSION|TUGHLAKABAD|GOVIND PURI|PUL PEHLAD|PUL PEHLADPUR|TEKHAND|MEETHEYPUR|BADAR PUR|BADARPUR|MOLARBAND|OKHLA|HARKESH NAGAR|JAITPUR|MADANPUR KHADAR|SARITA VIHAR|SRI NIWASPURI|ZAKIR NAGAR|KALKAJI|SANGAM VIHAR CENTRAL|SANGAM VIHAR EAST',
  South: 'HAUZ RANI|MALVIYA NAGAR|SAFDARJANG ENCLAVE|HAUZ KHAS|VASANT VIHAR|MUNIRKA|R K PURAM|NANAK PURA|VASANTKUNJ|LADOSARAI|MEHRAULI|KISHANGARH|DEOLI|CHHATARPUR|AYA NAGAR|BHATI|SAID UL AJAIB|SANGAM VIHAR|SANGAM VIHAR WEST|TIGRI|DAKSHINPURI|DAKSHINPURI EXT|AMBEDKAR NAGAR|MADANGIR|PUSHP VIHAR|KHANPUR|CHITRANJAN PARK|CHIRAG DELHI|SHAPUR JAT|GREATER KAILASH|GREATER KAILASH I|GREATER KAILASH-I|EAST OF KAILASH',
  East: 'MAYUR VIHAR|MAYUR VIHAR PHASE I|MAYUR VIHAR PHASE II|DALLOPURA|TRILOK PURI|NEW ASHOK NAGAR|KALYAN PURI|KHICHRIPUR|KONDLI|GHAROLI|VINOD NAGAR|MANDAWALI|PATPARGANJ|KISHAN KUNJ|LAXMI NAGAR|SHAKARPUR|PANDAV NAGAR|ANAND VIHAR|VISHWASH NAGAR|I P EXTENTION|PREET VIHAR|KRISHNA NAGAR|GEETA COLONY|GHONDLI|ANARKALI|DHARAMPURA|GANDHI NAGAR|AZAD NAGAR|RAGHUBAR PURA|SHAHDARA|VIVEK VIHAR',
  'North East': 'JHILMIL|DILSHAD|DILSHAD GARDEN|DILSHAD COLONY|NEW SEEMA PURI|NAND NAGRI|SUNDER NAGARI|DURGA PURI|WELCOME COLONY|CHAUHAN BANGER|ZAFFRABAD|MAUJPUR|GHONDA|YAMUNA VIHAR|SUBHASH MOHALLA|KARDAM PURI|JANTA COLONY|BABAR PUR|JIWANPUR|GOKALPUR|SABOLI|HARSH VIHAR|SHIV VIHAR|KARAWAL NAGAR|KARAWAL NAGAR EAST|KARAWAL NAGAR WEST|MUSTAFABAD|KHAJOORI KHAS|SONIA VIHAR|NEW USMANPUR|BHAJANPURA|TUKHMIR PUR|NEHRU VIHAR|BRAHAM PURI|DAYALPUR|SADATPUR|SRI RAM COLONY|PUR SHAHDARA|BRIJ PURI|JOHARIPUR|KABIR NAGAR|GORAKH PARK|ROHTASH NAGAR|RAM NAGAR EAST|SEELAMPUR|ASHOK NAGAR',
};
for (const [district, names] of Object.entries(wardNameGroups)) {
  for (const name of names.split('|')) wardDistrictByName[normalizeWardName(name)] = district;
}
function districtForWard(feature: any) {
  const wardNo = String(feature.properties?.Ward_No ?? '');
  if (/^(NDMC|CANT)_/i.test(wardNo)) return 'New Delhi';
  const named = wardDistrictByName[normalizeWardName(feature.properties?.Ward_Name)];
  if (named) return named;
  if (!wardNo) return 'East';
  const number = Number(wardNo);
  if (!Number.isInteger(number)) return 'North East';
  if (number <= 5) return 'Outer North';
  if (number <= 20) return 'North';
  if (number <= 53) return 'North West';
  if (number <= 73) return 'Central North';
  if (number <= 90) return 'Old Delhi';
  if (number <= 100) return 'Central';
  if (number <= 124) return 'West';
  if (number <= 148) return 'South West';
  if (number <= 150) return 'Central';
  if (number <= 152) return 'West';
  if (number <= 160) return 'South East';
  if (number <= 194) return 'South';
  if (number <= 208) return 'South East';
  if (number <= 236) return 'East';
  return 'North East';
}
const colors = { 'Needs attention': '#d77a32', 'Work underway': '#487ca1', Resolved: '#368067' };
const statusInk = { 'Needs attention': '#8a4f1d', 'Work underway': '#2f5f7d', Resolved: '#2b6349' };
const button = 'min-h-11 cursor-pointer rounded-xl px-4 text-sm font-medium transition-[background-color,box-shadow,transform] duration-200 hover:bg-black/5 motion-safe:active:scale-[.97] disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426b53] focus-visible:ring-offset-2';
function AnimatedAmount({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const previous = useRef(0);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setDisplay(value); previous.current = value; return; }
    const from = previous.current;
    const start = performance.now();
    let frame = 0;
    function tick(now: number) {
      const t = Math.min((now - start) / 700, 1);
      setDisplay(from + (value - from) * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
      else previous.current = value;
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <span aria-label={value.toFixed(2)}><span aria-hidden="true" className="tabular-nums">{display.toFixed(2)}</span></span>;
}
function Contours() {
  return <svg aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 text-[#aac8a0]/20" viewBox="0 0 320 320" fill="none">
    {[40, 65, 90, 115, 140, 165].map(r => <ellipse key={r} cx="190" cy="130" rx={r} ry={r * .8} transform="rotate(-32 190 130)" stroke="currentColor" strokeWidth="1" />)}
  </svg>;
}
function Icon({ name, className = '' }: { name: string; className?: string }) {
  const paths: Record<string, string> = { map: 'm3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16', people: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8-7.87a4 4 0 0 1 0 7.75', search: 'm21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0', arrow: 'M7 17 17 7M7 7h10v10', plus: 'M12 5v14M5 12h14', close: 'm6 6 12 12M6 18 18 6', pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM12 7v6m-3-3h6', budget: 'M3 21h18M4 10h16L12 3 4 10Zm2 3v5m6-5v5m6-5v5', comment: 'M21 11a9 9 0 0 1-9 9H3l2-5a9 9 0 1 1 16-4Z', up: 'm6 14 6-6 6 6', down: 'm6 10 6 6 6-6', check: 'm5 12 4 4L19 6', camera: 'M4 6h4l2-3h4l2 3h4v14H4V6Zm12 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0', layers: 'm12 3 10 6-10 6L2 9l10-6ZM2 15l10 6 10-6M2 12l10 6 10-6' };
  return <svg aria-hidden="true" className={`h-5 w-5 shrink-0 ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name] || paths.pin} /></svg>;
}
function StatusMark({ status, className = '' }: { status: Status; className?: string }) {
  return <span className={`inline-flex items-center gap-2 text-xs font-medium ${className}`} style={{ color: statusInk[status] }}><span aria-hidden="true" className="h-2.5 w-[3px] shrink-0 rounded-full" style={{ background: colors[status] }} />{status}</span>;
}
function Dialog({ title, description, close, children }: { title: string; description: string; close: () => void; children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [exiting, setExiting] = useState(false);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeRef = useRef(close);
  closeRef.current = close;
  function dismiss() {
    if (exitTimer.current) return;
    setExiting(true);
    exitTimer.current = setTimeout(() => closeRef.current(), matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 150);
  }
  useEffect(() => {
    const prev = document.activeElement as HTMLElement; const overflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    root.current?.querySelector<HTMLElement>('button, input, textarea')?.focus();
    function key(e: KeyboardEvent) {
      if (e.key === 'Escape') dismiss();
      if (e.key === 'Tab') { const items = root.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, textarea, select, a[href]'); if (!items?.length) return; const first = items[0], last = items[items.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
    }
    document.addEventListener('keydown', key); return () => { document.removeEventListener('keydown', key); document.body.style.overflow = overflow; if (exitTimer.current) clearTimeout(exitTimer.current); prev?.focus(); };
  }, []);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10241b]/45 p-4 backdrop-blur-md" onMouseDown={e => { if (e.target === e.currentTarget) dismiss(); }}>
    <div ref={root} role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-description"
      className={`max-h-[90dvh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-3xl border border-white/70 bg-[#fbfaf7] p-6 shadow-[0_32px_100px_#0c231b40] sm:p-8 ${exiting ? 'motion-safe:animate-[dialog-out_150ms_ease-in_both]' : 'motion-safe:animate-[dialog-in_320ms_cubic-bezier(.2,.8,.2,1)_both]'}`}>
      <div className="mb-6 flex items-center gap-2 text-xs font-semibold tracking-[.15em] text-[#49634b]"><Icon name="layers" className="h-4 w-4" />GROUNDWORK <span className="ml-auto rounded-full bg-[#f1ead5] px-3 py-1.5 tracking-normal text-[#72571f]">Demo · not verified</span></div>
      <div className="flex items-start justify-between gap-4"><h2 id="dialog-title" className="font-serif text-3xl leading-tight">{title}</h2><button aria-label="Close dialog" className={`${button} bg-stone-100 px-3`} onClick={dismiss}><Icon name="close" /></button></div>
      <p id="dialog-description" className="mt-3 text-sm leading-6 text-stone-600">{description}</p>{children}
    </div>
  </div>;
}
function MapSurface({ visible, selected, select, area }: { visible: Report[]; selected: number | null; select: (id: number) => void; area: string }) {
  const bounds = { west: 77.12, east: 77.29, south: 28.53, north: 28.72 };
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let disposed = false;
    const token = (import.meta as any).env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!token) { setError('Mapbox token is missing.'); return; }
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'https://api.mapbox.com/mapbox-gl-js/v3.10.0/mapbox-gl.css'; document.head.appendChild(css);
    const script = document.createElement('script'); script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.10.0/mapbox-gl.js';
    script.onerror = () => setError('Mapbox GL could not load from api.mapbox.com. Check network access or content blockers.');
    script.onload = () => {
      if (disposed || !container.current) return;
      try {
        const mb = (window as any).mapboxgl; mb.accessToken = token;
        const instance = new mb.Map({ container: container.current, style: 'mapbox://styles/mapbox/streets-v12', center: [77.205, 28.617], zoom: 11.2, attributionControl: true }); map.current = instance;
        instance.addControl(new mb.NavigationControl({ showCompass: false }), 'bottom-right');
        instance.on('load', () => {
          if (disposed) return;
          instance.addSource('district-boundaries', { type: 'geojson', data: '/data/wards_delhi.geojson' });
          instance.addSource('selected-district-boundary', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
          instance.addLayer({ id: 'district-base-outline', type: 'line', source: 'district-boundaries', paint: { 'line-color': '#355b47', 'line-width': 1.25, 'line-opacity': 0.7 } });
          instance.addLayer({ id: 'selected-district-fill', type: 'fill', source: 'selected-district-boundary', paint: { 'fill-color': '#e8a84b', 'fill-opacity': 0.4 } });
          instance.addLayer({ id: 'selected-district-outline', type: 'line', source: 'selected-district-boundary', paint: { 'line-color': '#b95e24', 'line-width': 1.75, 'line-opacity': 0.95 } });
          instance.addSource('reports', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
          instance.addLayer({ id: 'report-pins', type: 'circle', source: 'reports', paint: { 'circle-color': ['get', 'color'], 'circle-radius': ['case', ['==', ['get', 'selected'], true], 14, ['==', ['get', 'inRegion'], true], 11, 8], 'circle-opacity': ['case', ['==', ['get', 'inRegion'], true], 1, 0.38], 'circle-stroke-width': ['case', ['==', ['get', 'inRegion'], true], 4, 2], 'circle-stroke-color': ['case', ['==', ['get', 'inRegion'], true], '#ffffff', '#d8ddd6'] } });
          instance.on('click', 'report-pins', (event: any) => select(Number(event.features[0].properties.id)));
          instance.on('mouseenter', 'report-pins', () => { instance.getCanvas().style.cursor = 'pointer'; });
          instance.on('mouseleave', 'report-pins', () => { instance.getCanvas().style.cursor = ''; });
          setReady(true);
        });
        instance.on('error', (event: any) => {
          const failure = event?.error || event;
          const message = failure?.message || 'Unknown Mapbox error';
          const status = failure?.status ? ` (HTTP ${failure.status})` : '';
          const source = event?.sourceId ? ` · source ${event.sourceId}` : '';
          console.error('Mapbox request failed:', { message, status: failure?.status, url: failure?.url, sourceId: event?.sourceId, error: failure });
          // A style/tile error can happen after Mapbox's load event, so retain
          // a visible diagnostic instead of leaving a blank canvas unexplained.
          setError(`Mapbox request failed${status}${source}: ${message}`);
        });
      } catch (cause) { setError(`Mapbox initialization failed: ${cause instanceof Error ? cause.message : 'unknown browser error'}`); }
    };
    document.head.appendChild(script);
    return () => { disposed = true; map.current?.remove(); script.remove(); css.remove(); };
  // Keep the SDK instance alive across parent renders; React rebuilds callback props.
  }, []);
  useEffect(() => {
    if (!ready || !map.current) return;
    const selectedDistrict = normalizeDistrictName(area);
    let cancelled = false;
    fetch('/data/wards_delhi.geojson').then(response => {
      if (!response.ok) throw new Error(`Could not load ward boundaries (${response.status})`);
      return response.json();
    }).then((geojson: any) => {
      if (cancelled || !map.current) return;
      const polygonFeatures = geojson.features
        .filter((feature: any) => ['Polygon', 'MultiPolygon'].includes(feature.geometry?.type))
        .map((feature: any) => ({ ...feature, properties: { ...feature.properties, Dist_Name: districtForWard(feature) } }));
      const features = area === 'All Delhi' ? [] : polygonFeatures.filter((feature: any) => normalizeDistrictName(feature.properties?.Dist_Name) === selectedDistrict);
      map.current.getSource('selected-district-boundary')?.setData({ type: 'FeatureCollection', features });
      const focusFeatures = area === 'All Delhi' ? polygonFeatures : features;
      const positions: number[][] = [];
      const collect = (coordinates: any) => {
        if (typeof coordinates?.[0] === 'number' && typeof coordinates?.[1] === 'number') positions.push(coordinates);
        else if (Array.isArray(coordinates)) coordinates.forEach(collect);
      };
      focusFeatures.forEach((feature: any) => collect(feature.geometry?.coordinates));
      if (!positions.length) return;
      const bounds = positions.reduce((result, point) => [
        Math.min(result[0], point[0]), Math.min(result[1], point[1]),
        Math.max(result[2], point[0]), Math.max(result[3], point[1]),
      ], [Infinity, Infinity, -Infinity, -Infinity]);
      map.current.fitBounds([[bounds[0], bounds[1]], [bounds[2], bounds[3]]], {
        padding: window.innerWidth >= 1024 ? { top: 90, right: 390, bottom: 70, left: 360 } : { top: 80, right: 35, bottom: 170, left: 35 },
        maxZoom: area === 'All Delhi' ? 10.6 : 12.6,
        duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 800,
      });
    }).catch(error => console.error('Could not focus selected district:', error));
    return () => { cancelled = true; };
  }, [ready, area]);
  useEffect(() => {
    if (!ready) return;
    const normalize = (value: string) => value.toLowerCase().replace(/\s+delhi$/, '').replace(/\s+zone$/, '');
    map.current?.getSource('reports')?.setData({ type: 'FeatureCollection', features: visible.map(r => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [r.lng, r.lat] }, properties: { id: r.id, color: colors[r.status], selected: r.id === selected, inRegion: area === 'All Delhi' || normalize(r.area) === normalize(area) || (area === 'South Delhi' && normalize(r.area) === 'south') } })) });
  }, [ready, visible, selected, area]);
  useEffect(() => {
    const report = visible.find(item => item.id === selected);
    if (ready && report) map.current?.flyTo({ center: [report.lng, report.lat], zoom: 13, duration: 700 });
  }, [ready, selected, visible]);
  useEffect(() => {
    if (!ready || !container.current) return;
    const observer = new ResizeObserver(() => map.current?.resize()); observer.observe(container.current);
    return () => observer.disconnect();
  }, [ready]);
  function position(r: Report) {
    return { left: `${((r.lng - bounds.west) / (bounds.east - bounds.west)) * 100}%`, top: `${((bounds.north - r.lat) / (bounds.north - bounds.south)) * 100}%` };
  }
  return <div className="absolute inset-0 min-h-[320px] overflow-hidden bg-[#e9eae2]" aria-label="Interactive Mapbox map of Delhi drainage demo reports">
    <div ref={container} className="mapbox-container absolute inset-0 h-full w-full" />
    {(!ready || error) && <div className={`absolute inset-0 flex items-center justify-center p-8 ${ready ? 'pointer-events-none bg-[#e8ebe2]/45' : 'pointer-events-none bg-[#e8ebe2]/90'}`}><div className="max-w-lg text-center"><Icon name="map" className="mx-auto mb-4 h-10 w-10 text-[#44634e]" /><p className="font-serif text-3xl">Delhi, on the ground.</p><p role="status" className="mt-3 break-words text-sm leading-6 text-stone-700">{error || 'Loading Mapbox…'}</p>{error && <p className="mt-2 text-xs text-stone-600">Open browser Developer Tools → Network, then inspect the failed api.mapbox.com request and its HTTP status.</p>}</div></div>}
  </div>;
}
function ReportFlow({ close }: { close: () => void }) {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [outcome, setOutcome] = useState('success');
  const [title, setTitle] = useState('Drainage issue near Connaught Place');
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; controller.current?.abort(); };
  }, []);
  function cancelChecks() {
    controller.current?.abort();
    setBusy(false);
    setError('Demo checks cancelled. Nothing was published or sent. You can retry.');
  }
  async function verify() {
    if (!file) { setError('Choose a photo before running the demo checks.'); return; }
    setBusy(true); setError(''); controller.current = new AbortController();
    try {
      if (!('serviceWorker' in navigator)) throw new Error('This browser cannot run the local verification simulator.');
      const registration = await navigator.serviceWorker.register('/demo-worker.js');
      await registration.update();
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) await new Promise<void>((resolve, reject) => { const timer = setTimeout(() => reject(new Error('Demo simulator is starting. Please try again.')), 5000); navigator.serviceWorker.addEventListener('controllerchange', () => { clearTimeout(timer); resolve(); }, { once: true }); });
      if (!mounted.current || controller.current.signal.aborted) return;
      const data = new FormData();
      data.append('photo', file);
      data.append('simulation', 'true');
      data.append('outcome', outcome);
      const response = await fetch('/api/verify', {
        method: 'POST', body: data, signal: controller.current.signal,
      });
      if (!response.ok) throw new Error('Simulated check failure. Select “Pass” and retry. Nothing has been sent.');
      const result = await response.json();
      if (!result.simulated) throw new Error('Unexpected response. No demo submission was completed.');
      if (mounted.current && !controller.current.signal.aborted) setStep(2);
    } catch (e) {
      if (mounted.current && (e as Error).name !== 'AbortError') setError((e as Error).message);
    } finally { if (mounted.current) setBusy(false); }
  }
  return <Dialog title={step === 3 ? 'Your demo is complete.' : 'Put the problem on the map.'} description="A practice report only. Photos and submissions are not published or sent to an authority." close={close}>
    <div className="my-6 flex gap-2">{['Photo', 'Demo checks', 'Review', 'Complete'].map((label, i) => <div key={label} className="flex-1"><div className={`mb-2 h-1 rounded ${i <= step ? 'bg-[#356147]' : 'bg-stone-200'}`} /><span className="text-xs text-stone-600">{label}</span></div>)}</div>
    {step === 0 && <div>
      <label className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed border-stone-400 bg-white px-5 py-8">
        <Icon name="camera" className="h-9 w-9" />
        <strong>Add or take a photo</strong>
        <span className="max-w-full break-all text-sm text-stone-600">{file?.name || 'Choose an image from your device'}</span>
        <input aria-label="Choose report photo" type="file" accept="image/*" className="mt-2 min-h-11 max-w-full text-sm" onChange={e => {
          const next = e.target.files?.[0] || null;
          if (next && (!next.type.startsWith('image/') || next.size > 10 * 1024 * 1024)) {
            setFile(null); setError('Choose an image under 10 MB.'); return;
          }
          setFile(next); setError('');
        }} />
      </label>
      <p className="mt-3 text-sm text-stone-600">Choose an image under 10 MB to continue. No photo is uploaded to a server.</p>
    </div>}
    {step === 1 && <div aria-busy={busy} className="space-y-4 rounded-xl bg-stone-100 p-5">
      <h3 className="font-medium">Simulated location & duplicate checks</h3>
      <p className="text-sm leading-6 text-stone-600">Location metadata is simulated in this demo. No real location is requested. A browser-local simulator handles POST /api/verify; it does not analyse the photo or contact a server.</p>
      <p className="text-sm">Demo location: Connaught Place, Central Delhi</p>
      <label className="block text-sm">Try a demo outcome
        <select disabled={busy} value={outcome} onChange={e => setOutcome(e.target.value)} className="ml-3 min-h-11 rounded-lg border border-stone-300 bg-white px-3">
          <option value="success">Pass</option><option value="error">Simulated failure</option>
        </select>
      </label>
      <div className="flex flex-wrap gap-2">
        <button disabled={busy} onClick={verify} className={`${button} bg-[#315a44] text-white hover:bg-[#244331] disabled:opacity-60`}>{busy ? 'Running simulated checks…' : 'Run demo checks'}</button>
        {busy && <button className={`${button} border border-stone-300`} onClick={cancelChecks}>Cancel checks</button>}
      </div>
      <p role="status" className="text-sm text-stone-600">{busy ? 'Simulating location and duplicate checks. You can cancel at any time.' : 'This is a practice check, not verification.'}</p>
    </div>}
    {step === 2 && <div className="space-y-4">
      <p role="status" className="rounded-lg bg-[#e8eee5] p-4 text-sm leading-6">Demo checks passed. Nothing has been published or sent to an authority.</p>
      <label className="block text-sm">Issue title<input value={title} maxLength={150} onChange={e => setTitle(e.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-stone-300 p-3" /></label>
      <p className="break-all text-sm text-stone-600">Photo: {file?.name}<br />Location: simulated · duplicate result: simulated</p>
    </div>}
    {step === 3 && <div className="my-7 rounded-xl bg-[#e8eee5] p-6"><Icon name="check" className="mb-3 h-8 w-8" /><p className="leading-7">Demo checks passed. Nothing has been published or sent to an authority.</p><p className="mt-3 text-sm text-stone-600">This practice submission is not saved. Your photo stays within this browser’s demo simulator.</p></div>}
    {error && <p role="alert" className="mt-4 text-sm text-red-800">{error}</p>}
    <div className="mt-6 flex justify-between gap-3">
      {step < 3 && <button className={button} onClick={() => { setError(''); step > 0 ? setStep(step - 1) : close(); }} disabled={busy}>{step === 0 ? 'Cancel' : 'Back'}</button>}
      {step !== 1 && <button className={`${button} bg-[#315a44] text-white hover:bg-[#244331] disabled:opacity-60`} disabled={(step === 0 && !file) || (step === 2 && !title.trim())} onClick={() => step === 3 ? close() : setStep(step + 1)}>{step === 0 ? 'Continue' : step === 2 ? 'Complete demo submission' : 'Done'}</button>}
    </div>
  </Dialog>;
}
export default function App() {
  const [view, setView] = useState('Map'); const [search, setSearch] = useState(''); const [area, setArea] = useState('All Delhi'); const [selected, setSelected] = useState<number | null>(null);
  const [reports, setReports] = useState<Report[]>(initialReports); const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState<{ displayName: string | null; email: string | null; photoURL: string | null } | null>(null);
  const [sort, setSort] = useState('Relevance'); const [votes, setVotes] = useState<Record<number, number>>({}); const [modal, setModal] = useState(''); const [thread, setThread] = useState<Report | null>(null);
  const [comments, setComments] = useState(seedComments); const [commentVotes, setCommentVotes] = useState<Record<number, number>>({}); const [commentSort, setCommentSort] = useState('Relevance'); const [reply, setReply] = useState<number | undefined>(); const [draft, setDraft] = useState(''); const [notice, setNotice] = useState('');
  const [zoneIndex, setZoneIndex] = useState(0); const [sourceUrl, setSourceUrl] = useState(''); const [sourceLabel, setSourceLabel] = useState(''); const [links, setLinks] = useState<{ id?: number; zone: string; url: string; label: string }[]>([]); const [copied, setCopied] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null); const communityScroll = useRef(0); const zone = zones[zoneIndex];
  const postsRef = useRef<HTMLDivElement>(null);
  const panelScroll = useRef({ Budget: 0, Thread: 0 });
  useEffect(() => { setAccessTokenProvider(getFirebaseToken); initializeFirebaseAuth(); return subscribeAuth(next => { setAccount(next.user); if (next.error) setNotice(next.error); }); }, []);
  useEffect(() => { loadGroundwork().then(data => { setReports(data.reports); setComments(data.comments); setLinks(data.sourceLinks); setConnected(data.connected); if (!data.connected) setNotice(data.error ? `Supabase unavailable: ${data.error}` : 'Using sample data. Changes cannot be saved until Supabase is available.'); }); }, []);
  useEffect(() => {
    if (view === 'Community' && !thread && postsRef.current) {
      postsRef.current.scrollTop = communityScroll.current;
    }
  }, [view, thread]);
  const count = (id: number) => comments.filter(c => c.report === id).length;
  const filtered = useMemo(() => reports.filter(r => {
    const reportRegion = r.area.toLowerCase().replace(/\s+delhi$/, '').replace(/\s+zone$/, '');
    const selectedRegion = area.toLowerCase().replace(/\s+delhi$/, '').replace(/\s+zone$/, '');
    const inRegion = area === 'All Delhi' || reportRegion === selectedRegion || (area === 'South Delhi' && reportRegion === 'south');
    const query = search.trim().toLocaleLowerCase();
    const matchesRegionSearch = !query || `${r.title} ${r.place} ${r.area} ${r.kind}`.toLocaleLowerCase().includes(query);
    return inRegion && matchesRegionSearch;
  }), [reports, area, search]);
  const visible = [...filtered].sort((a, b) => sort === 'New' ? a.age - b.age : sort === 'Top' ? (b.votes + (votes[b.id] || 0)) - (a.votes + (votes[a.id] || 0)) : sort === 'Comment Count' ? count(b.id) - count(a.id) : sort === 'Hot' ? (b.votes / (b.age + 2)) - (a.votes / (a.age + 2)) : a.id - b.id);
  const activeReport = visible.find(r => r.id === selected);
  const [feedState, setFeedState] = useState('ready');
  const threadOrigin = useRef('Community');
  const threadDrafts = useRef<Record<number, { text: string; reply?: number }>>({});
  const lastThread = useRef<number | null>(null);
  const feedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (feedTimer.current) clearTimeout(feedTimer.current); }, []);
  useEffect(() => {
    const previous = lastThread.current;
    if (previous !== null) threadDrafts.current[previous] = { text: draft, reply };
    const saved = thread ? threadDrafts.current[thread.id] : undefined;
    setDraft(saved?.text || '');
    setReply(saved?.reply);
    setCommentSort('Relevance');
    lastThread.current = thread?.id ?? null;
  }, [thread?.id]);
  function openThread(r: Report, origin: string) {
    if (origin === 'Community') communityScroll.current = postsRef.current?.scrollTop || 0;
    threadOrigin.current = origin;
    setView('Community');
    setThread(r);
    panelScroll.current.Thread = 0;
  }
  function testFeed(next: string) {
    if (feedTimer.current) clearTimeout(feedTimer.current);
    setFeedState(next);
    if (next === 'loading') feedTimer.current = setTimeout(() => setFeedState('ready'), 1600);
  }
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (!modal) searchRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        if (!modal) setModal('report');
      }
      if (e.key === 'Escape' && !modal) setSelected(null);
    }
    document.addEventListener('keydown', key);
    return () => document.removeEventListener('keydown', key);
  }, [modal]);
  useEffect(() => {
    if (copied) setNotice('RTI application copied. Fill the placeholders, print, sign and submit it yourself. Nothing has been filed.');
  }, [copied]);
  useEffect(() => { if (!notice || notice.startsWith('Supabase unavailable:')) return; const t = setTimeout(() => setNotice(''), 4000); return () => clearTimeout(t); }, [notice]);
  function changeView(next: string) {
    if (view === 'Community' && !thread) communityScroll.current = postsRef.current?.scrollTop || 0;
    if (thread && next === 'Budget') {
      setZoneIndex(thread.area === 'South' ? 2 : 0);
      setNotice('Illustrative comparison only. No budget record is linked to this report; the zone selection is not an agency assignment.');
    }
    setView(next); setThread(null);
  }
  function goMap(r: Report) {
    communityScroll.current = postsRef.current?.scrollTop || 0;
    setView('Map'); setThread(null); setSelected(r.id);
  }
  async function vote(id: number, value: number) { const next = votes[id] === value ? 0 : value; setVotes(v => ({ ...v, [id]: next })); try { const saved = await setReportVote(id, value); setVotes(v => ({ ...v, [id]: saved })); } catch { setVotes(v => ({ ...v, [id]: 0 })); setNotice('Vote could not be saved.'); } }
  async function voteComment(id: number, value: number) { const next = commentVotes[id] === value ? 0 : value; setCommentVotes(v => ({ ...v, [id]: next })); try { const saved = await setCommentVote(id, value); setCommentVotes(v => ({ ...v, [id]: saved })); } catch { setCommentVotes(v => ({ ...v, [id]: 0 })); setNotice('Comment vote could not be saved.'); } }
  const rti = `To\nThe Public Information Officer\n[Relevant drainage department / local authority]\n\nSubject: Application under Section 6(1) of the RTI Act, 2005 — ${zone.name}, FY 2025-26\n\nThe Groundwork demo shows an illustrative allocation of ₹${zone.amount.toFixed(2)} Cr and an illustrative target of ${zone.target}. These are not official figures. Please provide the actual records for:\n\n1. Budget heads, sanction details and original allocations.\n2. Revised allocations and expenditure to date.\n3. Targets versus physical progress, with measurement records.\n4. Contractor list and responsible officers, names and designations.\n5. Tenders, bid details and work orders.\n6. Payments released, dates, amounts and supporting bills.\n7. Non-tender awards, reasons and approving authority.\n\nPlease provide copies of available records, and transfer relevant portions under Section 6(3) where applicable. Please inform me of any additional copying fee.\n\nApplicant: [Name]\nAddress: [Postal address]\nContact: [Phone / email]\nApplication fee: [Fee instrument / applicable exemption]\nDate: [Date]\nSignature: [Signature]\n\nPrint, sign and submit to the appropriate PIO yourself. Groundwork does not file RTI applications.`;
  function commentNode(c: Comment): React.ReactNode { return <div key={c.id} className={`${c.parent ? 'ml-5 border-l border-stone-200 pl-4' : 'border-b border-stone-200 pb-5'} mt-5 motion-safe:animate-[rise-in_300ms_ease-out_both]`}><div className="flex items-center gap-2 text-sm"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8ebdf] font-medium">{c.author[0]}</span><strong>{c.author}</strong><span className="text-xs text-stone-600">{c.local ? 'Local demo · ' + new Date(c.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Community comment'}</span></div><p className="my-3 text-sm leading-6">{c.text}</p><div className="flex items-center gap-2 text-sm"><button aria-label="Upvote comment" aria-pressed={commentVotes[c.id] === 1} className={`${button} px-2`} onClick={() => voteComment(c.id, 1)}><Icon name="up" /></button>{c.score + (commentVotes[c.id] || 0)}<button aria-label="Downvote comment" aria-pressed={commentVotes[c.id] === -1} className={`${button} px-2`} onClick={() => voteComment(c.id, -1)}><Icon name="down" /></button><button className={button} onClick={() => { setReply(c.id); document.getElementById('composer')?.focus(); }}>Reply</button></div>{comments.filter(x => x.parent === c.id).map(commentNode)}</div>; }
  return <div className="fixed inset-0 flex h-dvh min-h-0 flex-col overflow-hidden bg-[#f8f7f3] font-sans text-[#292f29]">
    <header className="relative z-20 shrink-0 border-b border-[#dedfd5] bg-[#fffefb] shadow-[0_1px_12px_#243b2605] motion-safe:animate-[fade-in_450ms_ease-out_both]">
      <div className="mx-auto flex min-h-21 max-w-[1600px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3 lg:px-9">
        <button onClick={() => changeView('Map')} className="flex min-h-11 items-center gap-3 text-left focus-visible:ring-2"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#315a44] text-[#f1efd9]"><Icon name="layers" className="h-6 w-6" /></span><span><span className="block font-serif text-[29px] font-semibold leading-8 tracking-[-1px]">Groundwork<span className="text-[#bd733c]">.</span></span><span className="text-xs tracking-wide text-stone-600">Delhi drainage watch</span></span></button>
        <nav className="order-3 flex w-full gap-1 rounded-2xl border border-[#e7e8df] bg-[#f2f3ed] p-1 sm:order-none sm:w-auto" aria-label="Primary">
          {['Map', 'Community', 'Budget'].map(v => <button key={v} onClick={() => changeView(v)} aria-current={view === v ? 'page' : undefined}
            className={`${button} relative flex flex-1 items-center justify-center gap-2 px-4 sm:flex-none lg:px-6 ${view === v ? 'bg-white text-[#254d37] shadow-[0_2px_6px_#243b2612] ring-1 ring-black/5' : 'text-stone-600 hover:text-[#254d37]'}`}>
            <Icon name={v === 'Map' ? 'map' : v === 'Community' ? 'people' : 'budget'} />{v}
            {view === v && <span className="absolute -bottom-1.5 h-1 w-4 rounded-full bg-[#537147] motion-safe:animate-[grow_250ms_ease-out_both]" />}
          </button>)}
        </nav>
        <div className="flex items-center gap-3"><span className="hidden items-center gap-2 rounded-full border border-[#d7d3bc] bg-[#f4f0df] px-3 py-1.5 text-xs font-medium sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-[#9a7432]" />Demo · not verified</span>{account ? <button className={`${button} flex items-center gap-2 border border-[#b8c3ac] px-3`} onClick={() => signOut().catch(() => setNotice('Could not sign out.'))}>{account.photoURL && <img src={account.photoURL} alt="" className="h-5 w-5 rounded-full" />}{account.displayName || 'Signed in'} · Sign out</button> : <button className={`${button} border border-[#b8c3ac] px-3`} onClick={() => signInWithGoogle().catch(() => setNotice('Google sign-in could not be completed.'))}>Sign in with Google</button>}<button className={`${button} flex items-center gap-2 bg-[#315a44] text-white hover:bg-[#244331]`} onClick={() => setModal('report')}><Icon name="plus" /><span className="hidden sm:inline">Report an issue</span><span className="sm:hidden">Report</span></button></div>
      </div>
      <div className="flex items-center justify-between border-t border-stone-200 px-5 py-1 sm:hidden"><span className="text-xs text-[#72571f]">● Demo · not verified</span><span className="text-xs text-stone-600">Illustrative data only</span></div>
    </header>
    <div className="relative z-10 flex shrink-0 items-center justify-between gap-3 border-b border-[#dedfd5] bg-[#fffefb] px-4 py-2 motion-safe:animate-[fade-in_450ms_ease-out_both] [animation-delay:80ms] lg:px-9">
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#e4e6dd] bg-[#f6f7f2] px-3 transition-[border-color,box-shadow] duration-200 focus-within:border-[#88a078] focus-within:shadow-[0_0_0_3px_#dce6d566] lg:max-w-xl">
        <Icon name="search" className="text-[#56704c]" />
        <input ref={searchRef} aria-label="Search reports by title, place, area or kind" className="min-h-11 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-stone-600" placeholder="Search Delhi’s streets and stories…" value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button className={`${button} px-1`} aria-label="Clear search" onClick={() => { setSearch(''); searchRef.current?.focus(); }}><Icon name="close" className="h-4 w-4" /></button>}
        <kbd className="hidden shrink-0 rounded-md border border-[#d9ded0] bg-white px-1.5 py-1 text-xs text-stone-600 lg:block">⌘ K</kbd>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        <label className="flex items-center gap-1 rounded-xl border border-[#e4e6dd] bg-white px-2 sm:px-3">
          <Icon name="pin" className="hidden h-4 w-4 text-[#49614e] sm:block" />
          <select aria-label="Filter reports by area" value={area} onChange={e => setArea(e.target.value)} className="min-h-11 max-w-28 bg-transparent text-sm outline-none focus-visible:ring-2 sm:max-w-none">
            {delhiRegions.map(a => <option key={a}>{a}</option>)}
          </select>
        </label>
        <button aria-label="Keyboard shortcuts and demo help" className={`${button} hidden border border-[#e4e6dd] px-4 text-stone-600 sm:block`} onClick={() => setModal('help')}>?</button>
      </div>
    </div>
    {view === 'Map' && <main className="flex min-h-0 flex-1 flex-col overflow-hidden motion-safe:animate-[rise-in_400ms_ease-out_backwards]">
      <div className="relative min-h-0 flex-1">
        {/* Keep every report on the map so region filtering can highlight matches
            while dimming reports in other regions. */}
        <MapSurface visible={reports} selected={selected} select={setSelected} area={area} />
        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white bg-[#fffef9]/95 px-4 py-2 text-xs font-medium tracking-wide shadow-[0_2px_12px_#233a2510] backdrop-blur-lg motion-safe:animate-[fade-in_500ms_ease-out_both] [animation-delay:220ms] lg:left-[352px]"><span className="h-1.5 w-1.5 rounded-full bg-[#56704c]" />DELHI, INDIA <span className="text-stone-600">/ DEMO MAP</span></div>
        <aside className="absolute bottom-5 left-5 top-5 z-10 hidden w-[310px] flex-col overflow-hidden rounded-2xl border border-white bg-[#fffef9]/95 shadow-[0_12px_48px_#1b38251a] backdrop-blur-xl motion-safe:animate-[drift-left_500ms_cubic-bezier(.2,.8,.2,1)_backwards] [animation-delay:120ms] lg:flex">
          <div className="border-b border-stone-200 p-5">
            <h2 className="font-serif text-2xl">Around Delhi</h2>
            <p className="mt-2 text-sm text-stone-600">{visible.length} matching demo reports. Select a place to explore.</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">{visible.map((r, i) =>
            <button key={r.id} aria-pressed={selected === r.id} onClick={() => setSelected(r.id)} style={{ animationDelay: `${160 + i * 40}ms` }} className={`group relative w-full overflow-hidden rounded-xl border-b border-stone-100 p-3 pl-4 text-left transition-[background-color,box-shadow,transform] duration-200 focus-visible:ring-2 motion-safe:animate-[rise-in_380ms_ease-out_backwards] ${selected === r.id ? 'bg-[#edf0e5] shadow-sm ring-1 ring-[#b8c3ac]' : 'hover:bg-[#f3f5ee] motion-safe:hover:translate-x-0.5'}`}>
              <span aria-hidden="true" className="absolute inset-y-3 left-0 w-[3px] rounded-r-full" style={{ background: colors[r.status] }} />
              <p className="text-sm font-semibold">{r.place.split(' ·')[0]}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1"><StatusMark status={r.status} /><span className="text-xs text-stone-600">{r.kind} · {r.time}</span></div>
            </button>)}
            {!visible.length && <div className="p-4"><p className="text-sm">No matching demo reports.</p><button className={button} onClick={() => { setSearch(''); setArea('All Delhi'); }}>Clear filters</button></div>}
          </div>
          <p className="border-t border-stone-200 px-5 py-3 text-xs leading-5 text-stone-600">Sample reports, not official complaints. Keyboard users can select any report here.</p>
        </aside>
        {activeReport && <section key={activeReport.id} aria-label="Selected report context" className="absolute inset-x-3 bottom-8 z-20 max-h-[52%] overflow-y-auto rounded-2xl border border-white bg-[#fffef9] p-5 shadow-[0_16px_60px_#20382926] motion-safe:animate-[sheet-up_320ms_cubic-bezier(.2,.8,.2,1)_backwards] lg:inset-x-auto lg:bottom-auto lg:right-5 lg:top-5 lg:max-h-[85%] lg:w-80 lg:motion-safe:animate-[drift-right_320ms_cubic-bezier(.2,.8,.2,1)_backwards]">
          <div className="flex items-center justify-between gap-3"><StatusMark status={activeReport.status} /><button className={`${button} px-3`} aria-label="Close selected report" onClick={() => setSelected(null)}><Icon name="close" /></button></div>
          <p className="text-xs text-stone-600">{activeReport.kind}</p>
          <h2 className="mt-2 font-serif text-2xl">{activeReport.title}</h2>
          <p className="mt-3 text-sm">{activeReport.place}</p>
          <p className="mt-2 text-sm text-stone-600">{activeReport.time} · {activeReport.source}</p>
          <p className="mt-3 rounded-lg bg-[#f4f0df] p-3 text-xs leading-5">Demo report · source not linked · status not verified{activeReport.photo ? ' · demo photo attached (not displayed)' : ''}</p>
          <button className={`${button} mt-3 w-full bg-[#315a44] text-white`} onClick={() => openThread(activeReport, 'Map')}>View in community →</button>
        </section>}
        <span role="status" className="sr-only">{activeReport ? `Selected ${activeReport.place}. ${activeReport.status}. Report details are open.` : `${visible.length} matching demo reports.`}</span>
      </div>
    </main>}
    {view === 'Community' && <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col overflow-hidden px-4 pt-3 motion-safe:animate-[rise-in_400ms_ease-out_backwards] lg:px-8 lg:pt-5">
      {thread ? <div tabIndex={0} role="region" aria-label="Report discussion" className="mx-auto min-h-0 w-full max-w-3xl flex-1 overflow-y-auto overscroll-contain px-1 pb-6 focus-visible:ring-2 motion-safe:animate-[drift-right_380ms_cubic-bezier(.2,.8,.2,1)_backwards]">
        <div className="sticky top-0 z-10 border-b border-stone-200 bg-[#f8f7f3]">
        <button className={`${button} px-0`} onClick={() => {
          const origin = threadOrigin.current;
          setThread(null); setView(origin);
        }}>← Back to {threadOrigin.current === 'Map' ? 'map' : 'community'}</button>
        </div>
        <div className="mt-4"><StatusMark status={thread.status} className="uppercase tracking-[.14em]" /></div>
        <h1 className="mt-2 font-serif text-4xl">{thread.title}</h1>
        <p className="mt-4 text-sm text-stone-600">{thread.place} · {thread.source} · {thread.time}</p>
        <p className="mt-4 text-sm text-[#785c2c]">Demo thread · source not linked · all activity is illustrative</p>
        <section className="my-8 rounded-xl border border-stone-200 bg-white p-6">
          <h2 className="font-serif text-2xl">The story so far</h2>
          {[
            ['Report logged', `${thread.time} · sample ${thread.source.toLowerCase()}`],
            ['Resident follow-up', 'Later in this sample timeline · illustrative observation'],
            ['Agency response', thread.source === 'Sample agency update' ? 'Sample update only · no linked record' : 'No linked record'],
          ].map(([title, detail], i) => <div key={title} style={{ animationDelay: `${i * 90}ms` }} className="mt-5 flex gap-4 text-sm motion-safe:animate-[rise-in_360ms_ease-out_backwards]">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e9eddf] text-xs">{i + 1}</span>
            <div><p className="font-medium">{title}</p><p className="mt-1 text-stone-600">{detail}</p></div>
          </div>)}
          <p className="mt-5 text-sm leading-6 text-stone-600">No linked record does not prove that no work happened. This timeline is a demonstration, not an official case history.</p>
          <div className="mt-5 rounded-lg bg-[#f0f2e9] p-4">
            <p className="text-sm font-medium">No budget record is linked to this report.</p>
            <p className="mt-2 text-sm leading-6 text-stone-600">Explore the illustrative zones below for comparison. These are not confirmed funding sources or jurisdiction assignments.</p>
            <div className="mt-3 flex flex-wrap gap-2">{zones.map((z, i) => <button key={z.name} className={`${button} border border-[#b8c3ac]`} onClick={() => {
              setZoneIndex(i); setView('Budget'); setThread(null); setCopied(false); window.scrollTo(0, 0);
            }}>{z.name} · ₹{z.amount.toFixed(2)} Cr ↗</button>)}</div>
          </div>
        </section>
        <div className="sticky top-11 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-[#f8f7f3] py-2">
          <h2 className="font-serif text-2xl">Discussion ({count(thread.id)})</h2>
          <select aria-label="Comment sort" className="min-h-11 rounded border border-stone-300 p-2 text-sm" value={commentSort} onChange={e => setCommentSort(e.target.value)}>
            {['Relevance', 'Top', 'New'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <p className="mt-3 text-sm text-stone-600">{commentSort === 'Relevance' ? 'Relevance: original sample order.' : commentSort === 'Top' ? 'Top: highest local demo score first.' : 'New: newest comments first.'} Replies stay under their parent. Votes reset on reload.</p>
        {comments.filter(c => c.report === thread.id && !c.parent).sort((a, b) =>
          commentSort === 'New' ? b.date - a.date : commentSort === 'Top' ? b.score + (commentVotes[b.id] || 0) - a.score - (commentVotes[a.id] || 0) : a.date - b.date
        ).map(commentNode)}
        <form className="mt-7" onSubmit={async e => {
          e.preventDefault();
          if (!draft.trim()) return;
          const parent = comments.find(c => c.id === reply && c.report === thread.id)?.id;
          const optimistic: Comment = { id: Date.now(), report: thread.id, parent, text: draft.trim(), author: 'Neighbour', score: 0, date: Date.now(), local: true };
          setComments(c => [...c, optimistic]); setDraft(''); setReply(undefined);
          try { const saved = await createComment({ report: thread.id, parent, text: optimistic.text }); setComments(c => c.map(x => x.id === optimistic.id ? saved : x)); setNotice('Comment saved.'); }
          catch { setComments(c => c.filter(x => x.id !== optimistic.id)); setNotice('Comment could not be saved.'); }
        }}>
          <label htmlFor="composer" className="text-sm font-medium">{reply ? 'Reply to ' + comments.find(c => c.id === reply)?.author : 'Add your perspective'}</label>
          {reply && <button type="button" className={button} onClick={() => setReply(undefined)}>Cancel reply</button>}
          <textarea id="composer" maxLength={500} value={draft} onChange={e => setDraft(e.target.value)} className="mt-3 min-h-28 w-full rounded-xl border border-stone-300 bg-white p-4 text-sm focus-visible:ring-2 focus-visible:ring-[#426b53]" placeholder="Keep it helpful. All comments here are local demos." />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-stone-600">{draft.length}/500 · draft kept for this thread until reload</span>
            <button disabled={!draft.trim()} className={`${button} bg-[#315a44] text-white disabled:opacity-60`}>Post demo comment</button>
          </div>
        </form>
      </div> : <>
        <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
          <div><p className="mb-1 hidden text-xs font-semibold tracking-[.16em] text-[#58704d] md:block">LOCAL VOICES. SHARED GROUND.</p>
            <h1 className="font-serif text-2xl tracking-tight lg:text-4xl">Your neighbourhood, heard.</h1>
            <p className="mt-2 hidden text-sm text-stone-600 md:block">A shared picture of Delhi’s drains. All reports and interactions are demos.</p>
          </div>
          <button className={`${button} hidden shrink-0 border border-[#b8c3ac] md:block`} onClick={() => setModal('report')}>+ Report an issue</button>
        </div>
        <div className="grid min-h-0 flex-1 gap-6 overflow-hidden lg:grid-cols-[1fr_280px]">
          <section className="flex min-h-0 min-w-0 flex-col overflow-hidden">
            <div className="z-10 shrink-0 border-y border-stone-200 bg-[#f8f7f3] py-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm">{visible.length} demo reports</span>
                <label className="flex items-center gap-2 text-sm">Sort:
                  <select aria-label="Sort community reports" value={sort} onChange={e => setSort(e.target.value)} className="min-h-11 rounded-lg border border-stone-300 bg-white px-3">
                    {['Relevance', 'Hot', 'Top', 'New', 'Comment Count'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </label>
              </div>
              <p className="mt-1 text-xs text-stone-600">{sort === 'Relevance' ? 'Relevance: curated sample order.' : sort === 'Hot' ? 'Hot: votes weighted by age.' : sort === 'Top' ? 'Top: highest demo vote score.' : sort === 'New' ? 'New: most recent first.' : 'Most discussed first.'} Votes are demo-only / local.</p>
            </div>
          <div ref={postsRef} role="region" aria-label="Community posts" tabIndex={0} onScroll={e => { communityScroll.current = e.currentTarget.scrollTop; }} className="min-h-0 flex-1 overflow-y-auto overscroll-contain pt-3 pr-2 [scrollbar-gutter:stable] motion-safe:animate-[rise-in_350ms_ease-out_backwards] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#426b53]">
          <details className="mb-3 rounded-lg border border-dashed border-stone-300">
            <summary className="flex min-h-11 cursor-pointer items-center px-3 text-xs text-stone-600 focus-visible:ring-2">Preview demo states · {feedState} ▾</summary>
          <div className="flex flex-wrap items-center gap-1 p-2">
            <span className="mr-2 pl-2 text-xs text-stone-600">Preview demo states:</span>
            {['ready', 'loading', 'error', 'empty'].map(s => <button key={s} aria-pressed={feedState === s} className={`${button} px-3 capitalize ${feedState === s ? 'bg-[#e9eddf]' : ''}`} onClick={() => testFeed(s)}>{s}</button>)}
          </div>
          </details>
          {feedState === 'loading' && <div role="status" aria-busy="true" className="rounded-xl border border-stone-200 bg-white p-8">
            <p className="font-serif text-2xl">Gathering the neighbourhood…</p>
            <p className="mt-3 text-sm text-stone-600">Simulated loading only. Sample reports will return shortly.</p>
            <div aria-hidden="true" className="mt-6 space-y-4">{[1, 2, 3].map(n => <div key={n} style={{ animationDelay: `${n * 120}ms` }} className="h-12 rounded-lg bg-[linear-gradient(90deg,#f5f5f4_25%,#e7e7e5_37%,#f5f5f4_63%)] bg-[length:250%_100%] motion-safe:animate-[shimmer_1.8s_ease-in-out_infinite]" />)}</div>
            <button className={`${button} mt-4 border border-stone-300`} onClick={() => testFeed('ready')}>Cancel loading preview</button>
          </div>}
          {feedState === 'error' && <div role="alert" className="rounded-xl border border-[#dfc5b5] bg-[#fff9f3] p-8 motion-safe:animate-[rise-in_350ms_ease-out_backwards]">
            <h2 className="font-serif text-2xl">The feed couldn’t load.</h2>
            <p className="my-3 text-sm leading-6 text-stone-600">This is a simulated error, not a live service outage. Your local votes and comments are unchanged.</p>
            <button className={`${button} bg-[#315a44] text-white`} onClick={() => testFeed('loading')}>Retry demo feed</button>
          </div>}
          {feedState === 'ready' && visible.map((r, i) => <article key={r.id} style={{ animationDelay: `${i * 45}ms` }} className="group relative mb-4 flex gap-4 overflow-hidden rounded-2xl border border-[#e0e4d9] bg-[#fffefb] p-5 shadow-[0_2px_5px_#243b2603] transition-[border-color,box-shadow,transform] duration-300 hover:border-[#b7c6a8] hover:shadow-[0_6px_24px_#243b260a] motion-safe:animate-[rise-in_450ms_ease-out_backwards] motion-safe:hover:-translate-y-0.5">
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-[3px]" style={{ background: colors[r.status] }} />
            <div className="flex h-fit flex-col items-center rounded-xl border border-[#e7e9df] bg-[#f5f6f0]">
              <button className={`${button} px-2 ${votes[r.id] === 1 ? 'bg-[#dce8d6]' : ''}`} aria-label={`Upvote ${r.place}`} aria-pressed={votes[r.id] === 1} onClick={() => vote(r.id, 1)}><Icon name="up" /></button>
              <strong key={`${r.id}-${votes[r.id] || 0}`} className={`text-sm tabular-nums ${votes[r.id] ? 'text-[#315a44] motion-safe:animate-[confirm_250ms_ease-out_both]' : ''}`}>{r.votes + (votes[r.id] || 0)}</strong>
              <button className={`${button} px-2 ${votes[r.id] === -1 ? 'bg-[#e8ded2]' : ''}`} aria-label={`Downvote ${r.place}`} aria-pressed={votes[r.id] === -1} onClick={() => vote(r.id, -1)}><Icon name="down" /></button>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2"><StatusMark status={r.status} /><span className="text-xs text-stone-600">{r.kind} · {r.time}</span></div>
              <button className="mt-3 min-h-11 text-left font-serif text-2xl leading-8 hover:text-[#47704c] focus-visible:ring-2" onClick={() => goMap(r)}>{r.title}</button>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-stone-600"><Icon name="pin" className="h-4 w-4" />{r.place}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-stone-600">
                <span className="flex items-center gap-2 font-medium text-[#36533d]"><span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#d4ddc8] bg-gradient-to-br from-[#edf1e4] to-[#d9e3cc]">{r.author[0]}</span>{r.author}</span>
                <span>{r.reputation} sample reputation</span><span>· {r.source}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <button className={`${button} flex items-center gap-2 px-0`} onClick={() => openThread(r, 'Community')}><Icon name="comment" />{count(r.id)} comments</button>
                <span className="text-xs text-stone-600">{r.photo ? 'Demo photo attached · ' : ''}Source not linked</span>
              </div>
            </div>
          </article>)}
          {(feedState === 'empty' || (feedState === 'ready' && !visible.length)) && <div className="rounded-xl border border-stone-200 bg-white p-10 text-center motion-safe:animate-[rise-in_350ms_ease-out_backwards]">
            <h2 className="font-serif text-2xl">No reports in this corner.</h2>
            <p className="my-3 text-sm text-stone-600">{feedState === 'empty' ? 'This is a demo empty-state preview. Your sample reports are unchanged.' : 'Try a different place or clear the filters.'}</p>
            <button className={`${button} bg-[#e9eddf]`} onClick={() => { setSearch(''); setArea('All Delhi'); testFeed('ready'); }}>Clear filters & show reports</button>
          </div>}
          </div>
        </section>
        <aside className="hidden min-h-0 space-y-4 overflow-y-auto overscroll-contain pb-4 motion-safe:animate-[rise-in_420ms_ease-out_backwards] [animation-delay:140ms] lg:block">
          <div className="relative isolate overflow-hidden rounded-2xl bg-[#213f30] p-6 text-white shadow-[0_8px_28px_#213f3018]">
            <Contours />
            <div className="relative">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#74956c] bg-[#365640] text-[#e1ebd6]"><Icon name="budget" /></span>
            <p className="mt-5 text-xs font-semibold tracking-widest text-[#d5e3c9]">THE BIGGER PICTURE</p>
            <h2 className="mt-2 font-serif text-3xl">Follow the money.</h2>
            <p className="mt-4 font-serif text-4xl">₹<AnimatedAmount value={zones.reduce((a, z) => a + z.amount, 0)} /> <span className="text-2xl">Cr</span></p>
            <p className="mt-2 text-sm leading-6 text-slate-300">Illustrative allocations across {zones.length} zones. Public money deserves public questions.</p>
            <button className={`${button} mt-5 flex w-full items-center justify-between bg-[#e5edda] text-[#213f30] hover:bg-white`} onClick={() => changeView('Budget')}>Explore the budget <Icon name="arrow" /></button>
            <p className="mt-3 text-xs text-slate-300">Sample figures · not official budget data</p>
            </div>
          </div>
          <div className="rounded-xl border border-stone-200 p-5">
            <h2 className="font-serif text-xl">A little ground etiquette.</h2>
            <p className="mt-3 text-sm leading-6 text-stone-600">Be specific. Be neighbourly. Don’t share personal details. These sample reports are not official complaints or verified records.</p>
          </div>
        </aside></div>
      </>}
    </main>}
    {view === 'Budget' && <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col overflow-hidden px-4 pt-3 motion-safe:animate-[rise-in_400ms_ease-out_backwards] lg:px-8 lg:pt-5">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
        <div>
          <p className="mb-1 hidden text-xs font-semibold tracking-[.16em] text-[#58704d] md:block">PUBLIC MONEY. PUBLIC QUESTIONS.</p>
          <h1 className="font-serif text-2xl tracking-tight lg:text-4xl">Follow every rupee.</h1>
          <p className="mt-2 hidden text-sm text-stone-600 md:block">Compare the plan. Ask for records. All figures and targets are illustrative.</p>
        </div>
        <div className="shrink-0 rounded-xl border border-[#d9dccf] bg-[#e9eddf] px-3 py-2 md:px-5">
          <p className="text-xs text-stone-600">DEMO TOTAL · FY 2025–26</p>
          <p className="font-serif text-2xl">₹<AnimatedAmount value={zones.reduce((a, z) => a + z.amount, 0)} /> Cr</p>
        </div>
      </div>
      <div role="group" aria-label="Select an illustrative budget zone" className="mb-3 grid shrink-0 grid-cols-3 gap-2">
        {zones.map((z, i) => <button key={z.name} aria-pressed={zoneIndex === i} onClick={() => { setZoneIndex(i); setCopied(false); }} style={{ animationDelay: `${i * 70}ms` }} className={`group relative min-h-11 overflow-hidden rounded-2xl border px-2 py-3 text-left transition-[background-color,border-color,box-shadow,transform] duration-300 focus-visible:ring-2 motion-safe:animate-[rise-in_420ms_ease-out_backwards] motion-safe:hover:-translate-y-0.5 md:px-4 ${zoneIndex === i ? 'border-[#557149] bg-[#edf0e5] shadow-[0_4px_16px_#315a4410] ring-1 ring-[#557149]' : 'border-[#dfe3d7] bg-[#fffef9] hover:border-[#a6b797] hover:shadow-md'}`}>
          <div className="flex items-center justify-between gap-1"><h2 className="text-sm font-medium">{z.name}</h2><span className={`hidden h-5 w-5 items-center justify-center rounded-full md:flex ${zoneIndex === i ? 'bg-[#315a44] text-white' : 'border border-[#ccd6c3] text-[#47633c]'}`}><Icon name={zoneIndex === i ? 'check' : 'arrow'} className="h-3 w-3" /></span></div>
          <p className="mt-1 font-serif text-lg md:text-2xl">₹<AnimatedAmount value={z.amount} /> Cr</p>
          <p className="mt-1 hidden text-xs text-stone-600 md:block">Illustrative target: {z.target} · progress: {z.progress} km</p>
          <div aria-hidden="true" className="mt-3 hidden h-1 rounded-full bg-[#dfe6d6] md:block"><div className="h-1 origin-left rounded-full bg-[#617b4f] motion-safe:animate-[grow_800ms_cubic-bezier(.2,.8,.2,1)_both]" style={{ width: `${z.amount / Math.max(...zones.map(z => z.amount)) * 100}%`, animationDelay: `${i * 90}ms` }} /></div>
        </button>)}
      </div>
      <div role="region" aria-label="Budget application and sources" tabIndex={0}
        ref={el => { if (el) el.scrollTop = panelScroll.current.Budget; }}
        onScroll={e => { panelScroll.current.Budget = e.currentTarget.scrollTop; }}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-5 pr-2 [scrollbar-gutter:stable] focus-visible:ring-2 [&>div>section>div:first-child]:sticky [&>div>section>div:first-child]:top-0 [&>div>section>div:first-child]:z-10 [&>div>section>div:first-child]:bg-[#fffef9] [&>div>section>div:first-child]:py-2">
      <p className="mb-3 text-sm text-stone-600 md:hidden">{zone.name} · illustrative target: {zone.target} · sample progress: {zone.progress} km</p>
      <div className="grid gap-7 lg:grid-cols-[1.6fr_1fr]"><section className="min-w-0 rounded-xl border border-stone-200 bg-[#fffef9] p-6 motion-safe:animate-[rise-in_420ms_ease-out_both] [animation-delay:180ms]"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs text-stone-600">SECTION 6(1) · RTI ACT, 2005</p><h2 className="mt-2 font-serif text-3xl">Ask about {zone.name}.</h2></div><button className={`${button} bg-[#315a44] text-white`} onClick={async () => { try { await navigator.clipboard.writeText(rti); setCopied(true); } catch { setCopied(false); const el = document.getElementById('rti-text') as HTMLTextAreaElement; el.focus(); el.select(); setNotice('Clipboard blocked. The application is selected; copy it manually.'); } }}>{copied ? 'Copied ✓' : 'Copy application'}</button></div><p className="my-4 text-sm leading-6 text-stone-600">A starting point, not a filed application. Fill the bracketed placeholders, confirm the correct PIO and fee, then print, sign and submit it yourself.</p><textarea id="rti-text" aria-label="Selectable pre-filled RTI application" readOnly value={rti} className="h-[430px] w-full resize-y rounded-lg border border-stone-200 bg-[#f8f7f3] p-5 font-mono text-sm leading-7" /><p className="mt-3 text-xs text-stone-600">Groundwork does not file or submit RTI applications.</p></section><aside className="space-y-5 motion-safe:animate-[rise-in_420ms_ease-out_both] [animation-delay:240ms]"><section className="rounded-xl border border-stone-200 bg-[#fffef9] p-6"><h2 className="font-serif text-2xl">Add a source, not a claim.</h2><p className="my-3 text-sm leading-6 text-stone-600">Save a reference for {zone.name}. Links are not verified. Figures remain illustrative until an official source is attached; saving a link does not validate or replace these demo figures.</p><form onSubmit={e => { e.preventDefault(); try { const url = new URL(sourceUrl); if (!['http:', 'https:'].includes(url.protocol)) throw new Error(); const next = [...links, { zone: zone.name, url: url.href, label: sourceLabel.trim() }]; localStorage.setItem('groundwork-links', JSON.stringify(next)); setLinks(next); setSourceUrl(''); setSourceLabel(''); setNotice('Link saved locally · not verified'); } catch { setNotice('Could not save. Use an http(s) URL and allow local storage.'); } }} className="space-y-4"><label className="block text-sm">Source label<input required maxLength={100} value={sourceLabel} onChange={e => setSourceLabel(e.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-stone-300 p-3" placeholder="e.g. Budget document" /></label><label className="block text-sm">Source URL<input type="url" required value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-stone-300 p-3" placeholder="https://" /></label><button className={`${button} w-full border border-[#9aab8d]`}>Save link locally</button></form>{links.filter(l => l.zone === zone.name).map((l, i) => <div key={i} className="mt-5 border-t border-stone-200 pt-4"><a href={l.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center break-all text-sm underline">{l.label} ↗</a><p className="text-xs text-stone-600">Link saved locally · not verified</p></div>)}</section><p className="px-2 text-sm leading-6 text-stone-600">These sample targets were added for this demo; the starter contained no existing targets or official source records.</p></aside></div>
      </div>
    </main>}
    <footer className="z-20 flex shrink-0 items-center justify-between gap-3 border-t border-stone-200 bg-[#fbfaf7] px-4 py-2 text-xs text-stone-600">
      <span className="hidden md:inline">Groundwork · Delhi drainage watch</span>
      <span>Demo · not verified · illustrative reports & budgets</span>
      <span className="hidden lg:inline">Votes & comments reset on reload</span>
    </footer>
    {notice && <div className="fixed bottom-12 left-1/2 z-[70] w-[90%] max-w-lg -translate-x-1/2">
      <div role="status" className="flex items-start gap-3 rounded-2xl border border-[#71886a] bg-[#213f30] px-5 py-4 text-sm leading-6 text-white shadow-[0_12px_48px_#10291c35] motion-safe:animate-[sheet-up_300ms_cubic-bezier(.2,.8,.2,1)_both]">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#dce9cf] text-[#213f30]"><Icon name="layers" className="h-4 w-4" /></span><span className="min-w-0 flex-1 break-words">{notice}</span>{notice.startsWith('Supabase unavailable:') && <button aria-label="Dismiss database error" className="-mr-2 -mt-2 min-h-11 min-w-11 rounded-lg text-lg text-white/80 hover:bg-white/10" onClick={() => setNotice('')}>×</button>}
      </div>
    </div>}
    {modal === 'report' && <ReportFlow close={() => setModal('')} />}
    {modal === 'help' && <Dialog title="A little help on the ground." description="Groundwork is an interactive demo, not an official reporting service." close={() => setModal('')}><dl className="my-6 space-y-5 text-sm"><div className="flex justify-between"><dt>Focus global search</dt><dd>Cmd / Ctrl + K</dd></div><div className="flex justify-between"><dt>Open demo report</dt><dd>Cmd / Ctrl + R</dd></div><div className="flex justify-between"><dt>Close overlays</dt><dd>Escape</dd></div></dl><p className="text-sm leading-7 text-stone-600">Map and Community share the same sample reports and filters. Votes and comments reset on reload. Source links are stored only in this browser. Photo checks run in a browser-local simulator. No report is sent, no RTI is filed, and no source is verified.</p></Dialog>}
  </div>;
}
