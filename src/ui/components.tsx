import type { ReactNode } from 'react'
import { formatDay } from '../domain/dates'
import { ACTIVITIES, ACTIVITY_META, PERIOD_LABELS, type Filters, type Friend, type Meeting, type Period } from '../domain/types'
import { actions } from '../store/store'

const CHIP_COLORS = [
  'bg-rose-100 text-rose-800',
  'bg-amber-100 text-amber-800',
  'bg-emerald-100 text-emerald-800',
  'bg-sky-100 text-sky-800',
  'bg-violet-100 text-violet-800',
  'bg-fuchsia-100 text-fuchsia-800',
  'bg-teal-100 text-teal-800',
]

function colorFor(id: string): string {
  let hash = 0
  for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) | 0
  return CHIP_COLORS[Math.abs(hash) % CHIP_COLORS.length]
}

export function FriendChip({ friend, onRemove }: { friend: Friend; onRemove?: () => void }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium ${colorFor(friend.id)}`}>
      {friend.name}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Retirer ${friend.name}`} className="opacity-60 hover:opacity-100">
          ×
        </button>
      )}
    </span>
  )
}

export function MeetingCard({ meeting, friends, onOpen }: { meeting: Meeting; friends: Map<string, Friend>; onOpen: () => void }) {
  const meta = ACTIVITY_META[meeting.activity]
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 transition hover:ring-indigo-300"
    >
      <span className="text-2xl" aria-label={meta.label}>
        {meta.emoji}
      </span>
      <span className="min-w-0 flex-1 space-y-1.5">
        <span className="block text-sm font-semibold capitalize text-slate-500">{formatDay(meeting.date)}</span>
        <span className="flex flex-wrap gap-1.5">
          {meeting.friendIds.map((id) => {
            const f = friends.get(id)
            return f ? <FriendChip key={id} friend={f} /> : null
          })}
        </span>
        <span className="block truncate text-sm text-slate-700">📍 {meeting.place.label}</span>
        {meeting.note && <span className="block truncate text-sm italic text-slate-500">{meeting.note}</span>}
      </span>
    </button>
  )
}

const selectClass = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm'

export function FiltersBar({ filters, friends }: { filters: Filters; friends: Friend[] }) {
  const active = filters.text || filters.friendId || filters.activity || filters.period !== 'all'
  return (
    <div className="space-y-2">
      <input
        type="search"
        value={filters.text}
        onChange={(e) => actions.setFilters({ text: e.target.value })}
        placeholder="🔍 Rechercher un ami, un lieu, une note…"
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5"
      />
      <div className="flex flex-wrap gap-2">
        <select
          aria-label="Ami"
          value={filters.friendId ?? ''}
          onChange={(e) => actions.setFilters({ friendId: e.target.value || null })}
          className={selectClass}
        >
          <option value="">Tous les amis</option>
          {[...friends]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
        </select>
        <select
          aria-label="Activité"
          value={filters.activity ?? ''}
          onChange={(e) => actions.setFilters({ activity: (e.target.value || null) as Filters['activity'] })}
          className={selectClass}
        >
          <option value="">Toutes activités</option>
          {ACTIVITIES.map((a) => (
            <option key={a} value={a}>
              {ACTIVITY_META[a].emoji} {ACTIVITY_META[a].label}
            </option>
          ))}
        </select>
        <select
          aria-label="Période"
          value={filters.period}
          onChange={(e) => actions.setFilters({ period: e.target.value as Period })}
          className={selectClass}
        >
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <option key={p} value={p}>
              {PERIOD_LABELS[p]}
            </option>
          ))}
        </select>
        {active && (
          <button
            type="button"
            onClick={() => actions.setFilters({ text: '', friendId: null, activity: null, period: 'all' })}
            className="px-2 text-sm text-indigo-600"
          >
            Réinitialiser
          </button>
        )}
      </div>
    </div>
  )
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-slate-900/40 md:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[100dvh] w-full overflow-y-auto bg-white p-5 shadow-xl md:max-w-lg md:rounded-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="text-2xl leading-none text-slate-400">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
