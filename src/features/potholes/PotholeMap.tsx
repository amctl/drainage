import { useEffect, useRef, useState } from 'react'
import type { PotholeReport } from '../../data/groundwork'

export type MapMode = 'potholes' | 'fixes'
export type MapPoint = { lat: number; lng: number }

type Props = {
  reports: PotholeReport[]
  fixes: PotholeReport[]
  mode: MapMode
  selectedId: number | null
  center?: MapPoint
  choosingLocation: boolean
  onSelect: (id: number) => void
  onChooseLocation: (point: MapPoint) => void
  onMapError: (message: string) => void
}

const emptyCollection = { type: 'FeatureCollection', features: [] as object[] }
const token = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_MAPBOX_ACCESS_TOKEN

function toCollection(items: PotholeReport[], selectedId: number | null = null) {
  return {
    type: 'FeatureCollection',
    features: items.map((report) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [report.lng, report.lat] },
      properties: {
        id: report.id,
        status: report.status,
        weight: Math.max(1, report.fixedResponses),
        description: report.description,
        selected: report.id === selectedId,
      },
    })),
  }
}

export function PotholeMap({ reports, fixes, mode, selectedId, center, choosingLocation, onSelect, onChooseLocation, onMapError }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const callbacks = useRef({ onSelect, onChooseLocation, onMapError })
  callbacks.current = { onSelect, onChooseLocation, onMapError }
  const choosingLocationRef = useRef(choosingLocation)
  choosingLocationRef.current = choosingLocation
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let disposed = false
    if (!token) {
      setError('Mapbox is not configured. Add VITE_MAPBOX_ACCESS_TOKEN to the app environment.')
      return
    }
    const css = document.createElement('link')
    css.rel = 'stylesheet'
    css.href = 'https://api.mapbox.com/mapbox-gl-js/v3.10.0/mapbox-gl.css'
    document.head.appendChild(css)
    const script = document.createElement('script')
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.10.0/mapbox-gl.js'
    script.onerror = () => {
      const message = 'Mapbox GL could not load. Check network access or content blockers.'
      setError(message)
      callbacks.current.onMapError(message)
    }
    script.onload = () => {
      if (disposed || !container.current) return
      try {
        const mb = (window as any).mapboxgl
        mb.accessToken = token
        const instance = new mb.Map({
          container: container.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [77.205, 28.617],
          zoom: 12,
          attributionControl: true,
          cooperativeGestures: true,
        })
        map.current = instance
        instance.addControl(new mb.NavigationControl({ showCompass: false }), 'bottom-right')
        instance.on('load', () => {
          if (disposed) return
          instance.addSource('pothole-reports', { type: 'geojson', data: emptyCollection })
          instance.addLayer({
            id: 'pothole-pins', type: 'circle', source: 'pothole-reports',
            paint: {
              'circle-color': ['match', ['get', 'status'], 'pending', '#d39239', 'active', '#b74b2b', '#b74b2b'],
              'circle-radius': ['case', ['==', ['get', 'selected'], true], 12, 8],
              'circle-stroke-width': ['case', ['==', ['get', 'selected'], true], 3, 2],
              'circle-stroke-color': '#fffdf7',
            },
          })
          instance.addSource('pothole-fixes', { type: 'geojson', data: emptyCollection })
          instance.addLayer({
            id: 'pothole-fix-heat', type: 'heatmap', source: 'pothole-fixes',
            paint: {
              'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 1, 0.45, 4, 0.8, 10, 1],
              'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 9, 0.7, 14, 1.7],
              'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 9, 18, 14, 36],
              'heatmap-opacity': 0.82,
              'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(49,90,68,0)', 0.18, '#a6bf84', 0.45, '#e3b64c', 0.72, '#dc7838', 1, '#9e392d'],
            },
          })
          instance.on('click', (event: any) => {
            if (choosingLocationRef.current) {
              callbacks.current.onChooseLocation({ lat: event.lngLat.lat, lng: event.lngLat.lng })
              return
            }
            const hits = instance.queryRenderedFeatures(event.point, { layers: ['pothole-pins'] })
            const id = Number(hits[0]?.properties?.id)
            if (Number.isInteger(id)) callbacks.current.onSelect(id)
          })
          instance.on('mouseenter', 'pothole-pins', () => { instance.getCanvas().style.cursor = 'pointer' })
          instance.on('mouseleave', 'pothole-pins', () => { instance.getCanvas().style.cursor = choosingLocationRef.current ? 'crosshair' : '' })
          instance.on('error', (event: any) => {
            const failure = event?.error || event
            const message = `Mapbox request failed${failure?.status ? ` (HTTP ${failure.status})` : ''}: ${failure?.message || 'Unknown map error'}`
            setError(message)
            callbacks.current.onMapError(message)
          })
          setReady(true)
        })
      } catch (cause) {
        const message = `Mapbox initialization failed: ${cause instanceof Error ? cause.message : 'unknown browser error'}`
        setError(message)
        callbacks.current.onMapError(message)
      }
    }
    document.head.appendChild(script)
    return () => {
      disposed = true
      map.current?.remove()
      map.current = null
      css.remove()
      script.remove()
    }
  }, [])

  useEffect(() => {
    const instance = map.current
    if (!ready || !instance) return
    if (instance.getSource('pothole-reports')) instance.getSource('pothole-reports').setData(toCollection(reports, selectedId))
    if (instance.getSource('pothole-fixes')) instance.getSource('pothole-fixes').setData(toCollection(fixes))
    if (instance.getLayer('pothole-pins')) instance.setLayoutProperty('pothole-pins', 'visibility', mode === 'potholes' ? 'visible' : 'none')
    if (instance.getLayer('pothole-fix-heat')) instance.setLayoutProperty('pothole-fix-heat', 'visibility', mode === 'fixes' ? 'visible' : 'none')
    if (selectedId && mode === 'potholes') {
      const selected = reports.find((report) => report.id === selectedId)
      if (selected) instance.flyTo({ center: [selected.lng, selected.lat], zoom: Math.max(instance.getZoom(), 14), duration: 650 })
    }
  }, [ready, reports, fixes, mode, selectedId])

  useEffect(() => {
    if (ready && center) map.current?.flyTo({ center: [center.lng, center.lat], zoom: 14, duration: 800 })
  }, [center, ready])

  useEffect(() => {
    if (ready && map.current) map.current.getCanvas().style.cursor = choosingLocation ? 'crosshair' : ''
  }, [choosingLocation, ready])

  return <div className="absolute inset-0 bg-[#e8ebe2]" aria-label="Map of pothole reports and confirmed fixes">
    <div ref={container} className="mapbox-container absolute inset-0 h-full w-full" />
    {error && <div role="status" className="absolute inset-x-4 top-20 z-10 mx-auto max-w-md rounded-xl border border-[#a65a3d] bg-[#fff8ed] px-4 py-3 text-sm leading-5 text-[#663922] shadow-md">{error}</div>}
    {!ready && !error && <div className="pointer-events-none absolute inset-0 grid place-items-center bg-[#edf0e8] text-sm text-[#405848]">Loading local map…</div>}
  </div>
}
