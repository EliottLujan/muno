import { useSyncExternalStore } from 'react'
import { buildDemoData } from '../domain/demo'
import { EMPTY_FILTERS, type Filters, type Friend, type Meeting } from '../domain/types'

const STORAGE_KEY = 'nuno:v1'

export type Data = { friends: Friend[]; meetings: Meeting[] }
export type State = Data & { filters: Filters }

function load(): Data {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return withDemoAvatars(refreshDemo(parseData(raw)))
  } catch {
    // corrupted storage: start fresh rather than crash
  }
  return { friends: [], meetings: [] }
}

// Untouched demo data is regenerated so it follows the current demo set.
function refreshDemo(data: Data): Data {
  const pureDemo =
    data.meetings.length > 0 &&
    data.friends.every((f) => f.id.startsWith('demo-friend-')) &&
    data.meetings.every((m) => m.id.startsWith('demo-meeting-'))
  return pureDemo ? buildDemoData() : data
}

// Demo data saved before avatars existed gets its portraits back.
function withDemoAvatars(data: Data): Data {
  const demo = new Map(buildDemoData().friends.map((f) => [f.id, f.avatarUrl]))
  return { ...data, friends: data.friends.map((f) => (f.avatarUrl || !demo.has(f.id) ? f : { ...f, avatarUrl: demo.get(f.id) })) }
}

export function parseData(raw: string): Data {
  const data = JSON.parse(raw)
  if (!Array.isArray(data?.friends) || !Array.isArray(data?.meetings)) throw new Error('Format invalide')
  return { friends: data.friends, meetings: data.meetings }
}

let state: State = { ...load(), filters: EMPTY_FILTERS }
const listeners = new Set<() => void>()

function set(next: Partial<State>) {
  state = { ...state, ...next }
  if ('friends' in next || 'meetings' in next) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ friends: state.friends, meetings: state.meetings }))
  }
  listeners.forEach((l) => l())
}

export function useStore(): State {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}

export const actions = {
  addFriend(name: string): Friend {
    const friend = { id: crypto.randomUUID(), name: name.trim() }
    set({ friends: [...state.friends, friend] })
    return friend
  },
  renameFriend(id: string, name: string) {
    set({ friends: state.friends.map((f) => (f.id === id ? { ...f, name: name.trim() } : f)) })
  },
  deleteFriend(id: string) {
    if (state.meetings.some((m) => m.friendIds.includes(id))) return
    set({ friends: state.friends.filter((f) => f.id !== id) })
  },
  saveMeeting(meeting: Omit<Meeting, 'id'> & { id?: string }) {
    const saved: Meeting = { ...meeting, id: meeting.id ?? crypto.randomUUID() }
    const exists = state.meetings.some((m) => m.id === saved.id)
    set({ meetings: exists ? state.meetings.map((m) => (m.id === saved.id ? saved : m)) : [...state.meetings, saved] })
  },
  deleteMeeting(id: string) {
    set({ meetings: state.meetings.filter((m) => m.id !== id) })
  },
  setFilters(filters: Partial<Filters>) {
    set({ filters: { ...state.filters, ...filters } })
  },
  exportData(): string {
    return JSON.stringify({ friends: state.friends, meetings: state.meetings }, null, 2)
  },
  importData(raw: string) {
    set(parseData(raw))
  },
  loadDemo() {
    set({ ...buildDemoData(), filters: EMPTY_FILTERS })
  },
}
