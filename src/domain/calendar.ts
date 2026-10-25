import { todayIso } from './dates'
import type { Meeting } from './types'

/** Monday-first weeks of ISO dates covering the whole month (month is 0-based). */
export function monthGrid(year: number, month: number): string[][] {
  const offset = (new Date(year, month, 1).getDay() + 6) % 7
  const days = new Date(year, month + 1, 0).getDate()
  const weeks = Math.ceil((offset + days) / 7)
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => todayIso(new Date(year, month, 1 - offset + w * 7 + d))),
  )
}

export function meetingsByDay(meetings: Meeting[]): Map<string, Meeting[]> {
  const byDay = new Map<string, Meeting[]>()
  for (const m of meetings) byDay.set(m.date, [...(byDay.get(m.date) ?? []), m])
  return byDay
}
