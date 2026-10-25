import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { CalendarDays, LoaderCircle, LocateFixed, MapPin, Search, Trash2 } from 'lucide-react'
import { todayIso } from '../domain/dates'
import { ACTIVITIES, ACTIVITY_META, type Activity, type Meeting, type Place } from '../domain/types'
import { currentPosition, reverseGeocode, searchPlaces } from '../services/geocoding'
import { actions, useStore } from '../store/store'
import { Avatar, FriendChip, Modal } from './components'

const field = 'w-full rounded-2xl bg-white/[0.05] px-4 py-3 ring-1 ring-white/10 placeholder:text-white/30 focus:outline-none focus:ring-white/30'

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2.5">
      <span className="text-xs font-semibold uppercase tracking-widest text-white/40">{label}</span>
      {children}
    </div>
  )
}

export function MeetingForm({ meeting, onClose }: { meeting?: Meeting; onClose: () => void }) {
  const { friends } = useStore()
  const [date, setDate] = useState(meeting?.date ?? todayIso())
  const [friendIds, setFriendIds] = useState<string[]>(meeting?.friendIds ?? [])
  const [friendQuery, setFriendQuery] = useState('')
  const [place, setPlace] = useState<Place | null>(meeting?.place ?? null)
  const [placeQuery, setPlaceQuery] = useState('')
  const [placeResults, setPlaceResults] = useState<Place[]>([])
  const [placeError, setPlaceError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [activity, setActivity] = useState<Activity>(meeting?.activity ?? 'resto')
  const [note, setNote] = useState(meeting?.note ?? '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const q = placeQuery.trim()
    if (q.length < 3) {
      setPlaceResults([])
      setPlaceError(null)
      return
    }
    const controller = new AbortController()
    const timer = setTimeout(() => {
      setSearching(true)
      searchPlaces(q, controller.signal)
        .then((results) => {
          setPlaceResults(results)
          setPlaceError(results.length ? null : 'Aucun résultat')
        })
        .catch((e: Error) => {
          if (e.name !== 'AbortError') setPlaceError(e.message)
        })
        .finally(() => setSearching(false))
    }, 400)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [placeQuery])

  const q = friendQuery.trim().toLowerCase()
  const available = friends.filter((f) => !friendIds.includes(f.id))
  const suggestions = q ? available.filter((f) => f.name.toLowerCase().includes(q)) : available.slice(0, 8)
  const exactMatch = friends.some((f) => f.name.toLowerCase() === q)

  function addFriend(id: string) {
    setFriendIds((ids) => [...ids, id])
    setFriendQuery('')
    setError(null)
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
      setError(null)
    } catch (e) {
      setPlaceError((e as Error).message)
    } finally {
      setLocating(false)
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (friendIds.length === 0) return setError('Avec qui ? Ajoute au moins une personne.')
    if (!place) return setError('Où ça ? Choisis un lieu.')
    actions.saveMeeting({ id: meeting?.id, date, friendIds, place, activity, note: note.trim() || undefined })
    onClose()
  }

  function remove() {
    if (meeting && confirm('Supprimer ce moment ?')) {
      actions.deleteMeeting(meeting.id)
      onClose()
    }
  }

  const byId = new Map(friends.map((f) => [f.id, f]))

  return (
    <Modal title={meeting ? 'Ce moment-là' : 'Nouveau moment'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-6">
        <Section label="Avec qui">
          {friendIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
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
            placeholder="Tape un prénom…"
            className={field}
          />
          {(suggestions.length > 0 || (q && !exactMatch)) && (
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              {suggestions.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => addFriend(f.id)}
                  className="flex shrink-0 items-center gap-2 rounded-full bg-white/[0.06] py-1 pl-1 pr-3 text-sm ring-1 ring-white/10 hover:bg-white/10"
                >
                  <Avatar friend={f} size="sm" /> {f.name}
                </button>
              ))}
              {q && !exactMatch && (
                <button
                  type="button"
                  onClick={createFriend}
                  className="shrink-0 rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 px-3.5 py-1.5 text-sm font-semibold"
                >
                  + Créer « {friendQuery.trim()} »
                </button>
              )}
            </div>
          )}
        </Section>

        <Section label="Quand">
          <label className={`flex items-center gap-3 ${field}`}>
            <CalendarDays size={18} className="text-white/40" />
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-transparent focus:outline-none" />
          </label>
        </Section>

        <Section label="Où">
          {place ? (
            <div className="flex items-start gap-3 rounded-2xl bg-emerald-500/10 p-4 text-sm ring-1 ring-emerald-400/30">
              <MapPin size={18} className="mt-0.5 shrink-0 text-emerald-300" />
              <span className="flex-1 text-emerald-50">{place.label}</span>
              <button type="button" onClick={() => setPlace(null)} className="shrink-0 font-semibold text-emerald-300">
                Changer
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <label className={`flex flex-1 items-center gap-3 ${field}`}>
                  {searching ? <LoaderCircle size={18} className="animate-spin text-white/40" /> : <Search size={18} className="text-white/40" />}
                  <input
                    value={placeQuery}
                    onChange={(e) => setPlaceQuery(e.target.value)}
                    placeholder="Adresse, bar, ville…"
                    className="w-full bg-transparent placeholder:text-white/30 focus:outline-none"
                  />
                </label>
                <button
                  type="button"
                  onClick={useMyPosition}
                  disabled={locating}
                  aria-label="Utiliser ma position"
                  className="flex w-14 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] ring-1 ring-white/10 hover:bg-white/10 disabled:opacity-50"
                >
                  {locating ? <LoaderCircle size={20} className="animate-spin" /> : <LocateFixed size={20} />}
                </button>
              </div>
              {placeError && <p className="text-sm text-rose-400">{placeError}</p>}
              {placeResults.length > 0 && (
                <ul className="overflow-hidden rounded-2xl ring-1 ring-white/10">
                  {placeResults.map((p) => (
                    <li key={`${p.lat},${p.lng}`} className="border-b border-white/5 last:border-0">
                      <button
                        type="button"
                        onClick={() => {
                          setPlace(p)
                          setPlaceQuery('')
                          setPlaceResults([])
                          setError(null)
                        }}
                        className="flex w-full items-start gap-2.5 px-4 py-3 text-left text-sm text-white/80 hover:bg-white/[0.06]"
                      >
                        <MapPin size={15} className="mt-0.5 shrink-0 text-white/40" />
                        {p.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Section>

        <Section label="Quoi">
          <div className="grid grid-cols-4 gap-2 md:grid-cols-7">
            {ACTIVITIES.map((a) => {
              const meta = ACTIVITY_META[a]
              const selected = activity === a
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => setActivity(a)}
                  aria-pressed={selected}
                  className={`flex flex-col items-center gap-1 rounded-2xl py-3 text-xs font-medium transition ${
                    selected ? 'scale-105 text-white' : 'bg-white/[0.04] text-white/60 ring-1 ring-white/10'
                  }`}
                  style={selected ? { background: `${meta.color}33`, boxShadow: `inset 0 0 0 1.5px ${meta.color}, 0 8px 24px -8px ${meta.color}` } : undefined}
                >
                  <span className="text-2xl">{meta.emoji}</span>
                  {meta.label}
                </button>
              )
            })}
          </div>
        </Section>

        <Section label="Un souvenir">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Ce qu'il s'est passé…" className={field} />
        </Section>

        {error && <p className="animate-fade rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300 ring-1 ring-rose-400/30">{error}</p>}

        <div className="flex gap-2 pt-1">
          {meeting && (
            <button
              type="button"
              onClick={remove}
              aria-label="Supprimer"
              className="flex w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-300 ring-1 ring-rose-400/30"
            >
              <Trash2 size={20} />
            </button>
          )}
          <button
            type="submit"
            className="flex-1 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-violet-600 to-orange-500 py-3.5 font-semibold shadow-lg shadow-fuchsia-900/40 transition active:scale-[0.98]"
          >
            {meeting ? 'Enregistrer' : 'Graver ce moment'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
