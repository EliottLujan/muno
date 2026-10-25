export type Friend = { id: string; name: string }

export const ACTIVITIES = ['resto', 'cafe', 'sport', 'soiree', 'culture', 'voyage', 'autre'] as const
export type Activity = (typeof ACTIVITIES)[number]

export const ACTIVITY_META: Record<Activity, { label: string; emoji: string }> = {
  resto: { label: 'Resto', emoji: '🍽️' },
  cafe: { label: 'Café', emoji: '☕' },
  sport: { label: 'Sport', emoji: '🏃' },
  soiree: { label: 'Soirée', emoji: '🎉' },
  culture: { label: 'Culture', emoji: '🎭' },
  voyage: { label: 'Voyage', emoji: '✈️' },
  autre: { label: 'Autre', emoji: '📌' },
}

export type Place = { label: string; lat: number; lng: number }

export type Meeting = {
  id: string
  /** YYYY-MM-DD */
  date: string
  friendIds: string[]
  place: Place
  activity: Activity
  note?: string
}

export type Period = '30d' | '3m' | '1y' | 'all'

export const PERIOD_LABELS: Record<Period, string> = {
  '30d': '30 jours',
  '3m': '3 mois',
  '1y': '1 an',
  all: 'Tout',
}

export type Filters = {
  text: string
  friendId: string | null
  activity: Activity | null
  period: Period
}

export const EMPTY_FILTERS: Filters = { text: '', friendId: null, activity: null, period: 'all' }
