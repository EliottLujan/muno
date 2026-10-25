import { Sparkles } from 'lucide-react'
import { daysBetween, relativeDays } from '../../domain/dates'
import { filterMeetings } from '../../domain/filters'
import { summarize } from '../../domain/stats'
import type { Meeting } from '../../domain/types'
import { actions, useStore } from '../../store/store'
import { FiltersBar, StatTile, glass } from '../components'
import { Frise } from './Frise'

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
  const visible = filterMeetings(meetings, friends, filters)

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

  return (
    <div className="space-y-6">
      <Hero onAdd={onAdd} />
      <FiltersBar filters={filters} friends={friends} />
      {visible.length === 0 ? (
        <div className={`rounded-3xl p-10 text-center text-white/60 ${glass}`}>
          <div className="mb-2 text-4xl">🫥</div>
          Aucun moment ne correspond.
        </div>
      ) : (
        <Frise meetings={visible} friends={friends} onOpen={onOpen} />
      )}
    </div>
  )
}
