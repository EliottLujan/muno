import { useState } from 'react'
import type { Activity as ActivityType, Meeting } from '../domain/types'
import { actions } from '../store/store'
import { MeetingForm } from './MeetingForm'
import { Settings } from './Settings'
import { Activity } from './tabs/Activity'
import { Friends } from './tabs/Friends'
import { MapView } from './tabs/MapView'
import { Timeline } from './tabs/Timeline'

type Tab = 'timeline' | 'map' | 'friends' | 'activity'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'timeline', label: 'Timeline', icon: '🕒' },
  { id: 'map', label: 'Carte', icon: '🗺️' },
  { id: 'friends', label: 'Amis', icon: '👥' },
  { id: 'activity', label: 'Activité', icon: '📊' },
]

type Editing = { meeting?: Meeting } | null

export function App() {
  const [tab, setTab] = useState<Tab>('timeline')
  const [editing, setEditing] = useState<Editing>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const open = (meeting: Meeting) => setEditing({ meeting })
  const add = () => setEditing({})

  function showFriend(friendId: string) {
    actions.setFilters({ friendId, activity: null, text: '', period: 'all' })
    setTab('timeline')
  }

  function showActivity(activity: ActivityType) {
    actions.setFilters({ activity, friendId: null, text: '', period: 'all' })
    setTab('timeline')
  }

  return (
    <div className="flex h-full flex-col md:flex-row">
      <nav className="order-last flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:order-first md:w-56 md:flex-col md:border-r md:border-t-0 md:p-4">
        <div className="hidden items-center gap-2 px-2 pb-6 text-2xl font-black md:flex">🖕 Nuno</div>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs md:flex-none md:flex-row md:gap-3 md:rounded-xl md:px-3 md:py-2.5 md:text-base ${
              tab === t.id ? 'font-semibold text-indigo-600 md:bg-indigo-50' : 'text-slate-500'
            }`}
          >
            <span className="text-xl md:text-lg">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex items-center justify-between px-4 py-3 md:hidden">
          <span className="text-xl font-black">🖕 Nuno</span>
          <button type="button" onClick={() => setSettingsOpen(true)} aria-label="Réglages" className="text-xl">
            ⚙️
          </button>
        </header>
        <header className="hidden items-center justify-end px-6 pt-4 md:flex">
          <button type="button" onClick={() => setSettingsOpen(true)} className="text-sm text-slate-500">
            ⚙️ Réglages
          </button>
        </header>

        <main className="mx-auto w-full max-w-2xl flex-1 overflow-y-auto px-4 pb-24 pt-2 md:px-6 md:pb-8">
          {tab === 'timeline' && <Timeline onOpen={open} onAdd={add} />}
          {tab === 'map' && <MapView onOpen={open} />}
          {tab === 'friends' && <Friends onShowFriend={showFriend} />}
          {tab === 'activity' && <Activity onShowActivity={showActivity} onShowFriend={showFriend} />}
        </main>
      </div>

      <button
        type="button"
        onClick={add}
        aria-label="Nouveau rendez-vous"
        className="fixed bottom-20 right-5 z-[900] h-14 w-14 rounded-full bg-indigo-600 text-3xl text-white shadow-lg md:bottom-8 md:right-8"
      >
        +
      </button>

      {editing && <MeetingForm meeting={editing.meeting} onClose={() => setEditing(null)} />}
      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
