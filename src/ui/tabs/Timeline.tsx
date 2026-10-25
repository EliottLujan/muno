import { filterMeetings } from '../../domain/filters'
import type { Meeting } from '../../domain/types'
import { actions, useStore } from '../../store/store'
import { Frise } from './Frise'

export function Timeline({ onOpen, onAdd }: { onOpen: (m: Meeting) => void; onAdd: () => void }) {
  const { meetings, friends, filters } = useStore()
  const visible = filterMeetings(meetings, friends, filters)

  if (meetings.length === 0) {
    return (
      <div className="flex h-full animate-rise flex-col items-center justify-center gap-6 px-6 text-center">
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

  if (visible.length === 0) {
    return (
      <div className="flex h-full animate-rise flex-col items-center justify-center gap-4 text-center text-white/60">
        <div className="text-6xl">🫥</div>
        <p className="font-display text-2xl font-bold text-white">Aucun moment ne correspond.</p>
        <button
          type="button"
          onClick={() => actions.setFilters({ text: '', friendId: null, activity: null, period: 'all' })}
          className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/15 hover:bg-white/15"
        >
          Effacer les filtres
        </button>
      </div>
    )
  }

  return <Frise meetings={visible} friends={friends} onOpen={onOpen} />
}
