const DAY_MS = 86_400_000

export function parseDay(date: string): Date {
  return new Date(`${date}T00:00:00`)
}

export function todayIso(now = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function daysBetween(date: string, now: Date): number {
  return Math.floor((parseDay(todayIso(now)).getTime() - parseDay(date).getTime()) / DAY_MS)
}

export function relativeDays(days: number): string {
  if (days < 0) return 'à venir'
  if (days === 0) return "aujourd'hui"
  if (days === 1) return 'hier'
  if (days < 30) return `il y a ${days} j`
  if (days < 365) return `il y a ${Math.round(days / 30)} mois`
  const years = Math.floor(days / 365)
  return `il y a ${years} an${years > 1 ? 's' : ''}`
}

export function addDays(date: string, n: number): string {
  const d = parseDay(date)
  return todayIso(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n))
}

export function formatDay(date: string): string {
  return parseDay(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatMonth(monthKey: string): string {
  return parseDay(`${monthKey}-01`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
}
