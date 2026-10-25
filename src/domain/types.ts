export type Friend = { id: string; name: string; avatarUrl?: string }

export const ACTIVITIES = ['resto', 'cafe', 'sport', 'soiree', 'culture', 'voyage', 'autre'] as const
export type Activity = (typeof ACTIVITIES)[number]

// Colors validated as a categorical set on the dark surface (#14141c); always paired with emoji + label.
export const ACTIVITY_META: Record<Activity, { label: string; emoji: string; color: string }> = {
  resto: { label: 'Resto', emoji: '🍽️', color: '#d95926' },
  cafe: { label: 'Café', emoji: '☕', color: '#c98500' },
  sport: { label: 'Sport', emoji: '🏃', color: '#008300' },
  soiree: { label: 'Soirée', emoji: '🎉', color: '#d55181' },
  culture: { label: 'Culture', emoji: '🎭', color: '#9085e9' },
  voyage: { label: 'Voyage', emoji: '✈️', color: '#3987e5' },
  autre: { label: 'Autre', emoji: '📌', color: '#199e70' },
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
