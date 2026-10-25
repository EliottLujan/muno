import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Minus, Plus, Scan, X } from 'lucide-react'
import { formatDay } from '../../domain/dates'
import { boundsOf, clusterGroups, groupByPlace, project, type Point } from '../../domain/geo'
import { ACTIVITY_META, type Friend, type Meeting } from '../../domain/types'
import { Avatar, AvatarStack, glass } from '../components'
import { CITIES, GRATICULE, LAND, PARKS, PERIPH, RIVER_PATHS } from './fakeMapShapes'

type View = { cx: number; cy: number; s: number }

const MIN_S = 0.2
const MAX_S = 1500
const FRANCE_CENTER = project(46.6, 2.4)
const FRANCE_VIEW: View = { cx: FRANCE_CENTER.x, cy: FRANCE_CENTER.y, s: 0.35 }
/** Screen box (px) a photo preview needs above its pin; previews that would collide are skipped. */
const PREVIEW_W = 92
const PREVIEW_H = 120
const MAX_PREVIEWS = 10
const SCALES_KM = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500]

const clampS = (s: number) => Math.min(MAX_S, Math.max(MIN_S, s))

function fit(points: Point[], w: number, h: number, maxS: number, pad = 70): View {
  const b = boundsOf(points)
  const s = Math.min((w - pad * 2) / Math.max(b.maxX - b.minX, 1e-6), (h - pad * 2) / Math.max(b.maxY - b.minY, 1e-6))
  return { cx: (b.minX + b.maxX) / 2, cy: (b.minY + b.maxY) / 2, s: clampS(Math.min(s, maxS)) }
}

function zoomAt(v: View, factor: number, px: number, py: number, w: number, h: number): View {
  const s = clampS(v.s * factor)
  const wx = v.cx + (px - w / 2) / v.s
  const wy = v.cy + (py - h / 2) / v.s
  return { s, cx: wx - (px - w / 2) / s, cy: wy - (py - h / 2) / s }
}

export function FakeMap({ meetings, friends, onOpen }: { meetings: Meeting[]; friends: Friend[]; onOpen: (m: Meeting) => void }) {
  const box = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [view, setView] = useState<View>(FRANCE_VIEW)
  const [selected, setSelected] = useState<string | null>(null)
  const viewRef = useRef(view)
  const sizeRef = useRef(size)
  const anim = useRef(0)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const moved = useRef(false)
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  viewRef.current = view
  sizeRef.current = size

  const byId = useMemo(() => new Map(friends.map((f) => [f.id, f])), [friends])
  const groups = useMemo(() => groupByPlace(meetings), [meetings])
  const clusters = useMemo(() => clusterGroups(groups, 34 / view.s), [groups, view.s])
  const previews = useMemo(() => {
    const candidates = clusters
      .filter((c) => c.groups.length === 1)
      .flatMap((c) => {
        const shot = [...c.groups[0].meetings].sort((a, b) => b.date.localeCompare(a.date)).find((m) => m.photos?.length)
        return shot ? [{ c, shot }] : []
      })
      .sort((a, b) => b.shot.date.localeCompare(a.shot.date))
    const picked = new Map<string, Meeting>()
    const taken: Point[] = []
    for (const { c, shot } of candidates) {
      if (picked.size >= MAX_PREVIEWS) break
      if (taken.some((p) => Math.abs(p.x - c.x) * view.s < PREVIEW_W && Math.abs(p.y - c.y) * view.s < PREVIEW_H)) continue
      taken.push(c)
      picked.set(c.key, shot)
    }
    return picked
  }, [clusters, view.s])
  const signature = groups.map((g) => g.key).join('|')
  const selectedGroup = groups.find((g) => g.key === selected)

  const apply = (v: View) => {
    viewRef.current = v
    setView(v)
  }

  const animateTo = (target: View) => {
    cancelAnimationFrame(anim.current)
    if (reduced) return apply(target)
    const from = viewRef.current
    const start = performance.now()
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 700)
      const e = 1 - (1 - t) ** 3
      apply({
        cx: from.cx + (target.cx - from.cx) * e,
        cy: from.cy + (target.cy - from.cy) * e,
        s: Math.exp(Math.log(from.s) + (Math.log(target.s) - Math.log(from.s)) * e),
      })
      if (t < 1) anim.current = requestAnimationFrame(step)
    }
    anim.current = requestAnimationFrame(step)
  }

  const fitAll = () => {
    const { w, h } = sizeRef.current
    if (!w || groups.length === 0) return animateTo({ ...FRANCE_VIEW, s: w ? Math.min(w, h) / 1100 : FRANCE_VIEW.s })
    animateTo(fit(groups, w, h, 60))
  }

  useLayoutEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setSize({ w: entry.contentRect.width, h: entry.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (size.w) fitAll()
  }, [signature, size.w > 0])

  useEffect(() => {
    const el = box.current
    if (!el) return
    const wheel = (e: WheelEvent) => {
      e.preventDefault()
      cancelAnimationFrame(anim.current)
      const r = el.getBoundingClientRect()
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018))
      apply(zoomAt(viewRef.current, factor, e.clientX - r.left, e.clientY - r.top, r.width, r.height))
    }
    el.addEventListener('wheel', wheel, { passive: false })
    return () => el.removeEventListener('wheel', wheel)
  }, [])

  useEffect(() => () => cancelAnimationFrame(anim.current), [])

  const onPointerDown = (e: React.PointerEvent) => {
    cancelAnimationFrame(anim.current)
    if (pointers.current.size === 0) moved.current = false
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    const move = (ev: PointerEvent) => {
      const prev = pointers.current.get(ev.pointerId)
      if (!prev) return
      const all = [...pointers.current.values()]
      const before = all.length === 2 ? { a: all[0], b: all[1] } : null
      pointers.current.set(ev.pointerId, { x: ev.clientX, y: ev.clientY })
      const v = viewRef.current
      if (!before) {
        const dx = ev.clientX - prev.x
        const dy = ev.clientY - prev.y
        moved.current ||= Math.hypot(dx, dy) > 2
        apply({ ...v, cx: v.cx - dx / v.s, cy: v.cy - dy / v.s })
        return
      }
      moved.current = true
      const [a, b] = [...pointers.current.values()]
      const r = box.current!.getBoundingClientRect()
      const d0 = Math.hypot(before.a.x - before.b.x, before.a.y - before.b.y)
      const d1 = Math.hypot(a.x - b.x, a.y - b.y)
      const m0 = { x: (before.a.x + before.b.x) / 2, y: (before.a.y + before.b.y) / 2 }
      const m1 = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const zoomed = zoomAt(v, d1 / Math.max(d0, 1), m0.x - r.left, m0.y - r.top, r.width, r.height)
      apply({ ...zoomed, cx: zoomed.cx - (m1.x - m0.x) / zoomed.s, cy: zoomed.cy - (m1.y - m0.y) / zoomed.s })
    }
    const up = (ev: PointerEvent) => {
      pointers.current.delete(ev.pointerId)
      if (pointers.current.size > 0) return
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
    }
    if (pointers.current.size === 1) {
      window.addEventListener('pointermove', move)
      window.addEventListener('pointerup', up)
      window.addEventListener('pointercancel', up)
    }
  }

  const zoomButton = (factor: number) => {
    const { w, h } = sizeRef.current
    animateTo(zoomAt(viewRef.current, factor, w / 2, h / 2, w, h))
  }

  const toScreen = (p: Point) => ({ left: (p.x - view.cx) * view.s + size.w / 2, top: (p.y - view.cy) * view.s + size.h / 2 })
  const vb = `${view.cx - size.w / 2 / view.s} ${view.cy - size.h / 2 / view.s} ${size.w / view.s || 1} ${size.h / view.s || 1}`
  const pxPerKm = view.s / 1.112
  const scaleKm = SCALES_KM.find((km) => km * pxPerKm >= 60) ?? 500
  const detail = view.s > 6

  return (
    <div
      ref={box}
      onPointerDown={onPointerDown}
      onDoubleClick={(e) => {
        if ((e.target as HTMLElement).closest('[data-map-ui]')) return
        const r = e.currentTarget.getBoundingClientRect()
        animateTo(zoomAt(viewRef.current, 2.2, e.clientX - r.left, e.clientY - r.top, r.width, r.height))
      }}
      className="relative h-full min-h-[300px] cursor-grab touch-none select-none overflow-hidden rounded-[28px] ring-1 ring-white/10 active:cursor-grabbing"
      style={{
        background:
          'radial-gradient(120% 90% at 30% 20%, #1a1530 0%, #0d0d18 55%, #08080f 100%), radial-gradient(circle, #ffffff10 1px, transparent 1.2px) 0 0 / 18px 18px',
        backgroundBlendMode: 'screen',
      }}
    >
      <svg className="absolute inset-0 h-full w-full" viewBox={vb} preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#221c36" />
            <stop offset="1" stopColor="#17141f" />
          </linearGradient>
        </defs>
        <path d={GRATICULE} fill="none" stroke="#fff" strokeOpacity="0.04" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        {LAND.map((d) => (
          <g key={d}>
            <path d={d} fill="none" stroke="#c026d3" strokeOpacity="0.18" strokeWidth="14" strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="fakemap-water" />
            <path d={d} fill="url(#land)" stroke="#fff" strokeOpacity="0.22" strokeWidth="1.2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </g>
        ))}
        {detail &&
          PARKS.map((p) => (
            <ellipse key={p.x} cx={p.x} cy={p.y} rx={p.rx} ry={p.ry} fill="#199e70" fillOpacity="0.16" stroke="#199e70" strokeOpacity="0.3" vectorEffect="non-scaling-stroke" />
          ))}
        {RIVER_PATHS.map((d) => (
          <path key={d} d={d} fill="none" stroke="#3987e5" strokeOpacity="0.45" strokeWidth={detail ? 5 : 1.6} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        ))}
        {detail && (
          <ellipse
            cx={PERIPH.cx}
            cy={PERIPH.cy}
            rx={PERIPH.rx}
            ry={PERIPH.ry}
            fill="#ffffff05"
            stroke="#fff"
            strokeOpacity="0.18"
            strokeWidth="3"
            strokeDasharray="10 6"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      {CITIES.filter((c) => (view.s < 25 && (c.big || view.s > 0.7)) || (c.name === 'Paris' && view.s < 60)).map((c) => {
        const pos = toScreen(project(c.lat, c.lng))
        return (
          <span key={c.name} className="pointer-events-none absolute flex -translate-x-1/2 items-center gap-1 text-[11px] font-semibold tracking-wide text-white/35" style={{ ...pos, marginTop: -6 }}>
            <span className="h-1 w-1 rounded-full bg-white/40" />
            {c.name}
          </span>
        )
      })}

      {clusters.map((c) => {
        const pos = toScreen(c)
        if (c.groups.length > 1) {
          const sizePx = 40 + Math.sqrt(c.count) * 6
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => !moved.current && animateTo(fit(c.groups, size.w, size.h, MAX_S, 90))}
              aria-label={`${c.count} moments dans ${c.groups.length} lieux, zoomer`}
              className="fakemap-pin absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-600 via-violet-600 to-orange-500 font-display text-base font-extrabold shadow-[0_0_40px_-4px_#c026d3] ring-4 ring-white/10 transition hover:scale-110"
              style={{ ...pos, width: sizePx, height: sizePx }}
            >
              <span className="absolute inset-0 animate-ping rounded-full bg-fuchsia-500 opacity-20" />
              <span className="relative">{c.count}</span>
            </button>
          )
        }
        const g = c.groups[0]
        const latest = [...g.meetings].sort((a, b) => b.date.localeCompare(a.date))[0]
        const meta = ACTIVITY_META[latest.activity]
        const isSel = selected === g.key
        const preview = previews.get(c.key)
        const faces = preview ? preview.friendIds.map((id) => byId.get(id)).filter((f): f is Friend => !!f) : []
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => {
              if (moved.current) return
              setSelected(g.key)
              animateTo({ cx: g.x, cy: g.y, s: Math.max(viewRef.current.s, 1.2) })
            }}
            aria-label={`${g.label}, ${g.meetings.length} moment${g.meetings.length > 1 ? 's' : ''}`}
            className="fakemap-pin absolute -translate-x-1/2 -translate-y-full transition hover:scale-110"
            style={{ ...pos, zIndex: isSel ? 10 : preview ? 2 : 1 }}
          >
            {preview && (
              <span className="absolute bottom-full left-1/2 mb-2.5 -translate-x-1/2">
                <span className="map-preview relative block" style={{ rotate: `${(preview.id.charCodeAt(preview.id.length - 1) % 3) * 4 - 4}deg` }}>
                  <span className="block h-14 w-16 overflow-hidden rounded-xl bg-night shadow-xl shadow-black/70 ring-2 ring-white/90">
                    <img src={preview.photos![0]} alt="" loading="lazy" decoding="async" draggable={false} className="h-full w-full object-cover" />
                  </span>
                  <span className="absolute -bottom-2.5 left-1/2 flex -translate-x-1/2 -space-x-1.5">
                    {faces.slice(0, 3).map((f) => (
                      <Avatar key={f.id} friend={f} size="xs" className="ring-2 ring-night" />
                    ))}
                  </span>
                </span>
              </span>
            )}
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full rounded-br-none bg-night text-lg transition ${isSel ? 'scale-125' : ''}`}
              style={{ rotate: '45deg', boxShadow: `0 0 0 2.5px ${meta.color}, 0 0 26px -2px ${meta.color}` }}
            >
              <span style={{ rotate: '-45deg' }}>{meta.emoji}</span>
            </span>
            {g.meetings.length > 1 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-night">{g.meetings.length}</span>
            )}
          </button>
        )
      })}

      <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-2">
        <span className={`rounded-full px-3 py-1.5 text-xs font-semibold text-white/80 ${glass}`}>
          {meetings.length} moment{meetings.length > 1 ? 's' : ''} · {groups.length} lieu{groups.length > 1 ? 'x' : ''}
        </span>
        <span className={`rounded-full px-3 py-1.5 text-xs font-medium text-white/45 ${glass}`}>Carte de démo</span>
      </div>

      <div data-map-ui className="absolute right-3 top-3 flex flex-col gap-2" onPointerDown={(e) => e.stopPropagation()}>
        {[
          { label: 'Zoomer', Icon: Plus, onClick: () => zoomButton(2) },
          { label: 'Dézoomer', Icon: Minus, onClick: () => zoomButton(0.5) },
          { label: 'Tout voir', Icon: Scan, onClick: fitAll },
        ].map(({ label, Icon, onClick }) => (
          <button key={label} type="button" aria-label={label} onClick={onClick} className={`flex h-10 w-10 items-center justify-center rounded-2xl text-white/80 hover:text-white ${glass}`}>
            <Icon size={18} />
          </button>
        ))}
      </div>

      <div className="pointer-events-none absolute bottom-3 right-4 flex flex-col items-end gap-1 text-[10px] font-semibold text-white/45">
        <span>{scaleKm < 1 ? `${scaleKm * 1000} m` : `${scaleKm} km`}</span>
        <span className="h-1.5 border-x-2 border-b-2 border-white/40" style={{ width: scaleKm * pxPerKm }} />
      </div>

      {selectedGroup && (
        <div
          data-map-ui
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute inset-x-3 bottom-3 max-h-[55%] animate-sheet overflow-y-auto rounded-3xl bg-surface/90 p-4 ring-1 ring-white/10 backdrop-blur-xl md:right-auto md:w-96"
        >
          <div className="mb-3 flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-lg font-bold leading-tight">{selectedGroup.label}</h3>
              <p className="text-xs text-white/50">
                {selectedGroup.meetings.length} moment{selectedGroup.meetings.length > 1 ? 's' : ''} ici
              </p>
            </div>
            <button type="button" aria-label="Fermer" onClick={() => setSelected(null)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20">
              <X size={16} />
            </button>
          </div>
          <ul className="space-y-1.5">
            {[...selectedGroup.meetings]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((m) => {
                const meta = ACTIVITY_META[m.activity]
                const people = m.friendIds.map((id) => byId.get(id)).filter((f): f is Friend => !!f)
                return (
                  <li key={m.id}>
                    <button type="button" onClick={() => onOpen(m)} className="flex w-full items-center gap-3 rounded-2xl p-2 text-left hover:bg-white/[0.06]">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg" style={{ background: `${meta.color}26`, boxShadow: `inset 0 0 0 1px ${meta.color}66` }}>
                        {meta.emoji}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{people.map((f) => f.name).join(', ')}</span>
                        <span className="block text-xs capitalize text-white/45">{formatDay(m.date)}</span>
                      </span>
                      <AvatarStack friends={people} max={3} />
                    </button>
                  </li>
                )
              })}
          </ul>
        </div>
      )}
    </div>
  )
}
