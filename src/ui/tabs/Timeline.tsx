import { MapPin, Sparkles } from 'lucide-react'
import { daysBetween, parseDay, relativeDays } from '../../domain/dates'
import { filterMeetings, groupByMonth } from '../../domain/filters'
import { summarize } from '../../domain/stats'
import { ACTIVITY_META, type Friend, type Meeting } from '../../domain/types'
import { actions, useStore } from '../../store/store'
import { ActivityPill, ActivityTile, AvatarStack, FiltersBar, StatTile, glass } from '../components'

function MonthHeader({ monthKey, count }: { monthKey: string; count: number }) {
  const d = parseDay(`${monthKey}-01`)
  const month = d.toLocaleDateString('fr-FR', { month: 'long' })
  return (
    <div className="sticky top-0 z-20 -mx-4 flex items-baseline gap-3 bg-night/70 px-4 pb-3 pt-4 backdrop-blur-xl md:-mx-2 md:px-2">
      <h2 className="font-display text-4xl font-extrabold capitalize tracking-tight md:text-5xl">{month}</h2>
      <span className="font-display text-2xl font-bold text-white/25">{d.getFullYear()}</span>
      <span className="ml-auto rounded-full bg-white/[0.06] px-2.5 py-0.5 text-xs font-semibold text-white/60 ring-1 ring-white/10">
        {count} moment{count > 1 ? 's' : ''}
      </span>
    </div>
  )
}

function TimelineEntry({ meeting, friends, index, onOpen }: { meeting: Meeting; friends: Friend[]; index: number; onOpen: () => void }) {
  const meta = ACTIVITY_META[meeting.activity]
  const d = parseDay(meeting.date)
  const ago = daysBetween(meeting.date, new Date())
  const names = friends.map((f) => f.name)

  return (
    <li className="relative flex animate-rise gap-3 md:gap-5" style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}>
      <div className="flex w-12 shrink-0 flex-col items-center pt-3 md:w-14">
        <span className="font-display text-3xl font-extrabold leading-none tracking-tight">{d.getDate()}</span>
        <span className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-white/40">
          {d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}
        </span>
        <span className="relative mt-3 flex h-3 w-3">
          {ago <= 7 && <span className="absolute inset-0 animate-ping rounded-full opacity-60" style={{ background: meta.color }} />}
          <span className="relative h-3 w-3 rounded-full ring-4 ring-night" style={{ background: meta.color, boxShadow: `0 0 16px ${meta.color}` }} />
        </span>
      </div>

      <button
        type="button"
        onClick={onOpen}
        className={`group relative mb-4 flex min-w-0 flex-1 gap-4 overflow-hidden rounded-3xl p-4 text-left transition duration-300 hover:-translate-y-0.5 hover:bg-white/[0.07] md:p-5 ${glass}`}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-25 blur-2xl transition group-hover:opacity-40"
          style={{ background: meta.color }}
        />
        <ActivityTile activity={meeting.activity} />
        <span className="relative min-w-0 flex-1 space-y-2">
          <span className="flex items-center justify-between gap-2">
            <span className="truncate font-display text-lg font-bold leading-tight">
              {names.length > 2 ? `${names.slice(0, 2).join(', ')} +${names.length - 2}` : names.join(' & ')}
            </span>
            <span className="shrink-0 text-xs font-medium text-white/40">{relativeDays(ago)}</span>
          </span>
          <span className="flex items-center gap-1.5 text-sm text-white/60">
            <MapPin size={14} className="shrink-0" />
            <span className="truncate">{meeting.place.label}</span>
          </span>
          {meeting.note && <span className="block border-l-2 border-white/15 pl-3 text-sm italic text-white/75">{meeting.note}</span>}
          <span className="flex items-center justify-between pt-1">
            <AvatarStack friends={friends} />
            <ActivityPill activity={meeting.activity} />
          </span>
        </span>
      </button>
    </li>
  )
}

function Hero({ onAdd }: { onAdd: () => void }) {
  const { friends, meetings } = useStore()
  const s = summarize(friends, meetings)
  const last = [...meetings].sort((a, b) => b.date.localeCompare(a.date))[0]
  const byId = new Map(friends.map((f) => [f.id, f]))

  return (
    <section className="space-y-5 pb-2 pt-2">
      <div className="animate-rise">
        <p className="text-sm font-medium text-white/50">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="font-display text-[44px] font-extrabold leading-[0.95] tracking-tight md:text-6xl">
          Tes <span className="text-gradient">moments</span>,<br />
          tes gens.
        </h1>
        {last && (
          <p className="mt-3 text-[15px] text-white/60">
            Dernier en date&nbsp;: <span className="text-white">{last.friendIds.map((id) => byId.get(id)?.name).join(', ')}</span>,{' '}
            {relativeDays(daysBetween(last.date, new Date()))}.
          </p>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2.5 md:gap-3">
        <StatTile value={s.total} label="moments" style={{ animationDelay: '60ms' }} />
        <StatTile value={s.last30Days} label="sur 30 jours" style={{ animationDelay: '120ms' }} />
        <StatTile value={s.places} label="lieux" style={{ animationDelay: '180ms' }} />
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="hidden w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-orange-500 py-3 font-semibold shadow-lg shadow-fuchsia-900/40 md:flex"
      >
        <Sparkles size={18} /> Nouveau moment
      </button>
    </section>
  )
}

export function Timeline({ onOpen, onAdd }: { onOpen: (m: Meeting) => void; onAdd: () => void }) {
  const { meetings, friends, filters } = useStore()
  const byId = new Map(friends.map((f) => [f.id, f]))
  const groups = groupByMonth(filterMeetings(meetings, friends, filters))

  if (meetings.length === 0) {
    return (
      <div className="flex min-h-[70vh] animate-rise flex-col items-center justify-center gap-6 text-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-fuchsia-600 opacity-50 blur-3xl" />
          <span className="relative block text-8xl">🖕</span>
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            Rien. <span className="text-gradient">Nada.</span>
          </h1>
          <p className="max-w-xs text-white/60">Note qui tu vois, quand et où. Nuno se souvient pour toi.</p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onAdd}
            className="rounded-2xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-orange-500 px-6 py-3.5 font-semibold shadow-lg shadow-fuchsia-900/40"
          >
            Ajouter mon premier moment
          </button>
          <button type="button" onClick={actions.loadDemo} className="text-sm font-medium text-white/60 underline-offset-4 hover:text-white hover:underline">
            ou charger des exemples
          </button>
        </div>
      </div>
    )
  }

  let index = 0
  return (
    <div className="space-y-6">
      <Hero onAdd={onAdd} />
      <FiltersBar filters={filters} friends={friends} />
      {groups.length === 0 && (
        <div className={`rounded-3xl p-10 text-center text-white/60 ${glass}`}>
          <div className="mb-2 text-4xl">🫥</div>
          Aucun moment ne correspond.
        </div>
      )}
      {groups.map((g) => (
        <section key={g.key}>
          <MonthHeader monthKey={g.key} count={g.meetings.length} />
          <ol className="relative pt-2">
            <span
              aria-hidden
              className="absolute bottom-4 left-6 top-4 w-px bg-gradient-to-b from-white/25 via-white/10 to-transparent md:left-7"
            />
            {g.meetings.map((m) => (
              <TimelineEntry
                key={m.id}
                meeting={m}
                index={index++}
                friends={m.friendIds.map((id) => byId.get(id)).filter((f): f is Friend => !!f)}
                onOpen={() => onOpen(m)}
              />
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
