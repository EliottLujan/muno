import type { Meeting } from './types'

export type Point = { x: number; y: number }
export type Bounds = { minX: number; minY: number; maxX: number; maxY: number }

const COS_LAT = Math.cos((46.5 * Math.PI) / 180)

/** Equirectangular projection tuned for France: 100 units ≈ 1° of latitude. */
export function project(lat: number, lng: number): Point {
  return { x: (lng + 6) * COS_LAT * 100, y: (52 - lat) * 100 }
}

export function boundsOf(points: Point[]): Bounds {
  return {
    minX: Math.min(...points.map((p) => p.x)),
    minY: Math.min(...points.map((p) => p.y)),
    maxX: Math.max(...points.map((p) => p.x)),
    maxY: Math.max(...points.map((p) => p.y)),
  }
}

export type PlaceGroup = Point & { key: string; label: string; meetings: Meeting[] }

export function groupByPlace(meetings: Meeting[]): PlaceGroup[] {
  const groups = new Map<string, PlaceGroup>()
  for (const m of meetings) {
    const key = `${m.place.lat.toFixed(4)},${m.place.lng.toFixed(4)}`
    const group = groups.get(key)
    if (group) group.meetings.push(m)
    else groups.set(key, { key, label: m.place.label, meetings: [m], ...project(m.place.lat, m.place.lng) })
  }
  return [...groups.values()]
}

export type Cluster = Point & { key: string; groups: PlaceGroup[]; count: number }

/** Greedy clustering: biggest places first, each joins the first cluster within `radius`. */
export function clusterGroups(groups: PlaceGroup[], radius: number): Cluster[] {
  const clusters: Cluster[] = []
  const sorted = [...groups].sort((a, b) => b.meetings.length - a.meetings.length || a.key.localeCompare(b.key))
  for (const g of sorted) {
    const weight = g.meetings.length
    const near = clusters.find((c) => Math.hypot(c.x - g.x, c.y - g.y) <= radius)
    if (!near) {
      clusters.push({ key: g.key, x: g.x, y: g.y, groups: [g], count: weight })
      continue
    }
    const total = near.count + weight
    near.x = (near.x * near.count + g.x * weight) / total
    near.y = (near.y * near.count + g.y * weight) / total
    near.count = total
    near.groups.push(g)
  }
  return clusters
}
