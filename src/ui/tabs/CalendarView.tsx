import { useMemo, useState, type CSSProperties } from 'react'
import { CalendarPlus, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import { meetingsByDay, monthGrid } from '../../domain/calendar'
import { parseDay, todayIso } from '../../domain/dates'
import { ACTIVITY_META, type Friend, type Meeting } from '../../domain/types'
import { Avatar, AvatarStack, glass } from '../components'

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function CalendarView({
  meetings,
  friends,
  onOpen,
  onAddOn,
}: {
  meetings: Meeting[]
  friends: Friend[]
  onOpen: (m: Meeting) => void
  onAddOn: (date: string) => void
}) {
  const today = todayIso()
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })
  const [selected, setSelected] = useState(today)
  const [dir, setDir] = useState<1 | -1>(1)

  const byId = useMemo(() => new Map(friends.map((f) => [f.id, f])), [friends])
  const byDay = useMemo(() => meetingsByDay(meetings), [meetings])
  const grid = monthGrid(cursor.year, cursor.month)
  const monthKey = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}`
  const inMonth = meetings.filter((m) => m.date.startsWith(monthKey))
  const people = new Set(inMonth.flatMap((m) => m.friendIds)).size
  const dayMeetings = byDay.get(selected) ?? []

  const shift = (delta: 1 | -1) => {
    setDir(delta)
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })
  }
  const goToday = () => {
    const d = new Date()
    setDir(monthKey < today.slice(0, 7) ? 1 : -1)
    setCursor({ year: d.getFullYear(), month: d.getMonth() })
    setSelected(today)
  }

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_320px]">
      <section className={`rounded-[32px] p-4 md:p-5 ${glass}`}>
        <header className="mb-4 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-3xl font-extrabold capitalize leading-none tracking-tight">
              {parseDay(`${monthKey}-01`).toLocaleDateString('fr-FR', { month: 'long' })}{' '}
              <span className="text-white/30">{cursor.year}</span>
            </h2>
            <p className="mt-1 text-xs text-white/50">
              {inMonth.length === 0 ? 'Aucun moment ce mois-ci' : `${inMonth.length} moment${inMonth.length > 1 ? 's' : ''} · ${people} ami${people > 1 ? 's' : ''}`}
            </p>
          </div>
          <button type="button" onClick={goToday} className="rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/70 ring-1 ring-white/10 hover:text-white">
            Aujourd'hui
          </button>
          <button type="button" aria-label="Mois précédent" onClick={() => shift(-1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-white/70 ring-1 ring-white/10 hover:text-white">
            <ChevronLeft size={18} />
          </button>
          <button type="button" aria-label="Mois suivant" onClick={() => shift(1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-white/70 ring-1 ring-white/10 hover:text-white">
            <ChevronRight size={18} />
          </button>
        </header>

        <div className="grid grid-cols-7 gap-1.5 pb-1.5 text-center text-[11px] font-bold uppercase tracking-widest text-white/35">
          {WEEKDAYS.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div key={monthKey} className="calendar-grid grid grid-cols-7 gap-1.5" style={{ '--cal-from': `${dir * 24}px` } as CSSProperties}>
          {grid.flat().map((day, i) => {
            const list = byDay.get(day) ?? []
            const outside = !day.startsWith(monthKey)
            const main = list[0] && ACTIVITY_META[list[0].activity]
            const shot = list.find((m) => m.photos?.length)
            const faces = shot ? shot.friendIds.map((id) => byId.get(id)).filter((f): f is Friend => !!f) : []
            const isToday = day === today
            const isSel = day === selected
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelected(day)}
                aria-pressed={isSel}
                aria-label={`${parseDay(day).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}${list.length ? `, ${list.length} moment${list.length > 1 ? 's' : ''}` : ''}`}
                className={`calendar-cell relative flex aspect-square flex-col items-center justify-between overflow-hidden rounded-2xl p-1 transition md:aspect-[1/0.9] md:p-1.5 ${
                  outside ? 'opacity-30' : ''
                } ${isSel ? 'ring-2 ring-white' : isToday ? 'ring-2 ring-fuchsia-400/80' : 'ring-1 ring-white/[0.06]'} hover:bg-white/[0.06]`}
                style={{
                  animationDelay: `${i * 12}ms`,
                  ...(main && { background: `linear-gradient(160deg, ${main.color}55, ${main.color}18)`, boxShadow: isSel ? undefined : `inset 0 0 0 1px ${main.color}55` }),
                }}
              >
                {shot && (
                  <>
                    <img src={shot.photos![0]} alt="" loading="lazy" decoding="async" draggable={false} className="calendar-photo absolute inset-0 h-full w-full object-cover" />
                    <span className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/60" />
                  </>
                )}
                <span className={`relative self-start pl-1 text-sm font-bold leading-tight drop-shadow md:text-base ${isToday ? 'text-fuchsia-300' : ''}`}>{parseDay(day).getDate()}</span>
                {shot ? (
                  <span className="relative flex -space-x-1.5 self-end">
                    {faces.slice(0, 3).map((f) => (
                      <Avatar key={f.id} friend={f} size="xs" className="ring-[1.5px] ring-black/70" />
                    ))}
                  </span>
                ) : list.length > 0 && (
                  <span className="flex items-center gap-0.5 text-[13px] leading-none md:text-base">
                    {list.slice(0, 3).map((m) => (
                      <span key={m.id}>{ACTIVITY_META[m.activity].emoji}</span>
                    ))}
                    {list.length > 3 && <span className="text-[10px] font-bold text-white/70">+{list.length - 3}</span>}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      <aside className={`rounded-[32px] p-4 md:p-5 ${glass}`}>
        <h3 className="font-display text-xl font-bold capitalize">
          {parseDay(selected).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </h3>
        <p className="mb-3 text-xs text-white/50">
          {dayMeetings.length === 0 ? 'Rien de noté ce jour-là.' : `${dayMeetings.length} moment${dayMeetings.length > 1 ? 's' : ''}`}
        </p>
        <ul key={selected} className="space-y-2">
          {dayMeetings.map((m, i) => {
            const meta = ACTIVITY_META[m.activity]
            const ppl = m.friendIds.map((id) => byId.get(id)).filter((f): f is Friend => !!f)
            return (
              <li key={m.id} className="animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
                <button type="button" onClick={() => onOpen(m)} className="flex w-full items-center gap-3 rounded-2xl bg-white/[0.04] p-3 text-left ring-1 ring-white/10 hover:bg-white/[0.08]">
                  {m.photos?.length ? (
                    <img src={m.photos[0]} alt="" loading="lazy" decoding="async" className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-white/20" />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl" style={{ background: `${meta.color}26`, boxShadow: `inset 0 0 0 1px ${meta.color}66` }}>
                      {meta.emoji}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{ppl.map((f) => f.name).join(', ')}</span>
                    <span className="flex items-center gap-1 truncate text-xs text-white/50">
                      <MapPin size={11} className="shrink-0" />
                      {m.place.label}
                    </span>
                  </span>
                  <AvatarStack friends={ppl} max={2} />
                </button>
              </li>
            )
          })}
        </ul>
        <button
          type="button"
          onClick={() => onAddOn(selected)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-orange-500 py-3 text-sm font-semibold shadow-lg shadow-fuchsia-900/40"
        >
          <CalendarPlus size={17} /> Ajouter un moment ce jour-là
        </button>
      </aside>
    </div>
  )
}
