import type { CSSProperties } from 'react'
import { MapPin, Sparkles } from 'lucide-react'
import { daysBetween, parseDay, relativeDays } from '../../domain/dates'
import { filterMeetings, groupByMonth } from '../../domain/filters'
import { summarize } from '../../domain/stats'
import { ACTIVITY_META, type Friend, type Meeting } from '../../domain/types'
import { actions, useStore } from '../../store/store'
import { ActivityPill, ActivityTile, AvatarStack, FiltersBar, StatTile, glass } from '../components'
import { Trail } from './Trail'

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
  const left = index % 2 === 0
  const tilt = (left ? 1 : -1) * (0.5 + (index % 3) * 0.35)

  return (
    <li
      data-trail-entry
      data-trail-color={meta.color}
      className={`trail-entry relative ${left ? 'pl-14 md:pl-20' : 'pr-14 md:pr-20'}`}
      style={{ '--trail-from': left ? '36px' : '-36px', '--trail-tilt': `${tilt}deg` } as CSSProperties}
    >
      <span
        data-trail-node
        className={`trail-node absolute top-1 flex h-12 w-12 flex-col items-center justify-center rounded-full bg-night ${left ? 'left-1 md:left-4' : 'right-1 md:right-4'}`}
        style={{ boxShadow: `0 0 0 2px ${meta.color}, 0 0 28px -2px ${meta.color}` }}
      >
        {ago <= 7 && <span className="absolute inset-0 animate-ping rounded-full opacity-40" style={{ background: meta.color }} />}
        <span className="relative font-display text-lg font-extrabold leading-none">{d.getDate()}</span>
        <span className="relative text-[9px] font-bold uppercase tracking-wider text-white/50">
          {d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}
        </span>
      </span>

      <button
        type="button"
        onClick={onOpen}
        className={`trail-card group relative flex w-full min-w-0 gap-4 overflow-hidden rounded-[28px] p-4 text-left hover:bg-white/[0.07] md:p-5 ${glass}`}
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
          <span className="relative block font-display text-9xl font-extrabold text-gradient">M</span>
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            Rien. <span className="text-gradient">Nada.</span>
          </h1>
          <p className="max-w-xs text-white/60">Note qui tu vois, quand et où. Muno se souvient pour toi.</p>
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
      {groups.length > 0 && (
        <Trail signature={groups.map((g) => g.meetings.map((m) => m.id).join()).join('|')}>
          <div
            data-trail-start
            className="relative mx-auto mb-4 flex w-fit items-center gap-2 rounded-full bg-white/[0.06] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white/70 ring-1 ring-white/10 backdrop-blur-xl"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-fuchsia-400" />
              <span className="relative h-2 w-2 rounded-full bg-fuchsia-400" />
            </span>
            Maintenant
          </div>
          {groups.map((g) => (
            <section key={g.key} className="pb-6">
              <MonthHeader monthKey={g.key} count={g.meetings.length} />
              <ol className="flex flex-col gap-12 pt-6">
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
          <div
            data-trail-end
            className="relative mx-auto mt-10 w-fit rounded-full bg-gradient-to-r from-fuchsia-600/30 to-orange-500/30 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white/80 ring-1 ring-white/15 backdrop-blur-xl"
          >
            ✨ Le début de l'histoire
          </div>
        </Trail>
      )}
    </div>
  )
}
