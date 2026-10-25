import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { divIcon, latLngBounds } from 'leaflet'
import { ArrowUpRight } from 'lucide-react'
import { daysBetween, formatDay, relativeDays } from '../../domain/dates'
import { filterMeetings } from '../../domain/filters'
import { ACTIVITY_META, type Activity, type Meeting } from '../../domain/types'
import { useStore } from '../../store/store'
import { FiltersBar, glass } from '../components'

function FitBounds({ meetings }: { meetings: Meeting[] }) {
  const map = useMap()
  useEffect(() => {
    if (meetings.length === 0) return
    map.flyToBounds(latLngBounds(meetings.map((m) => [m.place.lat, m.place.lng])), { padding: [60, 60], maxZoom: 15, duration: 0.8 })
  }, [map, meetings])
  return null
}

const icons = new Map<string, ReturnType<typeof divIcon>>()
function markerIcon(activity: Activity, recent: boolean) {
  const key = `${activity}-${recent}`
  if (!icons.has(key)) {
    const { color, emoji } = ACTIVITY_META[activity]
    icons.set(
      key,
      divIcon({
        className: 'muno-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -18],
        html: `<div style="position:relative;width:40px;height:40px">
          ${recent ? `<span style="position:absolute;inset:-6px;border-radius:9999px;background:${color};opacity:.35;animation:ping 1.6s cubic-bezier(0,0,.2,1) infinite"></span>` : ''}
          <span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;border-radius:9999px;font-size:20px;
            background:radial-gradient(circle at 30% 30%, ${color}, ${color}aa);box-shadow:0 0 0 3px #0a0a12, 0 0 0 4px ${color}88, 0 8px 24px ${color}">${emoji}</span>
        </div>`,
      }),
    )
  }
  return icons.get(key)!
}

export function MapView({ onOpen }: { onOpen: (m: Meeting) => void }) {
  const { meetings, friends, filters } = useStore()
  const byId = new Map(friends.map((f) => [f.id, f.name]))
  const visible = useMemo(() => filterMeetings(meetings, friends, filters), [meetings, friends, filters])
  const now = new Date()

  return (
    <div className="relative -mx-4 -mt-2 h-[calc(100dvh-64px)] md:mx-0 md:mt-0 md:h-[calc(100dvh-48px)] md:overflow-hidden md:rounded-[32px] md:ring-1 md:ring-white/10">
      <MapContainer center={[46.6, 2.4]} zoom={5} zoomControl={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds meetings={visible} />
        {visible.map((m) => {
          const ago = daysBetween(m.date, now)
          return (
            <Marker key={m.id} position={[m.place.lat, m.place.lng]} icon={markerIcon(m.activity, ago <= 7)}>
              <Popup>
                <div className="w-56 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-white/50">
                    <span>
                      {ACTIVITY_META[m.activity].emoji} {ACTIVITY_META[m.activity].label}
                    </span>
                    <span>{relativeDays(ago)}</span>
                  </div>
                  <div className="font-display text-lg font-bold leading-tight">
                    {m.friendIds.map((id) => byId.get(id)).filter(Boolean).join(', ')}
                  </div>
                  <div className="text-xs capitalize text-white/60">{formatDay(m.date)}</div>
                  <div className="text-xs text-white/60">{m.place.label}</div>
                  <button
                    type="button"
                    onClick={() => onOpen(m)}
                    className="mt-1 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-night"
                  >
                    Ouvrir <ArrowUpRight size={12} />
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] bg-gradient-to-b from-night via-night/70 to-transparent px-4 pb-10 pt-4 md:px-5">
        <div className="pointer-events-auto mx-auto max-w-2xl">
          <FiltersBar filters={filters} friends={friends} compact />
        </div>
      </div>
      <div className={`absolute bottom-28 left-4 z-[500] rounded-full px-3.5 py-1.5 text-sm font-semibold md:bottom-5 md:left-5 ${glass}`}>
        {visible.length} moment{visible.length > 1 ? 's' : ''} sur la carte
      </div>
    </div>
  )
}
