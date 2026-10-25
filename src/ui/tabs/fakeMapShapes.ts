import { project } from '../../domain/geo'

type LatLng = [number, number]

// Hand-traced, deliberately approximate outlines: a stylised map, not a survey.
const FRANCE: LatLng[] = [
  [51.05, 2.37], [50.95, 1.85], [50.72, 1.6], [50.2, 1.6], [49.92, 1.08], [49.49, 0.1], [49.42, 0.23], [49.3, -0.3],
  [49.38, -1.0], [49.67, -1.26], [49.65, -1.62], [49.72, -1.94], [49.37, -1.79], [48.84, -1.6], [48.64, -1.51],
  [48.65, -2.0], [48.52, -2.76], [48.78, -3.05], [48.82, -3.44], [48.72, -3.98], [48.6, -4.6], [48.33, -4.77],
  [48.25, -4.5], [48.04, -4.73], [47.8, -4.37], [47.87, -3.92], [47.73, -3.37], [47.48, -3.12], [47.55, -2.75],
  [47.29, -2.51], [47.27, -2.2], [47.11, -2.1], [46.95, -2.2], [46.5, -1.78], [46.16, -1.15], [45.94, -1.08],
  [45.62, -1.03], [45.57, -1.06], [44.65, -1.25], [44.2, -1.3], [43.65, -1.45], [43.48, -1.56], [43.37, -1.78],
  [43.27, -1.5], [43.05, -1.3], [42.95, -0.7], [42.8, -0.2], [42.7, 0.7], [42.6, 1.45], [42.45, 1.9], [42.43, 2.6],
  [42.43, 3.17], [42.52, 3.08], [42.9, 3.05], [43.15, 3.18], [43.4, 3.7], [43.53, 4.13], [43.35, 4.6], [43.4, 4.9],
  [43.3, 5.35], [43.21, 5.54], [43.17, 5.6], [43.1, 5.93], [43.03, 6.15], [43.27, 6.65], [43.42, 6.75], [43.55, 7.02],
  [43.56, 7.12], [43.7, 7.27], [43.78, 7.5], [44.1, 7.7], [44.4, 6.9], [44.85, 7.0], [45.15, 6.65], [45.45, 7.15],
  [45.9, 6.95], [46.4, 6.8], [46.45, 6.3], [46.2, 6.0], [46.15, 5.95], [46.4, 6.1], [46.6, 6.4], [47.0, 6.8],
  [47.3, 7.0], [47.45, 7.0], [47.5, 7.5], [48.0, 7.55], [48.5, 7.8], [48.95, 8.2], [49.05, 7.6], [49.15, 7.0],
  [49.45, 6.4], [49.5, 5.9], [49.55, 5.45], [49.8, 4.85], [50.15, 4.85], [50.0, 4.2], [50.3, 4.0], [50.45, 3.7],
  [50.75, 3.1], [50.8, 2.6], [51.08, 2.55],
]

const CORSICA: LatLng[] = [
  [43.0, 9.42], [42.7, 9.45], [42.1, 9.55], [41.6, 9.35], [41.37, 9.2], [41.6, 8.8], [41.9, 8.65], [42.25, 8.6],
  [42.55, 8.75], [42.7, 9.05], [43.0, 9.35],
]

const RIVERS: LatLng[][] = [
  [[49.45, 0.2], [49.44, 1.1], [49.0, 1.7], [48.95, 2.2], [48.85, 2.35], [48.5, 3.1], [48.3, 4.08], [47.5, 4.7]],
  [[47.27, -2.2], [47.22, -1.55], [47.4, -0.55], [47.4, 0.7], [47.59, 1.33], [47.9, 1.9], [47.4, 2.9], [46.99, 3.16], [46.4, 3.9], [45.4, 4.0], [44.85, 4.2]],
  [[46.2, 6.1], [45.9, 5.8], [45.76, 4.83], [44.93, 4.89], [43.95, 4.8], [43.68, 4.63], [43.35, 4.75]],
  [[45.57, -1.06], [44.84, -0.57], [44.2, 0.62], [43.6, 1.44], [43.0, 0.6], [42.8, 0.7]],
]

const PARIS_SEINE: LatLng[] = [
  [48.815, 2.46], [48.83, 2.42], [48.845, 2.37], [48.853, 2.35], [48.858, 2.334], [48.862, 2.3], [48.85, 2.275],
  [48.835, 2.255], [48.85, 2.235], [48.88, 2.24],
]

export const CITIES: { name: string; lat: number; lng: number; big?: boolean }[] = [
  { name: 'Paris', lat: 48.8566, lng: 2.3522, big: true },
  { name: 'Lyon', lat: 45.764, lng: 4.8357, big: true },
  { name: 'Marseille', lat: 43.2965, lng: 5.3698, big: true },
  { name: 'Bordeaux', lat: 44.8378, lng: -0.5792, big: true },
  { name: 'Toulouse', lat: 43.6047, lng: 1.4442, big: true },
  { name: 'Lille', lat: 50.6292, lng: 3.0573, big: true },
  { name: 'Nantes', lat: 47.2184, lng: -1.5536 },
  { name: 'Strasbourg', lat: 48.5734, lng: 7.7521 },
  { name: 'Nice', lat: 43.7102, lng: 7.262 },
  { name: 'Rennes', lat: 48.1173, lng: -1.6778 },
  { name: 'Montpellier', lat: 43.6108, lng: 3.8767 },
  { name: 'Brest', lat: 48.3904, lng: -4.4861 },
  { name: 'Annecy', lat: 45.8992, lng: 6.1294 },
  { name: 'Biarritz', lat: 43.4832, lng: -1.5586 },
]

const pts = (line: LatLng[]) => line.map(([lat, lng]) => project(lat, lng))

/** Rounded path through the midpoints, using each vertex as a quadratic control point. */
function smooth(line: LatLng[], closed: boolean): string {
  const p = pts(line)
  const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => `${((a.x + b.x) / 2).toFixed(1)},${((a.y + b.y) / 2).toFixed(1)}`
  if (!closed) {
    let d = `M${p[0].x.toFixed(1)},${p[0].y.toFixed(1)}`
    for (let i = 1; i < p.length - 1; i++) d += ` Q${p[i].x.toFixed(1)},${p[i].y.toFixed(1)} ${mid(p[i], p[i + 1])}`
    const last = p[p.length - 1]
    return `${d} L${last.x.toFixed(1)},${last.y.toFixed(1)}`
  }
  let d = `M${mid(p[p.length - 1], p[0])}`
  for (let i = 0; i < p.length; i++) {
    const next = p[(i + 1) % p.length]
    d += ` Q${p[i].x.toFixed(2)},${p[i].y.toFixed(2)} ${mid(p[i], next)}`
  }
  return `${d}Z`
}

export const LAND = [smooth(FRANCE, true), smooth(CORSICA, true)]
export const RIVER_PATHS = [...RIVERS.map((r) => smooth(r, false)), smooth(PARIS_SEINE, false)]

const paris = project(48.8566, 2.3445)
const parisEdge = project(48.8566 + 0.042, 2.3445 + 0.088)
export const PERIPH = { cx: paris.x, cy: paris.y, rx: parisEdge.x - paris.x, ry: paris.y - parisEdge.y }

export const PARKS = [
  { ...project(48.862, 2.249), rx: 1.4, ry: 2.2 },
  { ...project(48.833, 2.433), rx: 1.8, ry: 1.3 },
  { ...project(48.88, 2.383), rx: 0.35, ry: 0.25 },
]

export const GRATICULE = (() => {
  const lines: string[] = []
  for (let lng = -6; lng <= 10; lng++) {
    const a = project(52, lng)
    const b = project(41, lng)
    lines.push(`M${a.x},${a.y} L${b.x},${b.y}`)
  }
  for (let lat = 41; lat <= 52; lat++) {
    const a = project(lat, -6)
    const b = project(lat, 10)
    lines.push(`M${a.x},${a.y} L${b.x},${b.y}`)
  }
  return lines.join(' ')
})()
