import { formatMonth } from '../../domain/dates'
import { filterMeetings, groupByMonth } from '../../domain/filters'
import type { Meeting } from '../../domain/types'
import { actions, useStore } from '../../store/store'
import { FiltersBar, MeetingCard } from '../components'

export function Timeline({ onOpen, onAdd }: { onOpen: (m: Meeting) => void; onAdd: () => void }) {
  const { meetings, friends, filters } = useStore()
  const byId = new Map(friends.map((f) => [f.id, f]))
  const groups = groupByMonth(filterMeetings(meetings, friends, filters))

  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <span className="text-6xl">🖕</span>
        <p className="text-slate-600">Aucun rendez-vous pour l'instant.</p>
        <button type="button" onClick={onAdd} className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white">
          Ajouter mon premier RDV
        </button>
        <button type="button" onClick={actions.loadDemo} className="text-sm text-indigo-600 underline">
          Charger des exemples
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <FiltersBar filters={filters} friends={friends} />
      {groups.length === 0 && <p className="py-10 text-center text-slate-500">Aucun rendez-vous ne correspond aux filtres.</p>}
      {groups.map((g) => (
        <section key={g.key} className="space-y-2">
          <h2 className="sticky top-0 z-10 bg-slate-50/90 py-1 text-xs font-bold uppercase tracking-wider text-slate-500 backdrop-blur">
            {formatMonth(g.key)} · {g.meetings.length}
          </h2>
          <ol className="relative space-y-3 border-l-2 border-indigo-100 pl-4">
            {g.meetings.map((m) => (
              <li key={m.id} className="relative">
                <span className="absolute -left-[23px] top-5 h-3 w-3 rounded-full bg-indigo-500 ring-4 ring-slate-50" />
                <MeetingCard meeting={m} friends={byId} onOpen={() => onOpen(m)} />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
