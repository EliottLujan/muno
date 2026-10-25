// Status palette (good / warning / serious / critical), always rendered with an icon + label.
export function freshness(daysSince: number | null): { color: string; icon: string; label: string; ratio: number } {
  if (daysSince === null) return { color: '#ffffff33', icon: '·', label: 'Jamais vu·e', ratio: 0 }
  if (daysSince <= 30) return { color: '#0ca30c', icon: '🟢', label: 'Vu récemment', ratio: 1 }
  if (daysSince <= 90) return { color: '#fab219', icon: '🟡', label: 'Ça fait un moment', ratio: 0.66 }
  if (daysSince <= 180) return { color: '#ec835a', icon: '🟠', label: 'Ça fait longtemps', ratio: 0.4 }
  return { color: '#d03b3b', icon: '🔴', label: 'Il faut se voir !', ratio: 0.18 }
}
