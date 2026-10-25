import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

type Geo = { key: string; width: number; height: number; d: string; stops: { offset: number; color: string }[] }

const START_COLOR = '#c026d3'
const END_COLOR = '#ea580c'
const r = (n: number) => Math.round(n * 10) / 10

// Winding path: S-swoops between cards, gently bulging runs along each card's gutter.
function measure(root: HTMLElement): Geo | null {
  const box = root.getBoundingClientRect()
  const rel = (el: Element) => {
    const b = el.getBoundingClientRect()
    return { x: b.left - box.left + b.width / 2, top: b.top - box.top, bottom: b.bottom - box.top, cy: b.top - box.top + b.height / 2 }
  }
  const startEl = root.querySelector('[data-trail-start]')
  const endEl = root.querySelector('[data-trail-end]')
  const entries = [...root.querySelectorAll<HTMLElement>('[data-trail-entry]')]
  if (!startEl || !endEl || entries.length === 0) return null

  const start = rel(startEl)
  const end = rel(endEl)
  let px = start.x
  let py = start.bottom
  let d = `M ${r(px)} ${r(py)}`
  const stops = [{ offset: py, color: START_COLOR }]
  const swoop = (x: number, y: number) => {
    const c = (y - py) / 2
    d += ` C ${r(px)} ${r(py + c)} ${r(x)} ${r(y - c)} ${r(x)} ${r(y)}`
  }

  for (const li of entries) {
    const nodeEl = li.querySelector('[data-trail-node]')
    if (!nodeEl) continue
    const node = rel(nodeEl)
    const card = rel(li)
    swoop(node.x, card.top)
    const h = card.bottom - card.top
    const bulge = node.x < box.width / 2 ? -7 : 7
    d += ` C ${r(node.x + bulge)} ${r(card.top + h / 3)} ${r(node.x + bulge)} ${r(card.top + (2 * h) / 3)} ${r(node.x)} ${r(card.bottom)}`
    stops.push({ offset: node.cy, color: li.dataset.trailColor ?? START_COLOR })
    px = node.x
    py = card.bottom
  }
  swoop(end.x, end.top)
  stops.push({ offset: end.top, color: END_COLOR })

  const height = box.height
  const normalized = stops.map((s) => ({ offset: Math.min(1, Math.max(0, s.offset / height)), color: s.color }))
  return { key: d + JSON.stringify(normalized), width: box.width, height, d, stops: normalized }
}

export function Trail({ signature, children }: { signature: string; children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const glowRef = useRef<SVGPathElement>(null)
  const cometRef = useRef<SVGGElement>(null)
  const drawn = useRef(0)
  const [geo, setGeo] = useState<Geo | null>(null)

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const update = () => setGeo((prev) => {
      const next = measure(root)
      return prev && next && prev.key === next.key ? prev : next
    })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(root)
    return () => ro.disconnect()
  }, [signature])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const io = new IntersectionObserver(
      (items) => {
        items
          .filter((it) => it.isIntersecting)
          .forEach((it, k) => {
            const el = it.target as HTMLElement
            el.style.setProperty('--trail-delay', `${Math.min(k, 5) * 70}ms`)
            el.dataset.trailIn = ''
            setTimeout(() => el.style.removeProperty('--trail-delay'), 1200)
            io.unobserve(el)
          })
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    )
    root.querySelectorAll('[data-trail-entry]:not([data-trail-in])').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [signature])

  useEffect(() => {
    const svg = svgRef.current
    const path = pathRef.current
    const glow = glowRef.current
    const comet = cometRef.current
    if (!geo || !svg || !path || !glow || !comet) return
    const total = path.getTotalLength()
    for (const p of [path, glow]) p.style.strokeDasharray = `${total} ${total}`
    let current = Math.min(drawn.current, total)
    let raf = 0

    const render = () => {
      drawn.current = current
      for (const p of [path, glow]) p.style.strokeDashoffset = `${total - current}`
      const pt = path.getPointAtLength(current)
      comet.setAttribute('transform', `translate(${pt.x} ${pt.y})`)
      comet.style.opacity = current > 2 && current < total - 2 ? '1' : '0'
    }

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      current = total
      render()
      return
    }

    // y is monotonic along the path, so binary-search the length matching the reading line.
    const lengthAtY = (y: number) => {
      let lo = 0
      let hi = total
      for (let i = 0; i < 20; i++) {
        const mid = (lo + hi) / 2
        if (path.getPointAtLength(mid).y < y) lo = mid
        else hi = mid
      }
      return hi
    }

    const tick = () => {
      const target = lengthAtY(window.innerHeight * 0.7 - svg.getBoundingClientRect().top)
      current += (target - current) * 0.1
      if (Math.abs(target - current) < 0.5) current = target
      render()
      raf = current === target ? 0 : requestAnimationFrame(tick)
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }

    kick()
    window.addEventListener('scroll', kick, { capture: true, passive: true })
    window.addEventListener('resize', kick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', kick, { capture: true })
      window.removeEventListener('resize', kick)
    }
  }, [geo])

  return (
    <div ref={rootRef} className="relative">
      {geo && (
        <svg ref={svgRef} aria-hidden width={geo.width} height={geo.height} className="pointer-events-none absolute left-0 top-0 overflow-visible">
          <defs>
            <linearGradient id="trail-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={geo.height}>
              {geo.stops.map((s, i) => (
                <stop key={i} offset={s.offset} stopColor={s.color} />
              ))}
            </linearGradient>
            <radialGradient id="trail-comet">
              <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
              <stop offset="0.35" stopColor="#f0abfc" stopOpacity="0.45" />
              <stop offset="1" stopColor="#c026d3" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path d={geo.d} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="2" strokeLinecap="round" strokeDasharray="0.5 11" className="trail-flow" />
          <path ref={glowRef} d={geo.d} fill="none" stroke="url(#trail-grad)" strokeWidth="14" strokeLinecap="round" opacity="0.16" />
          <path ref={pathRef} d={geo.d} fill="none" stroke="url(#trail-grad)" strokeWidth="3" strokeLinecap="round" />
          <g ref={cometRef} className="transition-opacity duration-500">
            <circle r="22" fill="url(#trail-comet)" className="trail-comet-halo" />
            <circle r="4" fill="#fff" />
          </g>
        </svg>
      )}
      {children}
    </div>
  )
}
