# Ndembo Kin Connect CRM — Guide pour Claude Code

## Contexte du projet
CRM pour le cabinet de management sportif Ndembo Kin Connect (Kinshasa, RDC).
Monorepo : `apps/web` (Next.js 14 App Router) + `apps/api` (Fastify + Prisma + PostgreSQL).

---

## Design System — Tokens canoniques

### Couleurs (source de vérité : `design_handoff_ndembo_kin_crm/`)
```
#07101A   — Fond sidebar, boutons CTA primaires, en-têtes sombres
#0A1628   — Topbar dashboard (dark)
#0F172A   — Fond principal dashboard, texte primaire
#132130   — Cartes KPI dashboard
#132730   — Hover boutons, fond alternatif
#3A6B84   — Ardoise/accent (liens, focus inputs, icônes)
#7CC8E8   — Cyan Connect (avatars, accents highlights)
#FCD116   — Or RDC (nav active, texte CTA, highlights)
#DAA520   — Or foncé (bordure active nav, gradient CTA)
#0F172A   — Texte primaire
#334155   — Texte corps
#64748B   — Texte secondaire
#94A3B8   — Texte tertiaire / placeholders
#E2E8F0   — Bordures standard
#E8ECF1   — Séparateurs / dividers
#F0F2F5   — Fond page (light theme)
#F1F5F9   — Fond doux / chips
#F8FAFC   — Fond champs formulaires
#FFFFFF   — Cartes / modals
```

### Bouton primaire (CTA)
`background: #07101A`, `color: #FCD116`, `border-radius: 10px`, `font-weight: 700`
Hover : `background: #132730`

### Inputs
`background: #FAFBFC`, `border: 1.5px solid #E2E8F0`, `border-radius: 10px`
Focus : `border-color: #3A6B84`, `box-shadow: 0 0 0 3px rgba(58,107,132,0.12)`

---

## Layout

### Sidebar (toujours présente)
- Largeur : **252px**
- `background: #07101A`
- `border-right: 1px solid rgba(252,209,22,0.08)`
- Nav active : `background: rgba(252,209,22,0.08)`, `color: #FCD116`, `border-left: 2px solid #DAA520`
- Nav inactive : `color: rgba(255,255,255,0.45)`
- Labels de groupe : `rgba(255,255,255,0.2)`, 9px, tracking 2px
- Profil utilisateur en bas avec avatar gradient `#DAA520→#FCD116`

### Topbar (pages light theme)
- `background: #fff`, `border-bottom: 1px solid #E8ECF1`, `height: 60px`

### Topbar (Dashboard — dark theme)
- `background: #0A1628`, `border-bottom: 1px solid rgba(252,209,22,0.08)`

### Thème des pages
- **Dashboard** : fond `#0F172A`, cartes `#132130`, tout est sombre
- **Toutes les autres pages** : fond `#F0F2F5`, cartes `#fff`

---

## Icônes
Utiliser `Material Icons Outlined` (chargée via Google Fonts dans `layout.tsx`).
Rendu via `<span className="material-icons-outlined">{name}</span>`.
Ne pas utiliser lucide-react pour les nouveaux composants.

---

## Autosave formulaires
- Clé localStorage : `'nkc:draft:athlete'`, `'nkc:draft:devis'`
- Hook : `useAutosave(key, form, enabled)` — debounce 800ms
- Restauration au chargement : `loadDraft(key)`
- Effacement après succès : `clearDraft(key)`

---

## Architecture API (Fastify + Prisma)
- JWT access token (15min) + refresh token (7j), RBAC 5 rôles
- `PLANIFICATEUR > SUPERVISEUR > COMMERCIAL > COACH > OBSERVATEUR`
- API centralisée dans `apps/web/src/lib/api.ts`
- Pagination : `data.data` + `data.total`

---

## Conventions de code
- Pas de commentaires sauf si le WHY est non-évident
- Pas de lucide-react dans les nouveaux composants (utiliser Material Icons Outlined)
- `'use client'` sur tous les composants avec hooks ou événements
- Couleurs TOUJOURS en valeurs hex ou rgba bruts, jamais de classes Tailwind arbitraires incohérentes
- Les tokens Tailwind sont dans `tailwind.config.js` sous le préfixe `nkc-*`

---

## Fichiers de design
Disponibles dans `design_handoff_ndembo_kin_crm/designs/` :
- `Login Page.dc.html`
- `Dashboard.dc.html`
- `Liste Athlètes.dc.html`
- `Fiche Athlète.dc.html`
- `Formulaire Nouvel Athlète.dc.html`
- `Pipeline Factures.dc.html`
- `Kanban Projets.dc.html`
- `Mot de passe oublié.dc.html`
- `Formulaire Nouveau Devis.dc.html`
- `Paiement Mobile Money.dc.html`

Ces fichiers sont la **source de vérité absolue** pour le design.
En cas de doute, lire le fichier `.dc.html` correspondant.
