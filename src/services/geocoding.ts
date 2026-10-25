import type { Place } from '../domain/types'

const BASE = 'https://nominatim.openstreetmap.org'

type NominatimResult = { display_name: string; lat: string; lon: string }

function toPlace(r: NominatimResult): Place {
  return { label: r.display_name, lat: Number(r.lat), lng: Number(r.lon) }
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const url = `${BASE}/search?format=json&limit=5&accept-language=fr&q=${encodeURIComponent(query)}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Géocodage indisponible (${res.status})`)
  return ((await res.json()) as NominatimResult[]).map(toPlace)
}

export async function reverseGeocode(lat: number, lng: number): Promise<Place> {
  const url = `${BASE}/reverse?format=json&accept-language=fr&lat=${lat}&lon=${lng}`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error()
    const r = (await res.json()) as NominatimResult
    return { label: r.display_name, lat, lng }
  } catch {
    return { label: `Position ${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng }
  }
}

export function currentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Géolocalisation non disponible'))
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => reject(new Error('Position refusée ou indisponible')),
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  })
}
