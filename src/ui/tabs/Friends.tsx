import { useState, type FormEvent } from 'react'
import { Pencil, Trash2, UserPlus } from 'lucide-react'
import { relativeDays } from '../../domain/dates'
import { friendStats } from '../../domain/stats'
import { actions, useStore } from '../../store/store'
import { Avatar, glass } from '../components'
import { freshness } from './freshness'

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
    <div className="space-y-6 pt-2">
      <header className="animate-rise">
        <h1 className="font-display text-5xl font-extrabold tracking-tight">
          Ta <span className="text-gradient">bande</span>
        </h1>
        <p className="mt-2 text-white/60">
          {friends.length} personne{friends.length > 1 ? 's' : ''}, triées par dernière fois vue.
        </p>
      </header>

      <form onSubmit={add} className={`flex animate-rise items-center gap-2 rounded-2xl p-1.5 pl-4 ${glass}`}>
        <UserPlus size={18} className="text-white/40" />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ajouter quelqu'un…"
          className="flex-1 bg-transparent py-2 placeholder:text-white/30 focus:outline-none"
        />
        <button type="submit" className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-night disabled:opacity-40" disabled={!name.trim()}>
          Ajouter
        </button>
      </form>

      {stats.length === 0 && <p className="py-10 text-center text-white/50">Personne pour l'instant. Commence par ajouter un ami.</p>}

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {stats.map(({ friend, count, daysSince }, i) => {
          const fresh = freshness(daysSince)
          return (
            <li key={friend.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
              <div className={`group relative flex h-full flex-col items-center rounded-3xl p-4 text-center transition hover:bg-white/[0.07] ${glass}`}>
                <div className="absolute right-2 top-2 flex gap-0.5 opacity-60 transition group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => rename(friend.id, friend.name)}
                    aria-label={`Renommer ${friend.name}`}
                    className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
                  >
                    <Pencil size={14} />
                  </button>
                  {count === 0 && (
                    <button
                      type="button"
                      onClick={() => confirm(`Supprimer ${friend.name} ?`) && actions.deleteFriend(friend.id)}
                      aria-label={`Supprimer ${friend.name}`}
                      className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-rose-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <button type="button" onClick={() => onShowFriend(friend.id)} className="flex w-full flex-col items-center gap-3 pt-2">
                  <span className="rounded-full p-[3px]" style={{ background: `conic-gradient(${fresh.color} ${fresh.ratio * 360}deg, #ffffff14 0)` }}>
                    <span className="block rounded-full bg-night p-[3px]">
                      <Avatar friend={friend} size="xl" />
                    </span>
                  </span>
                  <span className="w-full space-y-0.5">
                    <span className="block truncate font-display text-xl font-bold">{friend.name}</span>
                    <span className="block text-sm text-white/50">
                      {count} moment{count > 1 ? 's' : ''}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-medium text-white/70">
                    <span aria-hidden>{fresh.icon}</span>
                    {daysSince === null ? 'Jamais vu·e' : relativeDays(daysSince)}
                  </span>
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
