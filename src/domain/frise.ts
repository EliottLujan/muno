import type { Meeting } from './types'

export type FriseNode = { meeting: Meeting; x: number; up: boolean }
export type FriseMonth = { key: string; x: number }
export type FriseLayout = { nodes: FriseNode[]; months: FriseMonth[]; width: number }

/** Oldest on the left, now on the right; cards alternate above/below; extra room between months. */
export function layoutFrise(meetings: Meeting[], { step = 150, monthGap = 70, pad = 120 } = {}): FriseLayout {
  const asc = [...meetings].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
  const nodes: FriseNode[] = []
  const months: FriseMonth[] = []
  let x = pad
  asc.forEach((meeting, i) => {
    const key = meeting.date.slice(0, 7)
    if (months.at(-1)?.key !== key) {
      if (months.length > 0) x += monthGap
      months.push({ key, x: months.length > 0 ? x - (step + monthGap) / 2 : x - step / 2 })
    }
    nodes.push({ meeting, x, up: i % 2 === 0 })
    x += step
  })
  return { nodes, months, width: (nodes.at(-1)?.x ?? 0) + pad }
}
