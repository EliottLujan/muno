import { useState } from 'react'
import { formatDay, relativeDays } from '../../domain/dates'
import { buildHeatmap, countByActivity, friendStats, longestNotSeen, summarize, type HeatCell } from '../../domain/stats'
import { ACTIVITY_META, type Activity as ActivityType } from '../../domain/types'
import { useStore } from '../../store/store'
import { Avatar, StatTile, glass } from '../components'
import { freshness } from './freshness'

// Sequential blue ramp, dark mode: near-zero recedes toward the surface.
const HEAT_STEPS = ['rgba(255,255,255,0.05)', '#184f95', '#2a78d6', '#6da7ec', '#b7d3f6']
const heatColor = (count: number) => HEAT_STEPS[Math.min(count, HEAT_STEPS.length - 1)]

function Heatmap({ grid }: { grid: HeatCell[][] }) {
  const [hover, setHover] = useState<HeatCell | null>(null)
  const months = grid.map((week, i) => {
    const first = week[0].date
    const prev = grid[i - 1]?.[0].date
    return !prev || prev.slice(5, 7) !== first.slice(5, 7)
      ? new Date(`${first}T00:00:00`).toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')
      : ''
  })

  return (
    <div className="space-y-3">
      <div className="no-scrollbar overflow-x-auto">
        <div className="inline-flex flex-col gap-1.5">
          <div className="flex gap-[3px] pl-0 text-[10px] font-medium text-white/40">
            {months.map((m, i) => (
              <span key={i} className="w-3.5 overflow-visible whitespace-nowrap md:w-4">
                {m}
              </span>
            ))}
          </div>
          <div className="flex gap-[3px]" onMouseLeave={() => setHover(null)}>
            {grid.map((week, w) => (
              <div key={w} className="flex flex-col gap-[3px]">
                {week.map((cell) => (
                  <button
                    key={cell.date}
                    type="button"
                    disabled={cell.future}
                    onMouseEnter={() => setHover(cell)}
                    onFocus={() => setHover(cell)}
                    onClick={() => setHover(cell)}
                    aria-label={`${formatDay(cell.date)} : ${cell.count} moment${cell.count > 1 ? 's' : ''}`}
                    className={`h-3.5 w-3.5 rounded-[4px] transition md:h-4 md:w-4 ${cell.future ? 'opacity-0' : 'hover:ring-2 hover:ring-white/60'} ${
                      hover?.date === cell.date ? 'ring-2 ring-white' : ''
                    }`}
                    style={{ background: heatColor(cell.count) }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 text-xs text-white/50">
        <span className="min-h-4 capitalize text-white/80">
          {hover ? (
            <>
              {formatDay(hover.date)} · <b>{hover.count}</b> moment{hover.count > 1 ? 's' : ''}
            </>
          ) : (
            'Survole une case'
          )}
        </span>
        <span className="flex items-center gap-1">
          Moins
          {HEAT_STEPS.map((c) => (
            <span key={c} className="h-3 w-3 rounded-[3px]" style={{ background: c }} />
          ))}
          Plus
        </span>
      </div>
    </div>
  )
}

export function Activity({
  onShowActivity,
  onShowFriend,
}: {
  onShowActivity: (a: ActivityType) => void
  onShowFriend: (friendId: string) => void
}) {
  const { friends, meetings } = useStore()
  const [hoverActivity, setHoverActivity] = useState<ActivityType | null>(null)

  if (meetings.length === 0) return <p className="py-20 text-center text-white/50">Pas encore d'activité. Ajoute un moment !</p>

  const byActivity = countByActivity(meetings)
  const max = Math.max(1, ...byActivity.map((e) => e.count))
  const notSeen = longestNotSeen(friendStats(friends, meetings)).slice(0, 8)
  const s = summarize(friends, meetings)

  return (
    <div className="space-y-6 pt-2">
      <header className="animate-rise">
        <h1 className="font-display text-5xl font-extrabold tracking-tight">
          Ta <span className="text-gradient">vie sociale</span>
        </h1>
        <p className="mt-2 text-white/60">En chiffres, sans jugement. Enfin, presque.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile value={s.total} label="moments" />
        <StatTile value={s.last30Days} label="sur 30 jours" style={{ animationDelay: '50ms' }} />
        <StatTile
          value={s.topFriend ? s.topFriend.count : '—'}
          label="avec ton n°1"
          hint={
            s.topFriend && (
              <span className="flex items-center gap-2">
                <Avatar friend={s.topFriend.friend} size="sm" /> {s.topFriend.friend.name}
              </span>
            )
          }
          style={{ animationDelay: '100ms' }}
        />
        <StatTile value={s.places} label="lieux différents" hint={s.topPlace && `QG : ${s.topPlace.label.split(',')[0]}`} style={{ animationDelay: '150ms' }} />
      </div>

      <section className={`animate-rise space-y-4 rounded-3xl p-5 ${glass}`}>
        <h2 className="font-display text-xl font-bold">Moments sur 6 mois</h2>
        <Heatmap grid={buildHeatmap(meetings)} />
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className={`animate-rise space-y-4 rounded-3xl p-5 ${glass}`}>
          <h2 className="font-display text-xl font-bold">Par activité</h2>
          <ul className="space-y-3" onMouseLeave={() => setHoverActivity(null)}>
            {byActivity.map(({ activity, count }) => {
              const meta = ACTIVITY_META[activity]
              const dimmed = hoverActivity !== null && hoverActivity !== activity
              return (
                <li key={activity} className={`transition ${dimmed ? 'opacity-40' : ''}`}>
                  <button
                    type="button"
                    onClick={() => onShowActivity(activity)}
                    onMouseEnter={() => setHoverActivity(activity)}
                    onFocus={() => setHoverActivity(activity)}
                    className="w-full space-y-1.5 py-0.5 text-left"
                    title={`${meta.label} : ${count} moment${count > 1 ? 's' : ''} (${Math.round((count / meetings.length) * 100)} %) — voir dans la timeline`}
                  >
                    <span className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        <span aria-hidden>{meta.emoji}</span>
                        {meta.label}
                      </span>
                      <span className="tabular-nums text-white/70">
                        {count}
                        <span className="ml-1.5 text-xs text-white/40">{Math.round((count / meetings.length) * 100)} %</span>
                      </span>
                    </span>
                    <span className="block h-2 rounded-full bg-white/[0.05]">
                      <span className="block h-2 rounded-[4px]" style={{ width: `${(count / max) * 100}%`, background: meta.color }} />
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <section className={`animate-rise space-y-4 rounded-3xl p-5 ${glass}`}>
          <h2 className="font-display text-xl font-bold">Pas vus depuis longtemps</h2>
          <ul className="space-y-1">
            {notSeen.map(({ friend, daysSince }) => {
              const fresh = freshness(daysSince)
              return (
                <li key={friend.id}>
                  <button
                    type="button"
                    onClick={() => onShowFriend(friend.id)}
                    className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-white/[0.06]"
                  >
                    <Avatar friend={friend} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{friend.name}</span>
                      <span className="block text-xs text-white/50">
                        <span aria-hidden>{fresh.icon}</span> {fresh.label}
                      </span>
                    </span>
                    <span className="text-sm font-medium text-white/70">{relativeDays(daysSince!)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    </div>
  )
}
