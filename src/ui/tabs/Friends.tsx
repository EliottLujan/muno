import { useState, type FormEvent } from 'react'
import { formatDay } from '../../domain/dates'
import { friendStats } from '../../domain/stats'
import { actions, useStore } from '../../store/store'

export function Friends({ onShowFriend }: { onShowFriend: (friendId: string) => void }) {
  const { friends, meetings } = useStore()
  const [name, setName] = useState('')
  const stats = friendStats(friends, meetings)

  function add(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    actions.addFriend(name)
    setName('')
  }

  function rename(id: string, current: string) {
    const next = prompt('Nouveau nom', current)
    if (next?.trim()) actions.renameFriend(id, next)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ajouter un ami…"
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5"
        />
        <button type="submit" className="rounded-xl bg-indigo-600 px-4 font-semibold text-white">
          Ajouter
        </button>
      </form>

      {stats.length === 0 && <p className="py-10 text-center text-slate-500">Aucun ami pour l'instant.</p>}

      <ul className="divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-200">
        {stats.map(({ friend, count, lastSeen }) => (
          <li key={friend.id} className="flex items-center gap-3 p-4">
            <button type="button" onClick={() => onShowFriend(friend.id)} className="min-w-0 flex-1 text-left">
              <div className="font-semibold">{friend.name}</div>
              <div className="text-sm text-slate-500">
                {count} RDV{lastSeen && <> · vu le <span className="capitalize">{formatDay(lastSeen)}</span></>}
              </div>
            </button>
            <button type="button" onClick={() => rename(friend.id, friend.name)} aria-label={`Renommer ${friend.name}`} className="p-2">
              ✏️
            </button>
            {count === 0 && (
              <button
                type="button"
                onClick={() => confirm(`Supprimer ${friend.name} ?`) && actions.deleteFriend(friend.id)}
                aria-label={`Supprimer ${friend.name}`}
                className="p-2"
              >
                🗑️
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
