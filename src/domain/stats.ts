import { daysBetween } from './dates'
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
