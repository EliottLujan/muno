import { describe, expect, it } from 'vitest'
import { buildDemoData } from './demo'
import { filterMeetings, groupByMonth } from './filters'
import { countByActivity, friendStats, longestNotSeen } from './stats'
import { EMPTY_FILTERS, type Friend, type Meeting } from './types'

const now = new Date('2026-10-25T12:00:00')
const friends: Friend[] = [
  { id: 'lea', name: 'Léa' },
  { id: 'tom', name: 'Tom' },
  { id: 'max', name: 'Max' },
]
const place = (label: string) => ({ label, lat: 48.85, lng: 2.35 })
const meetings: Meeting[] = [
  { id: '1', date: '2026-10-24', friendIds: ['lea', 'tom'], place: place('Le Petit Bistro'), activity: 'resto' },
  { id: '2', date: '2026-09-02', friendIds: ['tom'], place: place('Stade'), activity: 'sport', note: 'foot' },
  { id: '3', date: '2025-01-10', friendIds: ['lea'], place: place('Café Oberkampf'), activity: 'cafe' },
  { id: '4', date: '2026-10-21', friendIds: ['tom'], place: place('Bar'), activity: 'resto' },
]

describe('filterMeetings', () => {
  it('sorts by date desc with no filter', () => {
    expect(filterMeetings(meetings, friends, EMPTY_FILTERS, now).map((m) => m.id)).toEqual(['1', '4', '2', '3'])
  })

  it('filters by friend', () => {
    expect(filterMeetings(meetings, friends, { ...EMPTY_FILTERS, friendId: 'lea' }, now).map((m) => m.id)).toEqual(['1', '3'])
  })

  it('filters by activity', () => {
    expect(filterMeetings(meetings, friends, { ...EMPTY_FILTERS, activity: 'resto' }, now).map((m) => m.id)).toEqual(['1', '4'])
  })

  it('filters by period', () => {
    expect(filterMeetings(meetings, friends, { ...EMPTY_FILTERS, period: '30d' }, now).map((m) => m.id)).toEqual(['1', '4'])
    expect(filterMeetings(meetings, friends, { ...EMPTY_FILTERS, period: '1y' }, now).map((m) => m.id)).toEqual(['1', '4', '2'])
  })

  it('searches friend names, places and notes ignoring accents and case', () => {
    expect(filterMeetings(meetings, friends, { ...EMPTY_FILTERS, text: 'lea' }, now).map((m) => m.id)).toEqual(['1', '3'])
    expect(filterMeetings(meetings, friends, { ...EMPTY_FILTERS, text: 'CAFE' }, now).map((m) => m.id)).toEqual(['3'])
    expect(filterMeetings(meetings, friends, { ...EMPTY_FILTERS, text: 'foot' }, now).map((m) => m.id)).toEqual(['2'])
  })
})

describe('groupByMonth', () => {
  it('groups consecutive meetings by month', () => {
    const groups = groupByMonth(filterMeetings(meetings, friends, EMPTY_FILTERS, now))
    expect(groups.map((g) => [g.key, g.meetings.length])).toEqual([
      ['2026-10', 2],
      ['2026-09', 1],
      ['2025-01', 1],
    ])
  })
})

describe('buildDemoData', () => {
  it('only references existing friends and dates relative to now', () => {
    const demo = buildDemoData(now)
    const ids = new Set(demo.friends.map((f) => f.id))
    expect(demo.meetings.every((m) => m.friendIds.length > 0 && m.friendIds.every((id) => ids.has(id)))).toBe(true)
    expect(demo.meetings[0].date).toBe('2026-10-24')
  })
})

describe('stats', () => {
  it('counts meetings by activity, most frequent first', () => {
    expect(countByActivity(meetings)).toEqual([
      { activity: 'resto', count: 2 },
      { activity: 'cafe', count: 1 },
      { activity: 'sport', count: 1 },
    ])
  })

  it('computes friend stats sorted by last seen, never-seen last', () => {
    const stats = friendStats(friends, meetings, now)
    expect(stats.map((s) => [s.friend.id, s.count, s.lastSeen, s.daysSince])).toEqual([
      ['lea', 2, '2026-10-24', 1],
      ['tom', 3, '2026-10-24', 1],
      ['max', 0, null, null],
    ])
  })

  it('lists friends not seen for the longest time first', () => {
    const later = new Date('2026-12-01T12:00:00')
    const extra: Meeting[] = [...meetings, { id: '5', date: '2026-11-30', friendIds: ['tom'], place: place('X'), activity: 'autre' }]
    expect(longestNotSeen(friendStats(friends, extra, later)).map((s) => s.friend.id)).toEqual(['lea', 'tom'])
  })
})
