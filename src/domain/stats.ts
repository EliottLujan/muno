import { addDays, daysBetween, parseDay, todayIso } from './dates'
import { ACTIVITIES, type Activity, type Friend, type Meeting } from './types'

export function countByActivity(meetings: Meeting[]): { activity: Activity; count: number }[] {
  return ACTIVITIES.map((activity) => ({ activity, count: meetings.filter((m) => m.activity === activity).length }))
    .filter((e) => e.count > 0)
    .sort((a, b) => b.count - a.count)
}

export type FriendStats = { friend: Friend; count: number; lastSeen: string | null; daysSince: number | null }

/** Sorted by most recently seen first; never-seen friends last. */
export function friendStats(friends: Friend[], meetings: Meeting[], now = new Date()): FriendStats[] {
  return friends
    .map((friend) => {
      const mine = meetings.filter((m) => m.friendIds.includes(friend.id))
      const lastSeen = mine.reduce<string | null>((max, m) => (max === null || m.date > max ? m.date : max), null)
      return { friend, count: mine.length, lastSeen, daysSince: lastSeen ? daysBetween(lastSeen, now) : null }
    })
    .sort((a, b) => (b.lastSeen ?? '').localeCompare(a.lastSeen ?? ''))
}

/** Friends seen at least once, longest time since last meeting first. */
export function longestNotSeen(stats: FriendStats[]): FriendStats[] {
  return stats.filter((s) => s.daysSince !== null).sort((a, b) => b.daysSince! - a.daysSince!)
}

export type HeatCell = { date: string; count: number; future: boolean }

/** `weeks` columns of 7 days (Monday first), ending with the week containing `now`. */
export function buildHeatmap(meetings: Meeting[], now = new Date(), weeks = 26): HeatCell[][] {
  const counts = new Map<string, number>()
  for (const m of meetings) counts.set(m.date, (counts.get(m.date) ?? 0) + 1)
  const today = todayIso(now)
  const mondayOffset = (parseDay(today).getDay() + 6) % 7
  const start = addDays(today, -mondayOffset - (weeks - 1) * 7)
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = addDays(start, w * 7 + d)
      return { date, count: counts.get(date) ?? 0, future: date > today }
    }),
  )
}

export type Summary = {
  total: number
  last30Days: number
  places: number
  topFriend: { friend: Friend; count: number } | null
  topPlace: { label: string; count: number } | null
}

function topBy<T>(items: T[], key: (t: T) => string): { item: T; count: number } | null {
  const counts = new Map<string, { item: T; count: number }>()
  for (const item of items) {
    const k = key(item)
    const entry = counts.get(k) ?? { item, count: 0 }
    entry.count++
    counts.set(k, entry)
  }
  return [...counts.values()].sort((a, b) => b.count - a.count)[0] ?? null
}

export function summarize(friends: Friend[], meetings: Meeting[], now = new Date()): Summary {
  const byId = new Map(friends.map((f) => [f.id, f]))
  const friendHits = meetings.flatMap((m) => m.friendIds.map((id) => byId.get(id))).filter((f): f is Friend => !!f)
  const topFriend = topBy(friendHits, (f) => f.id)
  const topPlace = topBy(meetings, (m) => m.place.label)
  return {
    total: meetings.length,
    last30Days: meetings.filter((m) => daysBetween(m.date, now) <= 30 && daysBetween(m.date, now) >= 0).length,
    places: new Set(meetings.map((m) => m.place.label)).size,
    topFriend: topFriend && { friend: topFriend.item, count: topFriend.count },
    topPlace: topPlace && { label: topPlace.item.place.label, count: topPlace.count },
  }
}
