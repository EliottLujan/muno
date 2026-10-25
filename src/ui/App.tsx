import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { CalendarDays, ChartColumn, Clock3, Map as MapIcon, Plus, Search, Settings2, SlidersHorizontal, Users, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { filterMeetings } from '../domain/filters'
import { summarize } from '../domain/stats'
import { EMPTY_FILTERS, type Activity as ActivityType, type Meeting } from '../domain/types'
import { actions, useStore } from '../store/store'
import { FiltersBar, glass } from './components'
import { MeetingForm } from './MeetingForm'
import { Settings } from './Settings'
import { Activity } from './tabs/Activity'
import { CalendarView } from './tabs/CalendarView'
import { FakeMap } from './tabs/FakeMap'
import { Friends } from './tabs/Friends'
import { Timeline } from './tabs/Timeline'

type View = 'frise' | 'map' | 'calendar' | 'friends' | 'activity'

const VIEWS: { id: View; label: string; Icon: LucideIcon }[] = [
  { id: 'frise', label: 'Frise', Icon: Clock3 },
  { id: 'map', label: 'Carte', Icon: MapIcon },
  { id: 'calendar', label: 'Calendrier', Icon: CalendarDays },
  { id: 'friends', label: 'Amis', Icon: Users },
  { id: 'activity', label: 'Activité', Icon: ChartColumn },
]

const corner = 'pointer-events-none fixed z-50 flex items-center gap-2 [&>*]:pointer-events-auto'
const topEdge = 'top-[calc(env(safe-area-inset-top)+12px)] md:top-6'
const bottomEdge = 'bottom-[calc(env(safe-area-inset-bottom)+12px)] md:bottom-6'

function Logo() {
  const { friends, meetings } = useStore()
  const s = summarize(friends, meetings)
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-600 via-violet-600 to-orange-500 font-display text-2xl font-extrabold shadow-lg shadow-fuchsia-900/50">
        M
      </span>
      <span className="leading-none">
        <span className="block font-display text-2xl font-extrabold tracking-tight">Muno</span>
        {s.total > 0 && (
          <span className="mt-0.5 hidden text-[11px] font-medium text-white/45 md:block">
            {s.total} moments · {friends.length} amis · {s.places} lieux
          </span>
        )}
      </span>
    </span>
  )
}

function Filters() {
  const { filters, friends } = useStore()
  const [open, setOpen] = useState(false)
  const count = [filters.text, filters.friendId, filters.activity, filters.period !== 'all'].filter(Boolean).length

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <label className={`hidden h-10 w-56 items-center gap-2 rounded-full px-3.5 transition-[width] focus-within:w-72 focus-within:ring-white/30 lg:flex ${glass}`}>
          <Search size={16} className="shrink-0 text-white/40" />
          <input
            type="search"
            value={filters.text}
            onChange={(e) => actions.setFilters({ text: e.target.value })}
            placeholder="Un ami, un lieu…"
            className="w-full bg-transparent text-sm placeholder:text-white/30 focus:outline-none"
          />
        </label>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Filtres"
          className={`relative flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-white/80 hover:text-white ${glass} ${open ? 'ring-white/40' : ''}`}
        >
          <SlidersHorizontal size={17} />
          <span className="hidden md:inline">Filtres</span>
          {count > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-500 to-orange-400 px-1 text-[11px] font-bold">{count}</span>
          )}
        </button>
      </div>
      {open && (
        <>
          <div className="fixed inset-0" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 w-[min(calc(100vw-24px),440px)] animate-sheet rounded-3xl bg-surface/95 p-4 shadow-2xl shadow-black/60 ring-1 ring-white/10 backdrop-blur-2xl">
            <FiltersBar filters={filters} friends={friends} />
            {count > 0 && (
              <button type="button" onClick={() => actions.setFilters(EMPTY_FILTERS)} className="mt-3 text-sm font-medium text-white/55 hover:text-white">
                Tout effacer
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function Panel({ title, wide, onClose, children }: { title?: string; wide?: boolean; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <div className="fixed inset-0 z-30 animate-fade bg-night/60 backdrop-blur-md" onClick={onClose} />
      <section
        role="dialog"
        aria-label={title}
        className={`fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+76px)] top-[calc(env(safe-area-inset-top)+64px)] z-40 mx-auto flex animate-sheet flex-col rounded-[32px] bg-surface/80 shadow-2xl shadow-black/60 ring-1 ring-white/10 backdrop-blur-2xl md:inset-x-6 md:bottom-24 md:top-24 ${
          wide ? 'max-w-6xl' : 'max-w-3xl'
        }`}
      >
        <header className={title ? 'flex items-center justify-between px-5 pt-4 md:px-6' : 'absolute right-4 top-4 z-10'}>
          {title && <h2 className="font-display text-2xl font-extrabold tracking-tight">{title}</h2>}
          <button type="button" onClick={onClose} aria-label="Fermer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20">
            <X size={18} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 md:p-5">{children}</div>
      </section>
    </>
  )
}

export function App() {
  const { meetings, friends, filters } = useStore()
  const [view, setView] = useState<View>('frise')
  const [editing, setEditing] = useState<{ meeting?: Meeting; date?: string } | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const visible = filterMeetings(meetings, friends, filters)

  const open = useCallback((meeting: Meeting) => setEditing({ meeting }), [])
  const add = useCallback(() => setEditing({}), [])
  const home = () => setView('frise')

  function showFriend(friendId: string) {
    actions.setFilters({ ...EMPTY_FILTERS, friendId })
    home()
  }

  function showActivity(activity: ActivityType) {
    actions.setFilters({ ...EMPTY_FILTERS, activity })
    home()
  }

  return (
    <div className="relative h-dvh overflow-hidden">
      <div className="aurora" />
      <div className="grain" />

      <main className="absolute inset-0 z-10 pb-[calc(env(safe-area-inset-bottom)+76px)] pt-[calc(env(safe-area-inset-top)+60px)] md:pb-24 md:pt-6">
        <Timeline onOpen={open} onAdd={add} />
      </main>

      {view === 'map' && (
        <Panel title="Carte" wide onClose={home}>
          <FakeMap meetings={visible} friends={friends} onOpen={open} />
        </Panel>
      )}
      {view === 'calendar' && (
        <Panel title="Calendrier" wide onClose={home}>
          <CalendarView meetings={visible} friends={friends} onOpen={open} onAddOn={(date) => setEditing({ date })} />
        </Panel>
      )}
      {view === 'friends' && (
        <Panel onClose={home}>
          <div className="px-2"><Friends onShowFriend={showFriend} /></div>
        </Panel>
      )}
      {view === 'activity' && (
        <Panel onClose={home}>
          <div className="px-2"><Activity onShowActivity={showActivity} onShowFriend={showFriend} /></div>
        </Panel>
      )}

      <header className={`${corner} ${topEdge} left-3 md:left-6`}>
        <button type="button" onClick={home} aria-label="Muno, retour à la frise">
          <Logo />
        </button>
      </header>

      <div className={`${corner} ${topEdge} right-3 md:right-6`}>
        <Filters />
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          aria-label="Réglages"
          className={`flex h-10 w-10 items-center justify-center rounded-full text-white/70 hover:text-white ${glass}`}
        >
          <Settings2 size={18} />
        </button>
      </div>

      <nav aria-label="Vues" className={`${corner} ${bottomEdge} left-3 md:left-6`}>
        <div className="flex items-center gap-0.5 rounded-full bg-night/60 p-1 shadow-2xl shadow-black/50 ring-1 ring-white/10 backdrop-blur-2xl">
          {VIEWS.map(({ id, label, Icon }) => {
            const active = view === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setView(active && id !== 'frise' ? 'frise' : id)}
                aria-current={active ? 'page' : undefined}
                aria-label={label}
                title={label}
                className={`flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold transition-all duration-300 ${
                  active ? 'bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white shadow-lg shadow-fuchsia-900/40' : 'text-white/50 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <Icon size={19} strokeWidth={active ? 2.4 : 1.9} />
                {active && <span className="hidden animate-fade sm:inline">{label}</span>}
              </button>
            )
          })}
        </div>
      </nav>

      <div className={`${corner} ${bottomEdge} right-3 md:right-6`}>
        <button
          type="button"
          onClick={add}
          aria-label="Nouveau moment"
          className="group flex h-[52px] items-center gap-2 rounded-full bg-gradient-to-br from-fuchsia-600 via-violet-600 to-orange-500 px-4 font-semibold shadow-xl shadow-fuchsia-900/60 ring-1 ring-white/20 transition hover:scale-105 active:scale-95"
        >
          <Plus size={24} strokeWidth={2.5} className="transition-transform duration-300 group-hover:rotate-90" />
          <span className="hidden md:inline">Nouveau moment</span>
        </button>
      </div>

      {editing && <MeetingForm meeting={editing.meeting} initialDate={editing.date} onClose={() => setEditing(null)} />}
      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
