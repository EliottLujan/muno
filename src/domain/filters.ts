import { daysBetween } from './dates'
import type { Filters, Friend, Meeting, Period } from './types'

const PERIOD_DAYS: Record<Period, number> = { '30d': 30, '3m': 92, '1y': 365, all: Infinity }

function normalize(s: string): string {
  return s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

export function sortByDateDesc(meetings: Meeting[]): Meeting[] {
  return [...meetings].sort((a, b) => b.date.localeCompare(a.date))
}

export function filterMeetings(meetings: Meeting[], friends: Friend[], filters: Filters, now = new Date()): Meeting[] {
  const names = new Map(friends.map((f) => [f.id, f.name]))
  const query = normalize(filters.text.trim())
  const maxDays = PERIOD_DAYS[filters.period]

  return sortByDateDesc(
    meetings.filter((m) => {
      if (filters.friendId && !m.friendIds.includes(filters.friendId)) return false
      if (filters.activity && m.activity !== filters.activity) return false
      if (daysBetween(m.date, now) > maxDays) return false
      if (!query) return true
      const haystack = [m.place.label, m.note ?? '', ...m.friendIds.map((id) => names.get(id) ?? '')].join(' ')
      return normalize(haystack).includes(query)
    }),
  )
}

export type MonthGroup = { key: string; meetings: Meeting[] }

/** Expects meetings already sorted by date desc. */
export function groupByMonth(meetings: Meeting[]): MonthGroup[] {
  const groups: MonthGroup[] = []
  for (const m of meetings) {
    const key = m.date.slice(0, 7)
    const last = groups[groups.length - 1]
    if (last?.key === key) last.meetings.push(m)
    else groups.push({ key, meetings: [m] })
  }
  return groups
}
