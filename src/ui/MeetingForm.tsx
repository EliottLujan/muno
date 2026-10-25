import { useEffect, useState, type FormEvent } from 'react'
import { todayIso } from '../domain/dates'
import { ACTIVITIES, ACTIVITY_META, type Activity, type Meeting, type Place } from '../domain/types'
import { currentPosition, reverseGeocode, searchPlaces } from '../services/geocoding'
import { actions, useStore } from '../store/store'
import { FriendChip, Modal } from './components'

export function MeetingForm({ meeting, onClose }: { meeting?: Meeting; onClose: () => void }) {
  const { friends } = useStore()
  const [date, setDate] = useState(meeting?.date ?? todayIso())
  const [friendIds, setFriendIds] = useState<string[]>(meeting?.friendIds ?? [])
  const [friendQuery, setFriendQuery] = useState('')
  const [place, setPlace] = useState<Place | null>(meeting?.place ?? null)
  const [placeQuery, setPlaceQuery] = useState('')
  const [placeResults, setPlaceResults] = useState<Place[]>([])
  const [placeError, setPlaceError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [activity, setActivity] = useState<Activity>(meeting?.activity ?? 'resto')
  const [note, setNote] = useState(meeting?.note ?? '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = placeQuery.trim()
    if (q.length < 3) {
      setPlaceResults([])
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(() => {
      searchPlaces(q, controller.signal)
        .then((results) => {
          setPlaceResults(results)
          setPlaceError(results.length ? null : 'Aucun résultat')
        })
        .catch((e: Error) => {
          if (e.name !== 'AbortError') setPlaceError(e.message)
        })
    }, 400)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [placeQuery])

  const q = friendQuery.trim().toLowerCase()
  const suggestions = q ? friends.filter((f) => !friendIds.includes(f.id) && f.name.toLowerCase().includes(q)) : []
  const exactMatch = friends.some((f) => f.name.toLowerCase() === q)

  function addFriend(id: string) {
    setFriendIds((ids) => [...ids, id])
    setFriendQuery('')
  }

  function createFriend() {
    addFriend(actions.addFriend(friendQuery).id)
  }

  async function useMyPosition() {
    setLocating(true)
    setPlaceError(null)
    try {
      const { lat, lng } = await currentPosition()
      setPlace(await reverseGeocode(lat, lng))
      setPlaceQuery('')
    } catch (e) {
      setPlaceError((e as Error).message)
    } finally {
      setLocating(false)
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (friendIds.length === 0) return setError('Ajoute au moins un ami.')
    if (!place) return setError('Choisis un lieu.')
    actions.saveMeeting({ id: meeting?.id, date, friendIds, place, activity, note: note.trim() || undefined })
    onClose()
  }

  function remove() {
    if (meeting && confirm('Supprimer ce rendez-vous ?')) {
      actions.deleteMeeting(meeting.id)
      onClose()
    }
  }

  const byId = new Map(friends.map((f) => [f.id, f]))
  const inputClass = 'w-full rounded-xl border border-slate-200 px-3 py-2'

  return (
    <Modal title={meeting ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <label className="block space-y-1">
          <span className="text-sm font-semibold">Quand</span>
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </label>

        <div className="space-y-2">
          <span className="text-sm font-semibold">Avec qui</span>
          {friendIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {friendIds.map((id) => {
                const f = byId.get(id)
                return f ? <FriendChip key={id} friend={f} onRemove={() => setFriendIds((ids) => ids.filter((x) => x !== id))} /> : null
              })}
            </div>
          )}
          <input
            value={friendQuery}
            onChange={(e) => setFriendQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter' || !q) return
              e.preventDefault()
              if (suggestions[0]) addFriend(suggestions[0].id)
              else if (!exactMatch) createFriend()
            }}
            placeholder="Nom d'un ami…"
            className={inputClass}
          />
          {q && (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((f) => (
                <button key={f.id} type="button" onClick={() => addFriend(f.id)} className="rounded-full bg-slate-100 px-3 py-1 text-sm">
                  + {f.name}
                </button>
              ))}
              {!exactMatch && (
                <button type="button" onClick={createFriend} className="rounded-full bg-indigo-100 px-3 py-1 text-sm text-indigo-700">
                  Créer « {friendQuery.trim()} »
                </button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <span className="text-sm font-semibold">Où</span>
          {place && (
            <div className="flex items-start justify-between gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
              <span>📍 {place.label}</span>
              <button type="button" onClick={() => setPlace(null)} className="text-emerald-700 underline">
                Changer
              </button>
            </div>
          )}
          {!place && (
            <>
              <div className="flex gap-2">
                <input
                  value={placeQuery}
                  onChange={(e) => setPlaceQuery(e.target.value)}
                  placeholder="Adresse, lieu, ville…"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={useMyPosition}
                  disabled={locating}
                  className="shrink-0 rounded-xl bg-slate-100 px-3 text-sm disabled:opacity-50"
                >
                  {locating ? '…' : '📍 Ma position'}
                </button>
              </div>
              {placeError && <p className="text-sm text-rose-600">{placeError}</p>}
              {placeResults.length > 0 && (
                <ul className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200">
                  {placeResults.map((p) => (
                    <li key={`${p.lat},${p.lng}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setPlace(p)
                          setPlaceQuery('')
                          setPlaceResults([])
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                      >
                        {p.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>

        <div className="space-y-2">
          <span className="text-sm font-semibold">Activité</span>
          <div className="flex flex-wrap gap-2">
            {ACTIVITIES.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setActivity(a)}
                aria-pressed={activity === a}
                className={`rounded-full px-3 py-1.5 text-sm ${activity === a ? 'bg-indigo-600 text-white' : 'bg-slate-100'}`}
              >
                {ACTIVITY_META[a].emoji} {ACTIVITY_META[a].label}
              </button>
            ))}
          </div>
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-semibold">Note</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={inputClass} />
        </label>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="flex gap-2">
          {meeting && (
            <button type="button" onClick={remove} className="rounded-xl px-4 py-2.5 text-rose-600">
              Supprimer
            </button>
          )}
          <button type="submit" className="flex-1 rounded-xl bg-indigo-600 py-2.5 font-semibold text-white">
            Enregistrer
          </button>
        </div>
      </form>
    </Modal>
  )
}
