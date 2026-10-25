import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { RotateCcw, Search, X } from 'lucide-react'
import { ACTIVITIES, ACTIVITY_META, PERIOD_LABELS, type Activity, type Filters, type Friend, type Period } from '../domain/types'
import { actions } from '../store/store'

export const glass = 'bg-white/[0.04] ring-1 ring-white/10 backdrop-blur-xl'

const AVATAR_GRADIENTS = [
  'from-fuchsia-500 to-violet-600',
  'from-orange-400 to-rose-500',
  'from-sky-400 to-indigo-600',
  'from-emerald-400 to-teal-600',
  'from-amber-300 to-orange-500',
  'from-pink-400 to-fuchsia-600',
  'from-violet-400 to-blue-600',
  'from-lime-300 to-emerald-500',
]

function hash(s: string): number {
  let h = 0
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0
  return Math.abs(h)
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const AVATAR_SIZES = { sm: 'h-7 w-7 text-[11px]', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg', xl: 'h-20 w-20 text-2xl' }

export function Avatar({ friend, size = 'md', className = '' }: { friend: Friend; size?: keyof typeof AVATAR_SIZES; className?: string }) {
  const [broken, setBroken] = useState(false)
  return (
    <span
      aria-hidden
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br font-display font-bold text-white shadow-lg ${
        AVATAR_GRADIENTS[hash(friend.id) % AVATAR_GRADIENTS.length]
      } ${AVATAR_SIZES[size]} ${className}`}
    >
      {initials(friend.name)}
      {friend.avatarUrl && !broken && (
        <img src={friend.avatarUrl} alt="" loading="lazy" onError={() => setBroken(true)} className="absolute inset-0 h-full w-full object-cover" />
      )}
    </span>
  )
}

export function AvatarStack({ friends, max = 4 }: { friends: Friend[]; max?: number }) {
  const shown = friends.slice(0, max)
  const rest = friends.length - shown.length
  return (
    <span className="flex -space-x-2">
      {shown.map((f) => (
        <Avatar key={f.id} friend={f} size="sm" className="ring-2 ring-night" />
      ))}
      {rest > 0 && (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold ring-2 ring-night">
          +{rest}
        </span>
      )}
    </span>
  )
}

export function ActivityTile({ activity, size = 'md' }: { activity: Activity; size?: 'md' | 'lg' }) {
  const meta = ACTIVITY_META[activity]
  return (
    <span
      role="img"
      aria-label={meta.label}
      className={`inline-flex shrink-0 items-center justify-center rounded-2xl ${size === 'lg' ? 'h-14 w-14 text-3xl' : 'h-11 w-11 text-2xl'}`}
      style={{
        background: `linear-gradient(135deg, ${meta.color}55, ${meta.color}22)`,
        boxShadow: `inset 0 0 0 1px ${meta.color}66, 0 8px 24px -8px ${meta.color}`,
      }}
    >
      {meta.emoji}
    </span>
  )
}

export function ActivityPill({ activity }: { activity: Activity }) {
  const meta = ACTIVITY_META[activity]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-medium text-white/70 ring-1 ring-white/10">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  )
}

export function FriendChip({ friend, onRemove }: { friend: Friend; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.07] py-1 pl-1 pr-3 text-sm font-medium ring-1 ring-white/10">
      <Avatar friend={friend} size="sm" />
      {friend.name}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Retirer ${friend.name}`} className="-mr-1 text-white/40 hover:text-white">
          <X size={14} />
        </button>
      )}
    </span>
  )
}

function Chip({ active, onClick, children, style }: { active: boolean; onClick: () => void; children: ReactNode; style?: CSSProperties }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={style}
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        active ? 'bg-white text-night shadow-lg shadow-white/10' : 'bg-white/[0.06] text-white/70 ring-1 ring-white/10 hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  )
}

export function FiltersBar({ filters, friends, compact = false }: { filters: Filters; friends: Friend[]; compact?: boolean }) {
  const active = filters.text || filters.friendId || filters.activity || filters.period !== 'all'
  const sortedFriends = [...friends].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <label className={`flex flex-1 items-center gap-2.5 rounded-2xl px-4 py-3 ${glass} focus-within:ring-white/30`}>
          <Search size={18} className="text-white/40" />
          <input
            type="search"
            value={filters.text}
            onChange={(e) => actions.setFilters({ text: e.target.value })}
            placeholder="Un ami, un lieu, un souvenir…"
            className="w-full bg-transparent text-[15px] placeholder:text-white/30 focus:outline-none"
          />
        </label>
        {active && (
          <button
            type="button"
            onClick={() => actions.setFilters({ text: '', friendId: null, activity: null, period: 'all' })}
            aria-label="Réinitialiser les filtres"
            className={`flex w-12 items-center justify-center rounded-2xl text-white/70 ${glass} animate-fade`}
          >
            <RotateCcw size={18} />
          </button>
        )}
      </div>

      {!compact && sortedFriends.length > 0 && (
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          {sortedFriends.map((f) => {
            const selected = filters.friendId === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => actions.setFilters({ friendId: selected ? null : f.id })}
                aria-pressed={selected}
                className="flex w-16 shrink-0 flex-col items-center gap-1.5"
              >
                <span
                  className={`rounded-full p-[2.5px] transition ${
                    selected ? 'bg-gradient-to-tr from-orange-400 via-fuchsia-500 to-violet-500' : 'bg-white/10'
                  }`}
                >
                  <span className="block rounded-full bg-night p-[2px]">
                    <Avatar friend={f} size="lg" className={selected ? '' : 'opacity-80'} />
                  </span>
                </span>
                <span className={`w-full truncate text-center text-xs ${selected ? 'font-semibold text-white' : 'text-white/50'}`}>{f.name}</span>
              </button>
            )
          })}
        </div>
      )}

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
        {ACTIVITIES.map((a) => (
          <Chip key={a} active={filters.activity === a} onClick={() => actions.setFilters({ activity: filters.activity === a ? null : a })}>
            <span>{ACTIVITY_META[a].emoji}</span>
            {ACTIVITY_META[a].label}
          </Chip>
        ))}
      </div>

      <div className={`inline-flex rounded-full p-1 ${glass}`} role="radiogroup" aria-label="Période">
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            role="radio"
            aria-checked={filters.period === p}
            onClick={() => actions.setFilters({ period: p })}
            className={`rounded-full px-3.5 py-1 text-sm transition ${filters.period === p ? 'bg-white/15 font-semibold text-white' : 'text-white/50'}`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[1000] flex animate-fade items-end justify-center bg-black/60 backdrop-blur-sm md:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[94dvh] w-full animate-sheet overflow-y-auto rounded-t-[32px] bg-surface/95 px-5 pb-[calc(env(safe-area-inset-bottom)+20px)] pt-3 shadow-2xl ring-1 ring-white/10 backdrop-blur-2xl md:max-w-xl md:rounded-[32px] md:pb-6"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/20 md:hidden" />
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold tracking-tight">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function StatTile({ value, label, hint, style }: { value: ReactNode; label: string; hint?: ReactNode; style?: CSSProperties }) {
  return (
    <div className={`animate-rise rounded-3xl p-4 ${glass}`} style={style}>
      <div className="font-display text-3xl font-bold tracking-tight md:text-4xl">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wider text-white/50">{label}</div>
      {hint && <div className="mt-2 truncate text-sm text-white/70">{hint}</div>}
    </div>
  )
}
