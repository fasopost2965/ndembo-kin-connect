# Routes & navigation — Ndembo Kin Connect CRM

Carte complète des routes frontend (Next.js App Router), reliée à chaque écran de référence (`designs/*.dc.html`) et à sa base API. Convention : les écrans applicatifs vivent sous le groupe `(app)` (layout avec sidebar + topbar) ; l'auth est hors layout.

## 1. Routes publiques (hors layout app)

| Route | Écran (design) | Description |
|---|---|---|
| `/login` | `Login Page.dc.html` | Connexion split-screen + comptes démo |
| `/forgot-password` | `Mot de passe oublié.dc.html` | Saisie e-mail → confirmation (2 états) |
| `/reset-password` | `Mot de passe oublié.dc.html` | Réinitialisation via token (même style) |

## 2. Routes applicatives `(app)` — sidebar

| Ordre sidebar | Route | Écran (design) | API base |
|---|---|---|---|
| 1 | `/dashboard` | `Dashboard.dc.html` | `/api/dashboard` |
| 2 | `/athletes` | `Liste Athlètes.dc.html` | `/api/athletes` |
| 2a | `/athletes/new` | `Formulaire Nouvel Athlète.dc.html` | `POST /api/athletes` |
| 2b | `/athletes/[id]` | `Fiche Athlète.dc.html` | `/api/athletes/:id` |
| 2c | `/athletes/[id]/edit` | `Formulaire Nouvel Athlète.dc.html` | `PUT /api/athletes/:id` |
| 3 | `/clients` | `Liste Clients.dc.html` | `/api/clients` |
| 3a | `/clients/[id]` | `Fiche Client.dc.html` | `/api/clients/:id` (+ `/timeline`) |
| 4 | `/prestations` | `Catalogue Prestations.dc.html` | `/api/prestations` |
| 5 | `/devis` | `Pipeline Factures.dc.html` (onglet Devis) | `/api/devis` |
| 5a | `/devis/new` | `Formulaire Nouveau Devis.dc.html` | `POST /api/devis` |
| 5b | `/devis/[id]` | `Modeles Facture & Devis.dc.html` (aperçu PDF) | `/api/devis/:id` (+ `/pdf`) |
| 6 | `/factures` | `Pipeline Factures.dc.html` (onglet Factures) | `/api/factures` |
| 6a | `/factures/[id]` | `Modeles Facture & Devis.dc.html` (aperçu PDF) | `/api/factures/:id` (+ `/pdf`) |
| 6b | `/factures/[id]/paiement` | `Paiement Mobile Money.dc.html` | `PATCH /api/factures/:id/paiement` |
| 7 | `/reglements` | `Liste Reglements.dc.html` | `/api/reglements` |
| 8 | `/projets` | `Kanban Projets.dc.html` | `/api/projets` |
| 8a | `/projets/[id]` | `Kanban Projets.dc.html` (filtré) | `/api/projets/:id/kanban` |
| 9 | `/taches` | `Liste Taches.dc.html` | `/api/taches` |
| 10 | `/jalons` | `Jalons Projets.dc.html` | `/api/jalons` |
| 11 | `/contrats` | `Liste Contrats.dc.html` | `/api/contrats` |
| 11a | `/contrats/[id]` | `Liste Contrats.dc.html` (drawer détail) | `/api/contrats/:id` (+ `/sign`, `/pdf`) |
| 12 | `/activites` | *(à concevoir — journal global)* | `/api/activites` |
| 13 | `/rapports` | `Rapports KPIs.dc.html` | `/api/rapports` + `/api/dashboard/*` |
| 14 | `/parametres` | `Parametres.dc.html` | `/api/settings` (+ `/users`) |

> `Paiement Mobile Money` peut aussi s'ouvrir en **modale/route interceptée** depuis `/factures` plutôt qu'en page pleine — au choix du dev, le design fonctionne pour les deux.

## 3. Structure de fichiers Next.js (App Router) suggérée

```
app/
├── login/page.tsx
├── forgot-password/page.tsx
├── reset-password/page.tsx
└── (app)/                         ← layout.tsx = sidebar + topbar
    ├── layout.tsx
    ├── dashboard/page.tsx
    ├── athletes/
    │   ├── page.tsx               (Liste)
    │   ├── new/page.tsx           (Formulaire)
    │   └── [id]/
    │       ├── page.tsx           (Fiche — onglets carrière/contrats/activités/notes)
    │       └── edit/page.tsx
    ├── clients/
    │   ├── page.tsx
    │   └── [id]/page.tsx          (Fiche — onglets aperçu/devis/factures/activité)
    ├── prestations/page.tsx
    ├── devis/
    │   ├── page.tsx
    │   ├── new/page.tsx
    │   └── [id]/page.tsx
    ├── factures/
    │   ├── page.tsx
    │   └── [id]/page.tsx
    ├── reglements/page.tsx
    ├── projets/page.tsx
    ├── taches/page.tsx
    ├── jalons/page.tsx
    ├── contrats/
    │   ├── page.tsx
    │   └── [id]/page.tsx
    ├── activites/page.tsx
    ├── rapports/page.tsx
    └── parametres/page.tsx
```

## 4. Ordre de la sidebar (groupes)

- **Pilotage** : Dashboard · Rapports
- **CRM** : Athlètes · Clients · Contrats
- **Commercial** : Prestations · Devis · Factures · Règlements
- **Projets** : Projets (Kanban) · Tâches · Jalons
- **Activités** : Activités
- **Système** : Paramètres *(visible Admin uniquement)*

## 5. Garde d'accès par route (RBAC)

Chaque route `(app)` est protégée par le middleware `checkRole`. La matrice complète est dans `Parametres.dc.html` et au §9 du README. Rappels critiques :

| Route | Rôles autorisés (écriture) |
|---|---|
| `/parametres` | ADMIN uniquement |
| `/contrats*` | ADMIN, MANAGER |
| `/reglements`, `/factures*` | ADMIN, MANAGER, COMPTABLE |
| `/devis*` | ADMIN, MANAGER, COMMERCIAL |
| `/athletes*` | ADMIN, MANAGER, COACH (COMMERCIAL/COMPTABLE : lecture) |
| `/clients*` | ADMIN, MANAGER, COMMERCIAL |

> Les rôles en **lecture seule** voient la route mais sans les boutons d'action (créer/éditer/supprimer) — masquer ces boutons côté UI ET refuser côté API (403).

## 6. Endpoints API

La liste des endpoints critiques (Auth, Athlètes, Clients, Devis, Factures, Projets, Contrats, Dashboard, Paiement/FlexPay) est au **§8 du README**. Base : `/api/...`.
