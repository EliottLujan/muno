import { useState } from 'react'
import { ChartColumn, Clock3, Map as MapIcon, Plus, Settings2, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Activity as ActivityType, Meeting } from '../domain/types'
import { actions } from '../store/store'
import { glass } from './components'
import { MeetingForm } from './MeetingForm'
import { Settings } from './Settings'
import { Activity } from './tabs/Activity'
import { Friends } from './tabs/Friends'
import { MapView } from './tabs/MapView'
import { Timeline } from './tabs/Timeline'

type Tab = 'timeline' | 'map' | 'friends' | 'activity'

const TABS: { id: Tab; label: string; Icon: LucideIcon }[] = [
  { id: 'timeline', label: 'Timeline', Icon: Clock3 },
  { id: 'map', label: 'Carte', Icon: MapIcon },
  { id: 'friends', label: 'Amis', Icon: Users },
  { id: 'activity', label: 'Activité', Icon: ChartColumn },
]

function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-600 via-violet-600 to-orange-500 font-display text-2xl font-extrabold shadow-lg shadow-fuchsia-900/50">
        M
      </span>
      <span className="font-display text-2xl font-extrabold tracking-tight">Muno</span>
    </span>
  )
}

function TabButton({ tab, active, onClick }: { tab: (typeof TABS)[number]; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition md:flex-none md:flex-row md:gap-3 md:rounded-2xl md:px-4 md:py-3 md:text-[15px] ${
        active ? 'text-white md:bg-white/10' : 'text-white/45 hover:text-white/80'
      }`}
    >
      <tab.Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
      {tab.label}
    </button>
  )
}

export function App() {
  const [tab, setTab] = useState<Tab>('timeline')
  const [editing, setEditing] = useState<{ meeting?: Meeting } | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const open = (meeting: Meeting) => setEditing({ meeting })
  const add = () => setEditing({})

  function go(next: Tab) {
    setTab(next)
    document.getElementById('main')?.scrollTo({ top: 0 })
  }

  function showFriend(friendId: string) {
    actions.setFilters({ friendId, activity: null, text: '', period: 'all' })
    go('timeline')
  }

  function showActivity(activity: ActivityType) {
    actions.setFilters({ activity, friendId: null, text: '', period: 'all' })
    go('timeline')
  }

  const settingsButton = (
    <button
      type="button"
      onClick={() => setSettingsOpen(true)}
      aria-label="Réglages"
      className={`flex h-10 w-10 items-center justify-center rounded-full text-white/70 hover:text-white ${glass}`}
    >
      <Settings2 size={18} />
    </button>
  )

  return (
    <div className="relative flex h-full">
      <div className="aurora" />
      <div className="grain" />

      <aside className="relative z-10 hidden w-64 shrink-0 flex-col gap-8 p-6 md:flex">
        <Logo />
        <nav className="flex flex-col gap-1">
          {TABS.map((t) => (
            <TabButton key={t.id} tab={t} active={tab === t.id} onClick={() => go(t.id)} />
          ))}
        </nav>
        <button
          type="button"
          onClick={add}
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-orange-500 py-3 font-semibold shadow-lg shadow-fuchsia-900/40"
        >
          <Plus size={18} /> Nouveau moment
        </button>
        <div className="mt-auto">{settingsButton}</div>
      </aside>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        {tab !== 'map' && (
          <header className="flex items-center justify-between px-4 pb-1 pt-[calc(env(safe-area-inset-top)+12px)] md:hidden">
            <Logo />
            {settingsButton}
          </header>
        )}

        <main
          id="main"
          className={`flex-1 overflow-y-auto ${tab === 'map' ? 'md:p-6' : 'px-4 pb-32 pt-2 md:px-10 md:pb-12 md:pt-8'}`}
        >
          <div className={tab === 'map' ? 'h-full' : 'mx-auto w-full max-w-2xl'}>
            {tab === 'timeline' && <Timeline onOpen={open} onAdd={add} />}
            {tab === 'map' && <MapView onOpen={open} />}
            {tab === 'friends' && <Friends onShowFriend={showFriend} />}
            {tab === 'activity' && <Activity onShowActivity={showActivity} onShowFriend={showFriend} />}
          </div>
        </main>
      </div>

      <nav
        className={`fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+12px)] z-[900] flex items-center rounded-[28px] bg-night/70 px-2 shadow-2xl shadow-black/50 ring-1 ring-white/10 backdrop-blur-2xl md:hidden`}
      >
        {TABS.slice(0, 2).map((t) => (
          <TabButton key={t.id} tab={t} active={tab === t.id} onClick={() => go(t.id)} />
        ))}
        <button
          type="button"
          onClick={add}
          aria-label="Nouveau moment"
          className="-mt-8 mx-1 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-600 via-violet-600 to-orange-500 shadow-xl shadow-fuchsia-900/60 ring-[6px] ring-night transition active:scale-95"
        >
          <Plus size={30} strokeWidth={2.5} />
        </button>
        {TABS.slice(2).map((t) => (
          <TabButton key={t.id} tab={t} active={tab === t.id} onClick={() => go(t.id)} />
        ))}
      </nav>

      {editing && <MeetingForm meeting={editing.meeting} onClose={() => setEditing(null)} />}
      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
