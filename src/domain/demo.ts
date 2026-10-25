import { todayIso } from './dates'
import type { Activity, Friend, Meeting, Place } from './types'

// [name, randomuser.me portrait path]
const DEMO_FRIENDS: [string, string][] = [
  ['Léa', 'women/44'],
  ['Tom', 'men/32'],
  ['Max', 'men/75'],
  ['Inès', 'women/68'],
  ['Hugo', 'men/46'],
  ['Camille', 'women/12'],
  ['Nora', 'women/90'],
  ['Julien', 'men/22'],
  ['Sarah', 'women/29'],
  ['Karim', 'men/85'],
  ['Chloé', 'women/57'],
  ['Antoine', 'men/61'],
  ['Paul', 'men/8'],
]

const PLACES: { place: Place; activity: Activity }[] = [
  { place: { label: 'Bouillon Chartier, Paris 9e', lat: 48.8719, lng: 2.3437 }, activity: 'resto' },
  { place: { label: 'Café de Flore, Paris 6e', lat: 48.8541, lng: 2.3326 }, activity: 'cafe' },
  { place: { label: 'Le Comptoir Général, Paris 10e', lat: 48.8718, lng: 2.3647 }, activity: 'soiree' },
  { place: { label: 'Parc des Buttes-Chaumont, Paris 19e', lat: 48.8809, lng: 2.3828 }, activity: 'sport' },
  { place: { label: "Musée d'Orsay, Paris 7e", lat: 48.86, lng: 2.3266 }, activity: 'culture' },
  { place: { label: 'Le Perchoir, Paris 11e', lat: 48.8607, lng: 2.3826 }, activity: 'soiree' },
  { place: { label: 'Philharmonie de Paris, Paris 19e', lat: 48.8918, lng: 2.3937 }, activity: 'culture' },
  { place: { label: 'Ten Belles, Paris 10e', lat: 48.8723, lng: 2.3631 }, activity: 'cafe' },
  { place: { label: 'Pizza Popolare, Paris 2e', lat: 48.8688, lng: 2.3468 }, activity: 'resto' },
  { place: { label: 'Bois de Vincennes', lat: 48.8283, lng: 2.433 }, activity: 'sport' },
  { place: { label: 'Chez Janou, Paris 3e', lat: 48.8584, lng: 2.3667 }, activity: 'resto' },
  { place: { label: 'Le Grand Rex, Paris 2e', lat: 48.8706, lng: 2.3477 }, activity: 'culture' },
  { place: { label: 'Vieux-Port, Marseille', lat: 43.2951, lng: 5.374 }, activity: 'voyage' },
  { place: { label: 'Place de la Bourse, Bordeaux', lat: 44.8412, lng: -0.57 }, activity: 'voyage' },
  { place: { label: 'Vieux Lyon, Lyon', lat: 45.7624, lng: 4.827 }, activity: 'voyage' },
  { place: { label: "Lac d'Annecy, Annecy", lat: 45.8992, lng: 6.1294 }, activity: 'voyage' },
  { place: { label: 'Grande Plage, Biarritz', lat: 43.4844, lng: -1.5586 }, activity: 'voyage' },
  { place: { label: 'Canal Saint-Martin, Paris 10e', lat: 48.8708, lng: 2.3655 }, activity: 'autre' },
]

// [daysAgo, friend indexes, place index, note]
const MEETINGS: [number, number[], number, string?][] = [
  [1, [0, 1], 0, 'Anniversaire de Tom 🎂'],
  [3, [2], 7],
  [6, [3, 4, 5], 2, 'Soirée de fin de mois'],
  [9, [6], 4, 'Expo Van Gogh'],
  [12, [1, 2], 3, 'Footing 8 km'],
  [16, [7], 8],
  [20, [0], 1, 'Elle déménage à Lyon en janvier'],
  [24, [8, 9], 5],
  [29, [4], 9, 'Vélo'],
  [35, [0, 1, 2, 3], 10, 'Crémaillère de Max'],
  [41, [5, 6], 11, 'Dune 3'],
  [48, [10], 1],
  [55, [1, 7, 9], 2],
  [63, [2, 4], 3],
  [70, [0, 3, 5, 8], 12, 'Week-end à Marseille ☀️'],
  [78, [6], 7],
  [86, [9], 0],
  [95, [7, 10], 6, 'Concert de jazz'],
  [104, [1], 9],
  [118, [0, 2, 4, 6], 17, 'Pique-nique au bord du canal'],
  [131, [3], 8],
  [145, [5, 8, 10], 15, 'Road trip dans les Alpes'],
  [160, [11], 1, 'Première fois depuis la fac'],
  [172, [2, 9], 5],
  [190, [0, 1], 13, 'Dégustation à Bordeaux 🍷'],
  [205, [4, 7], 3],
  [221, [6, 10], 4],
  [240, [3, 5], 0],
  [262, [1, 2, 4, 9], 16, 'Surf à Biarritz 🏄'],
  [285, [8], 7],
  [310, [11, 0], 10, 'Antoine part au Canada'],
  [334, [7], 11],
  [360, [0, 1, 2, 3, 4, 5], 2, 'Réveillon'],
  [395, [6, 8], 14, 'Fête des Lumières'],
  [430, [1, 10], 9],
  [470, [2, 3], 1],
  [520, [0, 5, 9], 8],
]

export function buildDemoData(now = new Date()): { friends: Friend[]; meetings: Meeting[] } {
  const friends = DEMO_FRIENDS.map(([name, portrait], i) => ({
    id: `demo-friend-${i}`,
    name,
    avatarUrl: `https://randomuser.me/api/portraits/${portrait}.jpg`,
  }))
  const meetings = MEETINGS.map(([daysAgo, friendIdx, placeIdx, note], i) => {
    const { place, activity } = PLACES[placeIdx]
    return {
      id: `demo-meeting-${i}`,
      date: todayIso(new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo)),
      friendIds: friendIdx.map((f) => friends[f].id),
      place,
      activity,
      note,
    }
  })
  return { friends, meetings }
}
