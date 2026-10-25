import { countByActivity, friendStats, longestNotSeen } from '../../domain/stats'
import { ACTIVITY_META, type Activity as ActivityType } from '../../domain/types'
import { useStore } from '../../store/store'

export function Activity({
  onShowActivity,
  onShowFriend,
}: {
  onShowActivity: (a: ActivityType) => void
  onShowFriend: (friendId: string) => void
}) {
  const { friends, meetings } = useStore()
  const byActivity = countByActivity(meetings)
  const max = Math.max(1, ...byActivity.map((e) => e.count))
  const notSeen = longestNotSeen(friendStats(friends, meetings)).slice(0, 10)

  if (meetings.length === 0) return <p className="py-10 text-center text-slate-500">Pas encore d'activité.</p>

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <h2 className="font-bold">Par activité</h2>
        <ul className="space-y-2">
          {byActivity.map(({ activity, count }) => (
            <li key={activity}>
              <button type="button" onClick={() => onShowActivity(activity)} className="w-full space-y-1 text-left">
                <div className="flex justify-between text-sm">
                  <span>
                    {ACTIVITY_META[activity].emoji} {ACTIVITY_META[activity].label}
                  </span>
                  <span className="font-semibold">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${(count / max) * 100}%` }} />
                </div>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <h2 className="font-bold">Pas vus depuis longtemps</h2>
        <ul className="divide-y divide-slate-100">
          {notSeen.map(({ friend, daysSince }) => (
            <li key={friend.id}>
              <button type="button" onClick={() => onShowFriend(friend.id)} className="flex w-full justify-between py-2 text-left text-sm">
                <span className="font-medium">{friend.name}</span>
                <span className={daysSince! > 90 ? 'font-semibold text-rose-600' : 'text-slate-500'}>
                  {daysSince === 0 ? "aujourd'hui" : `${daysSince} j`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
