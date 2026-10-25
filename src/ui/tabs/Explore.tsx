import { useState } from 'react'
import { CalendarDays, Map as MapIcon } from 'lucide-react'
import { filterMeetings } from '../../domain/filters'
import type { Meeting } from '../../domain/types'
import { useStore } from '../../store/store'
import { FiltersBar, glass } from '../components'
import { CalendarView } from './CalendarView'
import { FakeMap } from './FakeMap'

type View = 'map' | 'calendar'

const VIEWS = [
  { id: 'map', label: 'Carte', Icon: MapIcon },
  { id: 'calendar', label: 'Calendrier', Icon: CalendarDays },
] as const

let lastView: View = 'map'

export function Explore({ onOpen, onAddOn }: { onOpen: (m: Meeting) => void; onAddOn: (date: string) => void }) {
  const { meetings, friends, filters } = useStore()
  const [view, setView] = useState<View>(lastView)
  const visible = filterMeetings(meetings, friends, filters)

  const pick = (next: View) => {
    lastView = next
    setView(next)
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3 pt-2">
        <h1 className="animate-rise font-display text-[40px] font-extrabold leading-none tracking-tight md:text-5xl">
          <span className="text-gradient">Explorer</span>
        </h1>
        <div className={`relative inline-flex rounded-full p-1 ${glass}`} role="tablist" aria-label="Vue">
          <span
            aria-hidden
            className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 shadow-lg shadow-fuchsia-900/40 transition-transform duration-300 ease-out"
            style={{ transform: view === 'calendar' ? 'translateX(100%)' : undefined }}
          />
          {VIEWS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={view === id}
              onClick={() => pick(id)}
              className={`relative flex w-32 items-center justify-center gap-2 rounded-full py-2 text-sm font-semibold transition ${view === id ? 'text-white' : 'text-white/55'}`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>
      </header>
      <FiltersBar filters={filters} friends={friends} compact />
      <div key={view} className="animate-fade">
        {view === 'map' ? (
          <FakeMap meetings={visible} friends={friends} onOpen={onOpen} />
        ) : (
          <CalendarView meetings={visible} friends={friends} onOpen={onOpen} onAddOn={onAddOn} />
        )}
      </div>
    </div>
  )
}
