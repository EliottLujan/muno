import { useEffect } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'
import { latLngBounds } from 'leaflet'
import { formatDay } from '../../domain/dates'
import { filterMeetings } from '../../domain/filters'
import { ACTIVITY_META, type Meeting } from '../../domain/types'
import { useStore } from '../../store/store'
import { FiltersBar } from '../components'

function FitBounds({ meetings }: { meetings: Meeting[] }) {
  const map = useMap()
  useEffect(() => {
    if (meetings.length === 0) return
    map.fitBounds(latLngBounds(meetings.map((m) => [m.place.lat, m.place.lng])), { padding: [40, 40], maxZoom: 15 })
  }, [map, meetings])
  return null
}

export function MapView({ onOpen }: { onOpen: (m: Meeting) => void }) {
  const { meetings, friends, filters } = useStore()
  const byId = new Map(friends.map((f) => [f.id, f.name]))
  const visible = filterMeetings(meetings, friends, filters)

  return (
    <div className="flex h-full flex-col gap-3">
      <FiltersBar filters={filters} friends={friends} />
      <div className="min-h-[60vh] flex-1 overflow-hidden rounded-2xl ring-1 ring-slate-200">
        <MapContainer center={[46.6, 2.4]} zoom={5} className="h-full min-h-[60vh] w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds meetings={visible} />
          {visible.map((m) => (
            <CircleMarker
              key={m.id}
              center={[m.place.lat, m.place.lng]}
              radius={9}
              pathOptions={{ color: '#fff', weight: 2, fillColor: '#4f46e5', fillOpacity: 0.9 }}
            >
              <Popup>
                <div className="space-y-1">
                  <div className="font-semibold capitalize">
                    {ACTIVITY_META[m.activity].emoji} {formatDay(m.date)}
                  </div>
                  <div>{m.friendIds.map((id) => byId.get(id)).filter(Boolean).join(', ')}</div>
                  <div className="text-slate-500">{m.place.label}</div>
                  <button type="button" onClick={() => onOpen(m)} className="text-indigo-600 underline">
                    Ouvrir
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
