import { describe, expect, it } from 'vitest'
import { buildDemoData } from './demo'
import { filterMeetings, groupByMonth } from './filters'
import { relativeDays } from './dates'
import { meetingsByDay, monthGrid } from './calendar'
import { layoutFrise } from './frise'
import { clusterGroups, groupByPlace, project } from './geo'
import { buildHeatmap, countByActivity, friendStats, longestNotSeen, summarize } from './stats'
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

describe('relativeDays', () => {
  it('formats durations in French', () => {
    expect([0, 1, 5, 62, 400, 800].map(relativeDays)).toEqual([
      "aujourd'hui",
      'hier',
      'il y a 5 j',
      'il y a 2 mois',
      'il y a 1 an',
      'il y a 2 ans',
    ])
  })
})

describe('buildHeatmap', () => {
  it('builds Monday-first weeks ending on the current week and counts meetings per day', () => {
    const grid = buildHeatmap(meetings, now, 2)
    expect(grid).toHaveLength(2)
    expect(grid[0][0].date).toBe('2026-10-12')
    expect(grid[1][6].date).toBe('2026-10-25')
    expect(grid[1].find((c) => c.date === '2026-10-24')?.count).toBe(1)
    expect(grid[1][6].future).toBe(false)
  })
})

describe('summarize', () => {
  it('computes headline numbers', () => {
    const s = summarize(friends, meetings, now)
    expect(s.total).toBe(4)
    expect(s.last30Days).toBe(2)
    expect(s.places).toBe(4)
    expect(s.topFriend).toEqual({ friend: friends[1], count: 3 })
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

describe('monthGrid', () => {
  it('starts on monday and covers the month', () => {
    const grid = monthGrid(2026, 9) // octobre 2026, 1er = jeudi
    expect(grid[0][0]).toBe('2026-09-28')
    expect(grid[0][3]).toBe('2026-10-01')
    expect(grid.flat()).toContain('2026-10-31')
    expect(grid.every((w) => w.length === 7)).toBe(true)
  })

  it('indexes meetings by day', () => {
    const byDay = meetingsByDay([...meetings, { ...meetings[0], id: '5' }])
    expect(byDay.get('2026-10-24')?.map((m) => m.id)).toEqual(['1', '5'])
  })
})

describe('geo', () => {
  it('groups same place and clusters close ones', () => {
    const groups = groupByPlace(meetings)
    expect(groups).toHaveLength(1)
    expect(groups[0].meetings).toHaveLength(4)
    const far = groupByPlace([...meetings, { ...meetings[0], id: 'm', place: { label: 'Marseille', lat: 43.3, lng: 5.37 } }])
    expect(clusterGroups(far, 50)).toHaveLength(2)
    expect(clusterGroups(far, 1000)).toHaveLength(1)
    expect(clusterGroups(far, 1000)[0].count).toBe(5)
  })

  it('projects north up and east right', () => {
    const paris = project(48.85, 2.35)
    const marseille = project(43.3, 5.37)
    expect(marseille.y).toBeGreaterThan(paris.y)
    expect(marseille.x).toBeGreaterThan(paris.x)
  })
})

describe('layoutFrise', () => {
  it('orders oldest to newest and alternates sides', () => {
    const { nodes, months, width } = layoutFrise(meetings, { step: 100, monthGap: 50, pad: 10 })
    expect(nodes.map((n) => n.meeting.id)).toEqual(['3', '2', '4', '1'])
    expect(nodes.map((n) => n.up)).toEqual([true, false, true, false])
    expect(months.map((m) => m.key)).toEqual(['2025-01', '2026-09', '2026-10'])
    expect(nodes[3].x - nodes[2].x).toBe(100)
    expect(nodes[1].x - nodes[0].x).toBe(150)
    expect(width).toBe(nodes[3].x + 10)
  })
})

describe('buildDemoData volume', () => {
  it('is large, deterministic and uses unique ids', () => {
    const a = buildDemoData(now)
    const b = buildDemoData(now)
    expect(a.meetings.length).toBeGreaterThan(150)
    expect(new Set(a.meetings.map((m) => m.id)).size).toBe(a.meetings.length)
    expect(a.meetings.map((m) => m.date)).toEqual(b.meetings.map((m) => m.date))
  })
})
