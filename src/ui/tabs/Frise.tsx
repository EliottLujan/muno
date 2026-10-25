import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
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
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

function buildPath(points: { x: number; y: number }[]): string {
  return points.reduce((d, p, i) => {
    if (i === 0) return `M${p.x},${p.y}`
    const prev = points[i - 1]
    const dx = (p.x - prev.x) / 2
    return `${d} C${prev.x + dx},${prev.y} ${p.x - dx},${p.y} ${p.x},${p.y}`
  }, '')
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

/** Own state so the month ticker can change without re-rendering the whole frise. */
function MonthTicker({ register }: { register: (set: (key: string) => void) => void }) {
  const [key, setKey] = useState('')
  useLayoutEffect(() => {
    register(setKey)
  }, [register])
  const date = key ? parseDay(`${key}-01`) : null
  return (
    <div className="pointer-events-none flex h-12 items-center justify-center overflow-hidden md:h-16" aria-live="polite">
      {date && (
        <span key={key} className="frise-ticker flex items-baseline gap-2.5 whitespace-nowrap">
          <span className="font-display text-[34px] font-extrabold capitalize leading-none tracking-tight md:text-[54px]">
            {date.toLocaleDateString('fr-FR', { month: 'long' })}
          </span>
          <span className="text-gradient font-display text-2xl font-extrabold leading-none md:text-4xl">{date.getFullYear()}</span>
        </span>
      )}
    </div>
  )
}

export function Frise({ meetings, friends, onOpen }: { meetings: Meeting[]; friends: Friend[]; onOpen: (m: Meeting) => void }) {
  const scroller = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const miniWindow = useRef<HTMLDivElement>(null)
  const entries = useRef<(HTMLDivElement | null)[]>([])
  const setMonth = useRef<(key: string) => void>(() => {})
  const engine = useRef({ target: 0, raf: 0, running: false })
  const interacted = useRef(false)
  const hinted = useRef(false)
  const [zoom, setZoom] = useState(1)
  const zoomRef = useRef(1)
  const keep = useRef<{ ratio: number; atEnd: boolean } | null>(null)
  const drag = useRef<{ x: number; left: number; moved: boolean; lastX: number; lastT: number; v: number } | null>(null)
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  const byId = useMemo(() => new Map(friends.map((f) => [f.id, f])), [friends])
  const layout = useMemo(() => layoutFrise(meetings, { pad: PAD }), [meetings])
  const signature = layout.nodes.map((n) => n.meeting.id).join()
  const d = useMemo(
    () => buildPath([{ x: 0, y: MID }, ...layout.nodes.map((n, i) => ({ x: n.x, y: nodeY(n, i) })), { x: layout.width, y: MID }]),
    [layout],
  )
  const years = useMemo(
    () => layout.nodes.filter((n, i) => i === 0 || n.meeting.date.slice(0, 4) !== layout.nodes[i - 1].meeting.date.slice(0, 4)),
    [layout],
  )
  const now = new Date()

  const stopEngine = () => {
    cancelAnimationFrame(engine.current.raf)
    engine.current.running = false
  }

  const scrollTo = (target: number, instant = false) => {
    const el = scroller.current
    if (!el) return
    const e = engine.current
    e.target = clamp(target, 0, el.scrollWidth - el.clientWidth)
    if (reduced || instant) {
      stopEngine()
      el.scrollLeft = e.target
      return
    }
    if (e.running) return
    e.running = true
    const step = () => {
      const cur = el.scrollLeft
      const diff = e.target - cur
      if (Math.abs(diff) < 1) {
        el.scrollLeft = e.target
        e.running = false
        return
      }
      el.scrollLeft = cur + Math.sign(diff) * Math.max(1, Math.abs(diff) * 0.11)
      if (el.scrollLeft === cur) {
        e.running = false
        return
      }
      e.raf = requestAnimationFrame(step)
    }
    e.raf = requestAnimationFrame(step)
  }

  const base = () => (engine.current.running ? engine.current.target : (scroller.current?.scrollLeft ?? 0))

  useLayoutEffect(() => {
    const el = scroller.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [signature])

  // Fit the frise to the available height: the page itself never scrolls vertically.
  useLayoutEffect(() => {
    const el = scroller.current
    if (!el) return
    const measure = () => {
      const next = Math.round(clamp(el.clientHeight / H, 0.5, 1.35) * 100) / 100
      if (next === zoomRef.current) return
      const max = el.scrollWidth - el.clientWidth
      keep.current = { ratio: (el.scrollLeft + el.clientWidth / 2) / Math.max(1, el.scrollWidth), atEnd: el.scrollLeft >= max - 2 }
      zoomRef.current = next
      setZoom(next)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useLayoutEffect(() => {
    const el = scroller.current
    const k = keep.current
    if (!el || !k) return
    keep.current = null
    stopEngine()
    el.scrollLeft = k.atEnd ? el.scrollWidth : k.ratio * el.scrollWidth - el.clientWidth / 2
  }, [zoom])

  useEffect(() => {
    const el = scroller.current
    const box = inner.current
    if (!el || !box) return

    const observer = new IntersectionObserver(
      (list) =>
        list.forEach((e) => {
          if (!e.isIntersecting) return
          e.target.parentElement?.setAttribute('data-in', '')
          observer.unobserve(e.target)
        }),
      { root: el, rootMargin: '0px 2% 0px 2%', threshold: 0.1 },
    )
    el.querySelectorAll('.frise-slot').forEach((n) => observer.observe(n))

    const lastP = new Float32Array(layout.nodes.length).fill(NaN)
    let active = -1
    let month = ''
    const apply = (left: number, v: number) => {
      const w = el.clientWidth / zoom
      const center = left / zoom + w / 2
      const half = w / 2 + 80
      box.style.setProperty('--v', clamp(v / 2.5, -1, 1).toFixed(3))
      box.style.setProperty('--av', Math.min(1, Math.abs(v) / 2.5).toFixed(3))
      box.style.setProperty('--sx', (left / zoom).toFixed(1))
      box.style.setProperty('--cw', w.toFixed(1))

      let best = -1
      let bestDist = Infinity
      layout.nodes.forEach((n, i) => {
        const dist = n.x - center
        if (Math.abs(dist) < bestDist) [best, bestDist] = [i, Math.abs(dist)]
        const p = Math.round(clamp(dist / half, -1.4, 1.4) * 200) / 200
        if (p === lastP[i]) return
        lastP[i] = p
        const node = entries.current[i]
        node?.style.setProperty('--p', String(p))
        node?.style.setProperty('--ap', String(Math.abs(p)))
      })
      const nextActive = bestDist < 140 ? best : -1
      if (nextActive !== active) {
        if (active >= 0) entries.current[active]?.removeAttribute('data-active')
        if (nextActive >= 0) entries.current[nextActive]?.setAttribute('data-active', '')
        active = nextActive
      }
      const nextMonth = best >= 0 ? layout.nodes[best].meeting.date.slice(0, 7) : ''
      if (nextMonth !== month) setMonth.current((month = nextMonth))

      const win = miniWindow.current
      if (win && el.scrollWidth > 0) {
        win.style.left = `${(left / el.scrollWidth) * 100}%`
        win.style.width = `${(w / el.scrollWidth) * 100}%`
      }
    }

    const fx = { raf: 0, last: el.scrollLeft, lastT: 0, v: 0, idle: 0 }
    const frame = (t: number) => {
      const left = el.scrollLeft
      const inst = (left - fx.last) / Math.max(1, t - fx.lastT)
      fx.v += (inst - fx.v) * 0.18
      fx.idle = left === fx.last ? fx.idle + 1 : 0
      fx.last = left
      fx.lastT = t
      if (fx.idle > 2 && Math.abs(fx.v) < 0.01) fx.v = 0
      apply(left, fx.v)
      fx.raf = fx.v === 0 && fx.idle > 2 ? 0 : requestAnimationFrame(frame)
    }
    const kick = () => {
      if (fx.raf) return
      fx.last = el.scrollLeft
      fx.lastT = performance.now()
      fx.raf = requestAnimationFrame(frame)
    }
    apply(el.scrollLeft, 0)
    el.addEventListener('scroll', kick, { passive: true })
    const onResize = () => apply(el.scrollLeft, 0)
    window.addEventListener('resize', onResize)

    const wheel = (e: WheelEvent) => {
      interacted.current = true
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return stopEngine()
      const unit = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? el.clientWidth : 1
      e.preventDefault()
      scrollTo(base() - e.deltaY * unit * 1.3)
    }
    el.addEventListener('wheel', wheel, { passive: false })

    const hints =
      interacted.current || reduced || hinted.current
        ? []
        : [
          window.setTimeout(() => !interacted.current && scrollTo(el.scrollWidth - el.clientWidth - 220), 1400),
          window.setTimeout(() => !interacted.current && scrollTo(el.scrollWidth), 2100),
        ]
    hinted.current = true

    return () => {
      observer.disconnect()
      cancelAnimationFrame(fx.raf)
      stopEngine()
      hints.forEach(clearTimeout)
      el.removeEventListener('scroll', kick)
      el.removeEventListener('wheel', wheel)
      window.removeEventListener('resize', onResize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, layout, zoom])

  const page = (dir: -1 | 1) => {
    interacted.current = true
    const el = scroller.current
    if (el) scrollTo(base() + dir * el.clientWidth * 0.8)
  }

  const fromMini = (clientX: number, instant: boolean) => {
    const el = scroller.current
    const bar = miniWindow.current?.parentElement
    if (!el || !bar) return
    const r = bar.getBoundingClientRect()
    scrollTo(((clientX - r.left) / r.width) * el.scrollWidth - el.clientWidth / 2, instant)
  }

  const cometDur = Math.max(8, layout.width / 260)
  const registerMonth = useCallback((set: (key: string) => void) => {
    setMonth.current = set
  }, [])
  const roundBtn = `flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/70 transition hover:scale-110 hover:text-white active:scale-95 ${glass}`

  return (
    <div className="flex h-full flex-col">
      <MonthTicker register={registerMonth} />

      <div
        ref={scroller}
        tabIndex={0}
        aria-label="Frise chronologique, flèches gauche et droite pour naviguer"
        className="frise-scroller no-scrollbar flex min-h-0 flex-1 cursor-grab items-center overflow-x-auto overflow-y-hidden outline-none active:cursor-grabbing"
        onKeyDown={(e) => {
          const el = e.currentTarget
          const moves: Record<string, number> = { ArrowLeft: -320, ArrowRight: 320, PageUp: -el.clientWidth, PageDown: el.clientWidth }
          if (e.key === 'Home') scrollTo(0)
          else if (e.key === 'End') scrollTo(Infinity)
          else if (e.key in moves) scrollTo(base() + moves[e.key])
          else return
          interacted.current = true
          e.preventDefault()
        }}
        onPointerDown={(e) => {
          interacted.current = true
          stopEngine()
          if (e.pointerType !== 'mouse') return
          drag.current = { x: e.clientX, left: e.currentTarget.scrollLeft, moved: false, lastX: e.clientX, lastT: e.timeStamp, v: 0 }
        }}
        onPointerMove={(e) => {
          const s = drag.current
          if (!s) return
          const dx = e.clientX - s.x
          if (Math.abs(dx) > 5) s.moved = true
          const dt = Math.max(1, e.timeStamp - s.lastT)
          s.v = s.v * 0.6 + ((e.clientX - s.lastX) / dt) * 0.4
          s.lastX = e.clientX
          s.lastT = e.timeStamp
          e.currentTarget.scrollLeft = s.left - dx
        }}
        onPointerUp={(e) => {
          const s = drag.current
          if (s?.moved && e.timeStamp - s.lastT < 80) scrollTo(e.currentTarget.scrollLeft - s.v * 320)
          setTimeout(() => (drag.current = null))
        }}
        onPointerLeave={() => (drag.current = null)}
        onClickCapture={(e) => {
          if (drag.current?.moved) {
            e.stopPropagation()
            e.preventDefault()
          }
        }}
      >
        <div key={signature} ref={inner} className="relative shrink-0 select-none" style={{ width: layout.width, height: H, zoom }}>
          {years.map((n) => (
            <span
              key={n.meeting.id}
              aria-hidden
              className="frise-year pointer-events-none absolute font-display font-extrabold leading-none text-white/[0.045]"
              style={{ left: n.x - 40, top: MID - 90, '--x': n.x } as CSSProperties}
            >
              {n.meeting.date.slice(0, 4)}
            </span>
          ))}

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
            <path d={d} pathLength={1} fill="none" stroke="url(#frise-grad)" strokeOpacity="0.55" filter="url(#frise-glow)" className="frise-draw frise-glow" />
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
              [0, 0.25, 0.5, 0.75].map((offset) => (
                <g key={offset}>
                  <circle r="14" fill="url(#frise-comet)" opacity="0.7" className="frise-comet-halo" />
                  <circle r="3.5" fill="#fff" />
                  <animateMotion dur={`${cometDur}s`} begin={`-${offset * cometDur}s`} repeatCount="indefinite" path={d} keyPoints="1;0" keyTimes="0;1" calcMode="linear" />
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
                ref={(el) => {
                  entries.current[i] = el
                }}
                data-up={n.up ? '' : undefined}
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
                  <div className="frise-tilt">
                    <FriseCard
                      meeting={n.meeting}
                      friends={n.meeting.friendIds.map((id) => byId.get(id)).filter((f): f is Friend => !!f)}
                      onOpen={() => onOpen(n.meeting)}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-3xl items-center gap-2 px-3">
        <button type="button" aria-label="Plus ancien" onClick={() => page(-1)} className={roundBtn}>
          <ChevronLeft size={18} />
        </button>
      <div
        className="relative h-10 min-w-0 flex-1 cursor-pointer touch-none"
        role="presentation"
        onPointerDown={(e) => {
          interacted.current = true
          e.currentTarget.setPointerCapture(e.pointerId)
          fromMini(e.clientX, false)
        }}
        onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && fromMini(e.clientX, true)}
      >
        <span className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-fuchsia-500/30 via-white/15 to-orange-400/30" />
        {layout.nodes.map((n, i) => (
          <span
            key={n.meeting.id}
            className="absolute h-1.5 w-1.5 -translate-x-1/2 rounded-full"
            style={{ left: `${(n.x / layout.width) * 100}%`, top: `calc(50% ${n.up ? '-' : '+'} ${AMPS[i % AMPS.length] / 8}px - 3px)`, background: ACTIVITY_META[n.meeting.activity].color }}
          />
        ))}
        {years.map((n) => (
          <span key={n.meeting.id} className="absolute bottom-0 -translate-x-1/2 text-[9px] font-bold text-white/35" style={{ left: `${(n.x / layout.width) * 100}%` }}>
            {n.meeting.date.slice(0, 4)}
          </span>
        ))}
        <div ref={miniWindow} className="frise-mini-window absolute inset-y-0 rounded-xl bg-white/[0.07] ring-1 ring-white/40 backdrop-blur-[1px]" />
      </div>
        <button type="button" aria-label="Plus récent" onClick={() => page(1)} className={roundBtn}>
          <ChevronRight size={18} />
        </button>
        <button
          type="button"
          aria-label="Revenir à maintenant"
          onClick={() => {
            interacted.current = true
            scrollTo(Infinity)
          }}
          className={`flex h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-xs font-bold uppercase tracking-widest text-white/80 transition hover:text-white active:scale-95 ${glass}`}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-fuchsia-400" />
            <span className="relative h-2 w-2 rounded-full bg-fuchsia-400" />
          </span>
          <span className="hidden sm:inline">Maintenant</span>
        </button>
      </div>
    </div>
  )
}
