import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

export function PhotoViewer({ photos, start = 0, caption, onClose }: { photos: string[]; start?: number; caption?: string; onClose: () => void }) {
  const [index, setIndex] = useState(start)
  const [dir, setDir] = useState(0)
  const go = (delta: number) => {
    setDir(delta)
    setIndex((i) => (i + delta + photos.length) % photos.length)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else return
      e.stopPropagation()
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  })

  const touchX = useRef(0)
  const many = photos.length > 1
  const nav = 'absolute top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/15 backdrop-blur-xl transition hover:scale-110 hover:bg-white/20'

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Souvenirs"
      className="fixed inset-0 z-[1100] flex animate-fade flex-col items-center justify-center gap-4 bg-black/90 p-4 backdrop-blur-xl"
      onClick={(e) => {
        e.stopPropagation()
        if (e.target === e.currentTarget) onClose()
      }}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - touchX.current
        if (many && Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
      }}
    >
      <button type="button" aria-label="Fermer" onClick={onClose} className="absolute right-4 top-[calc(env(safe-area-inset-top)+16px)] z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20">
        <X size={20} />
      </button>

      <div className="relative flex min-h-0 w-full flex-1 items-center justify-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <img
          key={index}
          src={photos[index]}
          alt={`Souvenir ${index + 1} sur ${photos.length}`}
          className="photo-in max-h-full max-w-full rounded-3xl object-contain shadow-2xl shadow-black ring-1 ring-white/10"
          style={{ '--photo-from': `${dir * 60}px` } as CSSProperties}
          draggable={false}
        />
        {many && (
          <>
            <button type="button" aria-label="Photo précédente" onClick={() => go(-1)} className={`${nav} left-0 md:left-4`}>
              <ChevronLeft size={22} />
            </button>
            <button type="button" aria-label="Photo suivante" onClick={() => go(1)} className={`${nav} right-0 md:right-4`}>
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>

      <div className="flex flex-col items-center gap-3 pb-[env(safe-area-inset-bottom)]">
        {caption && <p className="text-center text-sm font-medium text-white/70">{caption}</p>}
        {many && (
          <div className="flex gap-2">
            {photos.map((src, i) => (
              <button
                key={src}
                type="button"
                aria-label={`Photo ${i + 1}`}
                aria-current={i === index}
                onClick={() => {
                  setDir(i > index ? 1 : -1)
                  setIndex(i)
                }}
                className={`h-12 w-16 overflow-hidden rounded-xl transition ${i === index ? 'scale-110 ring-2 ring-white' : 'opacity-50 hover:opacity-90'}`}
              >
                <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" draggable={false} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
