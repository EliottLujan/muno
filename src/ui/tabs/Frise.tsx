import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import { daysBetween, parseDay, relativeDays } from '../../domain/dates'
import { layoutFrise, type FriseNode } from '../../domain/frise'
import { ACTIVITY_META, type Friend, type Meeting } from '../../domain/types'
import { ActivityTile, AvatarStack, glass } from '../components'

const RULER = 36
const CARD = 184
const STEM = 16
const NODE = 48
const AMPS = [22, 34, 28, 40]
const MAX_AMP = Math.max(...AMPS)
const MID = RULER + CARD + STEM + NODE / 2 + MAX_AMP
const H = MID * 2 - RULER + 12
const CARD_W = 260
const PAD = 180

const nodeY = (n: FriseNode, i: number) => MID + (n.up ? -1 : 1) * AMPS[i % AMPS.length]

function buildPath(points: { x: number; y: number }[]): string {
  return points.reduce((d, p, i) => {
    if (i === 0) return `M${p.x},${p.y}`
    const prev = points[i - 1]
    const dx = (p.x - prev.x) / 2
    return `${d} C${prev.x + dx},${prev.y} ${p.x - dx},${p.y} ${p.x},${p.y}`
  }, '')
}

function useReducedMotion() {
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  return reduced
}

function FriseCard({ meeting, friends, onOpen }: { meeting: Meeting; friends: Friend[]; onOpen: () => void }) {
  const meta = ACTIVITY_META[meeting.activity]
  const names = friends.map((f) => f.name)
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`frise-card group relative flex w-full flex-col gap-2 overflow-hidden rounded-[26px] p-3.5 text-left hover:bg-white/[0.08] ${glass}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-25 blur-2xl transition group-hover:opacity-45"
        style={{ background: meta.color }}
      />
      <span className="relative flex items-center gap-3">
        <ActivityTile activity={meeting.activity} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-[17px] font-bold leading-tight">
            {names.length > 2 ? `${names.slice(0, 2).join(', ')} +${names.length - 2}` : names.join(' & ')}
          </span>
          <span className="block text-xs font-medium text-white/45">{relativeDays(daysBetween(meeting.date, new Date()))}</span>
        </span>
      </span>
      <span className="relative flex items-center gap-1.5 text-[13px] text-white/60">
        <MapPin size={13} className="shrink-0" />
        <span className="truncate">{meeting.place.label}</span>
      </span>
      {meeting.note && <span className="relative line-clamp-2 border-l-2 border-white/15 pl-2.5 text-[13px] italic text-white/75">{meeting.note}</span>}
      <span className="relative flex items-center justify-between">
        <AvatarStack friends={friends} max={3} />
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: meta.color }}>
          {meta.emoji} {meta.label}
        </span>
      </span>
    </button>
  )
}

export function Frise({ meetings, friends, onOpen }: { meetings: Meeting[]; friends: Friend[]; onOpen: (m: Meeting) => void }) {
  const scroller = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null)
  const reduced = useReducedMotion()
  const [active, setActive] = useState(-1)

  const byId = useMemo(() => new Map(friends.map((f) => [f.id, f])), [friends])
  const layout = useMemo(() => layoutFrise(meetings, { pad: PAD }), [meetings])
  const signature = layout.nodes.map((n) => n.meeting.id).join()
  const points = layout.nodes.map((n, i) => ({ x: n.x, y: nodeY(n, i) }))
  const d = buildPath([{ x: 0, y: MID }, ...points, { x: layout.width, y: MID }])
  const now = new Date()

  useLayoutEffect(() => {
    const el = scroller.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [signature])

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          e.target.parentElement?.setAttribute('data-in', '')
          observer.unobserve(e.target)
        }),
      { root: el, rootMargin: '0px -6% 0px -6%', threshold: 0.15 },
    )
    el.querySelectorAll('.frise-slot').forEach((n) => observer.observe(n))

    let frame = 0
    const track = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const center = el.scrollLeft + el.clientWidth / 2
        let best = -1
        let bestDist = Infinity
        layout.nodes.forEach((n, i) => {
          const dist = Math.abs(n.x - center)
          if (dist < bestDist) [best, bestDist] = [i, dist]
        })
        setActive(bestDist < 140 ? best : -1)
      })
    }
    track()
    el.addEventListener('scroll', track, { passive: true })

    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      const atStart = el.scrollLeft <= 0 && e.deltaY < 0
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 && e.deltaY > 0
      if (atStart || atEnd) return
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }
    el.addEventListener('wheel', wheel, { passive: false })

    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
      el.removeEventListener('scroll', track)
      el.removeEventListener('wheel', wheel)
    }
  }, [signature, layout])

  const scrollByPage = (dir: -1 | 1) => {
    const el = scroller.current
    el?.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: reduced ? 'auto' : 'smooth' })
  }
  const toNow = () => {
    const el = scroller.current
    el?.scrollTo({ left: el.scrollWidth, behavior: reduced ? 'auto' : 'smooth' })
  }

  const cometDur = `${Math.max(8, layout.width / 260)}s`

  return (
    <div className="relative -mx-4 md:mx-0">
      <div className="mb-1 flex items-center justify-end gap-2 px-4 md:px-0">
        <button type="button" aria-label="Plus ancien" onClick={() => scrollByPage(-1)} className={`flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:text-white ${glass}`}>
          <ChevronLeft size={18} />
        </button>
        <button type="button" onClick={toNow} className={`flex h-9 items-center gap-2 rounded-full px-3.5 text-xs font-bold uppercase tracking-widest text-white/80 hover:text-white ${glass}`}>
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-fuchsia-400" />
            <span className="relative h-2 w-2 rounded-full bg-fuchsia-400" />
          </span>
          Maintenant
        </button>
        <button type="button" aria-label="Plus récent" onClick={() => scrollByPage(1)} className={`flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:text-white ${glass}`}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div
        ref={scroller}
        className="frise-scroller no-scrollbar cursor-grab overflow-x-auto overflow-y-hidden active:cursor-grabbing"
        onPointerDown={(e) => {
          if (e.pointerType !== 'mouse') return
          drag.current = { x: e.clientX, left: e.currentTarget.scrollLeft, moved: false }
        }}
        onPointerMove={(e) => {
          const s = drag.current
          if (!s) return
          const dx = e.clientX - s.x
          if (Math.abs(dx) > 5) s.moved = true
          e.currentTarget.scrollLeft = s.left - dx
        }}
        onPointerUp={() => setTimeout(() => (drag.current = null))}
        onPointerLeave={() => (drag.current = null)}
        onClickCapture={(e) => {
          if (drag.current?.moved) {
            e.stopPropagation()
            e.preventDefault()
          }
        }}
      >
        <div key={signature} className="relative select-none" style={{ width: layout.width, height: H }}>
          <svg className="absolute inset-0" width={layout.width} height={H} aria-hidden>
            <defs>
              <linearGradient id="frise-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={layout.width} y2="0">
                <stop offset="0" stopColor="#c026d3" />
                {layout.nodes.map((n) => (
                  <stop key={n.meeting.id} offset={n.x / layout.width} stopColor={ACTIVITY_META[n.meeting.activity].color} />
                ))}
                <stop offset="1" stopColor="#f97316" />
              </linearGradient>
              <filter id="frise-glow" x="-10%" y="-50%" width="120%" height="200%">
                <feGaussianBlur stdDeviation="8" />
              </filter>
              <radialGradient id="frise-comet">
                <stop offset="0" stopColor="#fff" />
                <stop offset="0.35" stopColor="#f0abfc" />
                <stop offset="1" stopColor="#f0abfc" stopOpacity="0" />
              </radialGradient>
            </defs>

            {layout.months.map((m) => (
              <line key={m.key} x1={m.x} x2={m.x} y1={RULER} y2={H - 8} stroke="white" strokeOpacity="0.07" strokeDasharray="2 6" />
            ))}

            <path d={d} fill="none" stroke="white" strokeOpacity="0.08" strokeWidth="10" strokeLinecap="round" />
            <path d={d} fill="none" stroke="white" strokeOpacity="0.25" strokeWidth="2" strokeDasharray="1 11" strokeLinecap="round" className="frise-flow" />
            <path d={d} pathLength={1} fill="none" stroke="url(#frise-grad)" strokeWidth="12" strokeOpacity="0.55" filter="url(#frise-glow)" className="frise-draw" />
            <path d={d} pathLength={1} fill="none" stroke="url(#frise-grad)" strokeWidth="4" strokeLinecap="round" className="frise-draw" />

            {layout.nodes.map((n, i) => {
              const y = nodeY(n, i)
              const dir = n.up ? -1 : 1
              return (
                <line
                  key={n.meeting.id}
                  x1={n.x}
                  x2={n.x}
                  y1={y + (dir * NODE) / 2}
                  y2={y + dir * (NODE / 2 + STEM)}
                  stroke={ACTIVITY_META[n.meeting.activity].color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="2 4"
                />
              )
            })}

            {!reduced &&
              [0, 0.33, 0.66].map((offset) => (
                <g key={offset}>
                  <circle r="14" fill="url(#frise-comet)" opacity="0.7" className="frise-comet-halo" />
                  <circle r="3.5" fill="#fff" />
                  <animateMotion
                    dur={cometDur}
                    begin={`-${offset * parseFloat(cometDur)}s`}
                    repeatCount="indefinite"
                    path={d}
                    keyPoints="1;0"
                    keyTimes="0;1"
                    calcMode="linear"
                  />
                </g>
              ))}
          </svg>

          {layout.months.map((m) => {
            const date = parseDay(`${m.key}-01`)
            return (
              <div key={m.key} className="absolute top-0 flex items-baseline gap-1.5 whitespace-nowrap pl-2.5" style={{ left: m.x }}>
                <span className="font-display text-lg font-extrabold capitalize leading-none">{date.toLocaleDateString('fr-FR', { month: 'long' })}</span>
                <span className="font-display text-sm font-bold text-white/30">{date.getFullYear()}</span>
              </div>
            )
          })}

          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-fuchsia-600/40 to-violet-600/40 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white/85 ring-1 ring-white/15 backdrop-blur-xl"
            style={{ left: 72, top: MID }}
          >
            ✨ Le début
          </div>
          <div
            className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-gradient-to-r from-violet-600/50 to-orange-500/50 px-3 py-1 text-[11px] font-bold uppercase tracking-widest ring-1 ring-white/20 backdrop-blur-xl"
            style={{ left: layout.width - 72, top: MID }}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-orange-300" />
              <span className="relative h-2 w-2 rounded-full bg-orange-300" />
            </span>
            Maintenant
          </div>

          {layout.nodes.map((n, i) => {
            const y = nodeY(n, i)
            const meta = ACTIVITY_META[n.meeting.activity]
            const date = parseDay(n.meeting.date)
            const ago = daysBetween(n.meeting.date, now)
            const edge = NODE / 2 + STEM
            return (
              <div
                key={n.meeting.id}
                data-up={n.up ? '' : undefined}
                data-active={i === active ? '' : undefined}
                className="frise-entry"
                style={{ '--frise-delay': `${(i % 4) * 70}ms` } as CSSProperties}
              >
                <span
                  className="frise-node absolute flex h-12 w-12 flex-col items-center justify-center rounded-full bg-night"
                  style={{ left: n.x - NODE / 2, top: y - NODE / 2, boxShadow: `0 0 0 2px ${meta.color}, 0 0 28px -2px ${meta.color}` }}
                >
                  {ago <= 7 && <span className="absolute inset-0 animate-ping rounded-full opacity-40" style={{ background: meta.color }} />}
                  <span className="relative font-display text-lg font-extrabold leading-none">{date.getDate()}</span>
                  <span className="relative text-[9px] font-bold uppercase tracking-wider text-white/50">
                    {date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}
                  </span>
                </span>
                <div
                  className="frise-slot absolute"
                  style={{ left: n.x - CARD_W / 2, width: CARD_W, maxHeight: CARD, ...(n.up ? { bottom: H - (y - edge) } : { top: y + edge }) }}
                >
                  <FriseCard
                    meeting={n.meeting}
                    friends={n.meeting.friendIds.map((id) => byId.get(id)).filter((f): f is Friend => !!f)}
                    onOpen={() => onOpen(n.meeting)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
