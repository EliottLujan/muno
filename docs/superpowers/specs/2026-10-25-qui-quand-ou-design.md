# Qui · Quand · Où — Design V1

## Objectif

Se souvenir **quand**, **avec qui** et **où** on a vu ses proches. Web app responsive (utilisable sur mobile, installable en PWA). La **timeline** est le cœur de l'app.

Contrainte : V1 livrable en ~30 min.

## Stack

- Vite + React + TypeScript
- Tailwind CSS
- Leaflet (react-leaflet) + tuiles OpenStreetMap — pas de clé API
- Géocodage : Nominatim (OpenStreetMap), gratuit, sans clé
- Stockage : localStorage (un seul store), export/import JSON
- Tests : Vitest sur la logique pure (filtres, stats)

Alternatives écartées : HTML/JS vanilla (rapide mais non évolutif), Expo/React Native (setup trop long, carte web fragile).

## Modèle de données

```ts
type Friend = { id: string; name: string }

type Activity = 'resto' | 'cafe' | 'sport' | 'soiree' | 'culture' | 'voyage' | 'autre'

type Place = { label: string; lat: number; lng: number }

type Meeting = {
  id: string
  date: string        // ISO 8601 (jour + heure optionnelle)
  friendIds: string[] // au moins 1
  place: Place
  activity: Activity
  note?: string
}
```

Persistance : `{ friends: Friend[], meetings: Meeting[] }` sérialisé dans `localStorage` sous la clé `qqo:v1`.

## Navigation

- Mobile : barre d'onglets en bas.
- Desktop (≥ 768 px) : barre latérale à gauche, contenu centré.
- Onglets : **Timeline** (défaut) · **Carte** · **Amis** · **Activité**.

## Écrans

### Timeline (écran principal)

```
┌──────────────────────────────┐
│ 🔍 Rechercher…               │
│ [Ami ▾] [Activité ▾] [Période ▾] │
├──────────────────────────────┤
│ OCTOBRE 2026                 │
│ ┌──────────────────────────┐ │
│ │ 🍽  Sam. 24 oct.          │ │
│ │ (Léa) (Tom)              │ │
│ │ 📍 Le Petit Bistro, Paris│ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ ☕  Mer. 21 oct.          │ │
│ │ (Max)                    │ │
│ │ 📍 Café Oberkampf        │ │
│ └──────────────────────────┘ │
│ SEPTEMBRE 2026               │
│ …                         (+)│
├──────────────────────────────┤
│ Timeline  Carte  Amis  Activité │
└──────────────────────────────┘
```

- Tri antichronologique, regroupement par mois.
- Carte de RDV : icône d'activité, date, pastilles amis, lieu, début de note.
- Filtres combinables : texte libre (nom d'ami, lieu, note), ami(s), activité, période (30 j / 3 mois / 1 an / tout).
- Bouton flottant **+** → formulaire de RDV.
- Clic sur un RDV → détail avec actions modifier / supprimer.
- État vide : message + bouton « Ajouter mon premier RDV ».

### Formulaire de RDV (modal plein écran sur mobile)

- Date (défaut : aujourd'hui).
- Amis : sélection multiple avec saisie ; « Créer “Nom” » si l'ami n'existe pas.
- Lieu : champ adresse avec suggestions Nominatim (debounce 400 ms) **ou** bouton « 📍 Ma position » (géolocalisation navigateur, libellé via reverse geocoding).
- Activité : puces sélectionnables.
- Note : texte libre optionnel.
- Validation : ≥ 1 ami et un lieu avec coordonnées.

### Carte

- Marqueurs Leaflet pour les RDV **filtrés** (mêmes filtres que la timeline, état partagé).
- Popup : date, amis, lieu, activité → lien vers le détail.
- Vue ajustée automatiquement aux marqueurs.

### Amis

- Liste : nom, nombre de RDV, date du dernier RDV.
- Tri par dernier RDV (plus récent en haut).
- Clic → bascule sur la Timeline filtrée sur cet ami.
- Ajout / renommage / suppression (suppression interdite si l'ami a des RDV).

### Activité (léger)

- Répartition des RDV par type d'activité (barres horizontales, clic → timeline filtrée).
- « Pas vus depuis longtemps » : amis triés par ancienneté du dernier RDV, avec le nombre de jours.

### Réglages (icône dans l'en-tête)

- Exporter les données (téléchargement JSON).
- Importer un JSON (remplace les données après confirmation).

## Architecture

```
src/
  domain/types.ts        # types ci-dessus
  domain/filters.ts      # filterMeetings(meetings, filters) — pur, testé
  domain/stats.ts        # countByActivity, lastSeenByFriend — pur, testé
  store/store.ts         # état + persistance localStorage + filtres partagés
  services/geocoding.ts  # search(query), reverse(lat, lng) via Nominatim
  ui/tabs/Timeline.tsx
  ui/tabs/MapView.tsx
  ui/tabs/Friends.tsx
  ui/tabs/Activity.tsx
  ui/MeetingForm.tsx
  ui/components/…        # FriendChip, MeetingCard, Filters
```

- Logique métier pure dans `domain/` (sans React), testée avec Vitest.
- Un seul store partagé : données + filtres actifs (pour que Carte et Timeline restent synchronisées).

## Gestion d'erreurs

- Géocodage indisponible / sans résultat : message inline, saisie possible de nouveau.
- Géolocalisation refusée : message inline, repli sur la saisie d'adresse.
- Import JSON invalide : message d'erreur, données existantes intactes.

## Hors périmètre V1

Comptes, synchronisation multi-appareils, photos, notifications, rappels, partage.
