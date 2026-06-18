# Handoff Développeur — Ndembo Kin Connect CRM

> **À lire en premier.** Ce dossier contient les **références de design** du CRM Ndembo Kin Connect, plus toutes les spécifications techniques nécessaires pour le construire. Donne ce dossier entier à Claude Code (ou à ton développeur) avec le message d'amorçage fourni à la fin.

---

## 0. Pourquoi « ce que je vois en local ne correspond pas »

C'est le point le plus important de ce document.

Les fichiers `designs/*.dc.html` sont des **prototypes de référence haute-fidélité**. Ils représentent **exactement** l'apparence et le comportement attendus. Ils **ne sont pas** le code de production à copier tel quel.

Si l'app installée en local ne ressemble pas à ces écrans, c'est qu'elle a été codée **sans se caler pixel par pixel sur ces références**. La règle est simple :

> **La source de vérité visuelle, ce sont les fichiers de ce dossier.** Pas l'interprétation, pas une « version améliorée ». On reproduit ce qui est montré.

### Comment voir les designs cibles

Chaque fichier `designs/*.dc.html` **s'ouvre directement dans un navigateur** (double-clic) et se rend tout seul — il embarque son moteur de rendu (`support.js`). Une connexion internet est requise uniquement pour les polices Google (Plus Jakarta Sans) et les icônes Material.

Pour comparer le résultat local au design : ouvre l'écran `.dc.html` correspondant **côte à côte** avec ton app et aligne couleurs, espacements, tailles de police, états.

---

## 1. Vue d'ensemble

**Ndembo Kin Connect** est un CRM pour une agence de management sportif basée à Kinshasa (RDC). Il gère le cycle commercial complet autour des athlètes :

**Scouting d'athlètes → Clients (clubs, sponsors, académies) → Devis → Factures → Projets → Contrats**

Le produit est conçu pour le contexte RDC : internet instable (offline-first / PWA), paiements par Mobile Money (MTN / Airtel / Orange), usage majoritairement mobile sur Android.

---

## 2. À propos des fichiers de design

Les fichiers de `designs/` sont des prototypes écrits en HTML. **La tâche n'est pas de les expédier tels quels en production**, mais de **les recréer dans l'environnement de la codebase cible** (le stack recommandé ci-dessous, ou celui déjà en place) en respectant pixel par pixel leur apparence et leur comportement.

- Si une codebase existe déjà → recrée les écrans avec ses composants/patterns établis, en collant aux valeurs exactes ci-dessous.
- Si rien n'existe encore → utilise le stack recommandé (section 5) et implémente les designs là.

**Fidélité : HAUTE-FIDÉLITÉ (hifi).** Couleurs, typographie, espacements et interactions sont définitifs. Reproduire fidèlement.

---

## 3. Tokens de design (valeurs exactes)

### Couleurs de marque
| Nom | Hex | Usage |
|---|---|---|
| Bleu Drapeau | `#132730` | Sidebar, boutons primaires, texte fort |
| Ardoise | `#3A6B84` | Liens, icônes, éléments de marque |
| Cyan Connect | `#7CC8E8` | Accent principal, surbrillance, KPIs |
| Or RDC | `#FCD116` | Accent secondaire, mises en avant |

> Note : certaines anciennes specs mentionnent un navy `#07101A`. La valeur **canonique** du bleu primaire est `#132730` (boutons/sidebar). Utiliser celle-ci.

### Neutres (interface)
| Hex | Rôle |
|---|---|
| `#0F172A` | Texte principal |
| `#334155` | Texte corps |
| `#64748B` | Texte secondaire |
| `#94A3B8` | Texte tertiaire / placeholders |
| `#E2E8F0` | Bordures |
| `#F1F5F9` | Fonds doux / secondaire |
| `#F4F6F9` / `#F0F2F5` | Fond de page |
| `#FFFFFF` | Surfaces / cartes |

### Sémantique (statuts)
| Nom | Hex |
|---|---|
| Succès | `#10B981` |
| Attention | `#F59E0B` |
| Erreur | `#EF4444` |
| Info | `#3A6B84` |

### Badges — couleurs d'arrière-plan + texte
| Badge | Texte | Fond |
|---|---|---|
| Payée | `#0D9668` | `#ECFDF5` |
| En attente | `#C9960C` | `#FEF9EE` |
| Impayée | `#DC2626` | `#FEF2F2` |
| En cours | `#3A6B84` | `#EBF6FB` |
| Brouillon | `#64748B` | `#F1F5F9` |
| Pro | `#6D28D9` | `#F5F3FF` |
| Semi-pro | `#2563EB` | `#EFF6FF` |
| Amateur | `#64748B` | `#F1F5F9` |

### Typographie
- **Famille unique : Plus Jakarta Sans** (Google Fonts), graisses 400 / 500 / 600 / 700 / 800.
- **Mono (code, numéros techniques) : JetBrains Mono** (utilisé dans les vues techniques uniquement).
- Échelle :
  | Rôle | Taille | Graisse | Letter-spacing |
  |---|---|---|---|
  | Display | 40px | 800 | -1px |
  | Titre | 26px | 700 | -0.5px |
  | Section | 18px | 600 | — |
  | Corps | 15px | 400 | — |
  | Label | 11px | 600 | 1px, UPPERCASE |

### Rayons
| Valeur | Usage |
|---|---|
| `8px` | Boutons, badges |
| `10px` | Boutons (champs), inputs |
| `12px` | Champs, puces, petites cartes |
| `16px` | Cartes |
| `20px` | Pills / chips |
| `50%` | Avatars |

### Ombres
- Carte standard : `0 1px 3px rgba(0,0,0,0.05)`
- Carte légère : `0 1px 4px rgba(0,0,0,0.04)`
- Élevée (modales, menus) : `0 8px 24px rgba(15,23,42,0.12)`

### Boutons (specs exactes)
- **Primaire** : fond `#132730`, texte `#fff`, padding `11px 22px`, radius `10px`, 14px/600.
- **Accent** : fond `#7CC8E8`, texte `#0B2530`, 14px/700.
- **Secondaire** : fond `#F1F5F9`, texte `#334155`, 14px/600.
- **Contour** : bordure `1.5px #E2E8F0`, texte `#334155`, 14px/600.

### Champ de saisie
- Repos : bordure `1.5px #E2E8F0`, radius `10px`, padding `11px 14px`.
- Actif/focus : bordure `1.5px #7CC8E8` + halo `0 0 0 3px rgba(124,200,232,0.15)`.

### Avatars
- 40×40, cercle, dégradé `135deg` selon initiales (ex. `#3A6B84 → #7CC8E8`), initiales blanches 14px/700.

---

## 4. Écrans (références dans `designs/`)

10 écrans haute-fidélité + le Design System. Pour chacun, ouvre le `.dc.html` pour voir la cible exacte.

| # | Écran (fichier) | Module | Rôle |
|---|---|---|---|
| 01 | `Login Page` | Auth | Connexion split-screen (branding + comptes démo) |
| 02 | `Mot de passe oublié` | Auth | 2 étapes : saisie e-mail → confirmation d'envoi |
| 03 | `Dashboard` | Dashboard | KPIs, CA, pipeline, activités récentes |
| 04 | `Liste Athlètes` | Athlètes | Table + recherche + filtres sport/niveau + drawer détail + pagination |
| 05 | `Fiche Athlète` | Athlètes | Profil complet, 4 onglets (carrière, contrats, activités, notes) |
| 06 | `Formulaire Nouvel Athlète` | Athlètes | Identité + profil sportif, auto-save brouillon (anti-coupure) |
| 07 | `Formulaire Nouveau Devis` | Pipeline | Lignes de prestations dynamiques + récap TVA/remise + statut |
| 08 | `Pipeline Factures` | Pipeline | Onglets Devis/Factures, KPIs, conversion, action paiement |
| 09 | `Kanban Projets` | Projets | 4 colonnes, déplacement de tâches, modal détail, filtre projet |
| 10 | `Paiement Mobile Money` | Paiement | 3 étapes : saisie → en attente (polling) → succès (M-PESA/Airtel) |
| — | `Design System` | Réf. | Palette, typo, composants, rayons & ombres |

### Comportements clés par écran
- **Login** : comptes démo cliquables qui pré-remplissent. Validation e-mail/mot de passe.
- **Mot de passe oublié** : machine à 2 états (formulaire → écran de confirmation).
- **Dashboard** : cartes KPI, graphe CA, liste pipeline, flux d'activités.
- **Liste Athlètes** : recherche live, filtres sport + niveau, pagination, drawer latéral au clic d'une ligne.
- **Fiche Athlète** : onglets (carrière / contrats / activités / notes). État vide par onglet.
- **Formulaire Nouvel Athlète** : **auto-save toutes les ~30s** dans `localStorage` (coupures de courant). Indicateur de sauvegarde visible.
- **Nouveau Devis** : lignes de prestations ajoutables/supprimables, recalcul HT/remise/TVA en direct, numérotation auto `DEV-AAAA-NNN`.
- **Pipeline Factures** : onglets Devis/Factures, conversion devis→facture, bouton « Enregistrer paiement ».
- **Kanban** : drag & drop entre 4 colonnes (`TODO | EN_COURS | EN_ATTENTE | TERMINÉ`), modal détail tâche, optimistic update.
- **Paiement Mobile Money** : 3 états (saisie numéro → en attente avec polling toutes les ~2min → succès/échec).

Tous les écrans doivent être **responsive mobile (≥375px)**, zones tactiles **≥44px**.

---

## 5. Stack technique recommandé

| Couche | Choix | Pourquoi | Alternative |
|---|---|---|---|
| Frontend | **Next.js 14 (App Router)** | SSR + SSG + PWA, RSC | Nuxt 3 |
| CSS | **TailwindCSS + shadcn/ui** | Utilitaires + composants accessibles prêts | MUI / Mantine |
| Backend | **Node.js + Fastify** | API REST légère et rapide | Express |
| Base de données | **PostgreSQL + Prisma** | Relationnel + types TS auto | MySQL / Supabase |
| Auth | **JWT + bcrypt** | RBAC manuel léger, sans dépendance | NextAuth |
| Paiements RDC | **FlexPay (flexpay.cd)** | MTN/Airtel/Orange Money, doc FR, sandbox | CinetPay |
| PDF | **React-PDF / Puppeteer** | Devis, factures, contrats | PDFKit |
| Déploiement | **Railway.app** (région EU-West) | Node + PostgreSQL tout-en-un, CI/CD GitHub | Render / VPS |
| PWA / Offline | **next-pwa + IndexedDB** | Cache listes, sync différée | Workbox |

⚠️ **Contraintes RDC** : internet instable → PWA offline-first obligatoire. Mobile Money au lieu de Stripe. CDN proche (Cloudflare devant Railway EU-West) pour la latence depuis Kinshasa.

---

## 6. Architecture des modules (14)

Flux de conversion : **Devis → Facture → Projet → Contrat**

| # | Module | Route API | Table | Phase | Priorité |
|---|---|---|---|---|---|
| 01 | Utilisateurs (Auth + RBAC) | `/api/users` | `users` | 1 | ⭐⭐⭐ |
| 02 | Athlètes (scouting + fiche) | `/api/athletes` | `athletes` | 1 | ⭐⭐⭐ |
| 03 | Clients (clubs, sponsors…) | `/api/clients` | `clients` | 1 | ⭐⭐⭐ |
| 04 | Prestations (catalogue) | `/api/prestations` | `prestations` | 1 | ⭐⭐ |
| 05 | Devis (+ PDF) | `/api/devis` | `devis` | 1 | ⭐⭐⭐ |
| 06 | Factures (encaissement) | `/api/factures` | `factures` | 1 | ⭐⭐⭐ |
| 07 | Règlements (Mobile Money) | `/api/reglements` | `reglements` | 2 | ⭐⭐ |
| 08 | Projets (Kanban) | `/api/projets` | `projets` | 2 | ⭐⭐⭐ |
| 09 | Tâches (drag & drop) | `/api/taches` | `taches` | 2 | ⭐⭐⭐ |
| 10 | Jalons (milestones) | `/api/jalons` | `jalons` | 2 | ⭐⭐ |
| 11 | Contrats (+ signature) | `/api/contrats` | `contrats` | 2 | ⭐⭐⭐ |
| 12 | Activités (journal CRM) | `/api/activites` | `activites` | 3 | ⭐⭐ |
| 13 | Rapports (KPIs + exports) | `/api/rapports` | `rapports` | 3 | ⭐⭐ |
| 14 | Paramètres (config, RBAC) | `/api/settings` | `settings` | 1 | ⭐⭐⭐ |

---

## 7. Schéma Prisma (PostgreSQL) — Phase 1

À copier dans `schema.prisma` :

```prisma
// ─── UTILISATEURS ───
model User {
  id         String   @id @default(cuid())
  email      String   @unique
  password   String
  name       String
  role       Role     @default(COMMERCIAL) // ADMIN | MANAGER | COACH | COMPTABLE | COMMERCIAL
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
}

// ─── ATHLÈTES ───
model Athlete {
  id              String  @id @default(cuid())
  nom             String
  sport           String  // football | basketball | athletisme
  poste           String
  niveau          Niveau  // AMATEUR | SEMI_PRO | PRO
  clubActuel      String?
  valeurMarchande Float?
  nationalite     String  @default("RDC")
  statut          String  @default("Actif")
  contrats        Contrat[]
}

// ─── CLIENTS ───
model Client {
  id         String   @id @default(cuid())
  nom        String
  type       String   // Club | Academie | Sponsor | Partenaire
  rccm       String?
  nif        String?
  email      String
  telephone  String
  ville      String
  devis      Devis[]
  factures   Facture[]
  projets    Projet[]
}

// ─── DEVIS ───
model Devis {
  id          String  @id @default(cuid())
  numero      String  @unique // DEV-2026-001
  clientId    String
  client      Client  @relation(fields:[clientId], references:[id])
  lignes      Json    // [{prestationId, quantite, prixUnit, total}]
  montantHT   Float
  statut      DevisStatut @default(EN_ATTENTE)
  pdfUrl      String?
  facture     Facture?
}

// ─── ÉNUMÉRATIONS ───
enum Role          { ADMIN MANAGER COMMERCIAL COACH COMPTABLE }
enum Niveau        { AMATEUR SEMI_PRO PRO }
enum DevisStatut   { EN_ATTENTE VALIDE REFUSE CONVERTI }
enum FactureStatut { IMPAYEE ACOMPTE_PERCU PARTIELLE PAYEE }
enum ProjetStatut  { TODO EN_COURS EN_ATTENTE TERMINE }
enum ContratStatut { EN_PREPARATION SIGNE EN_COURS EXPIRE }
```

> Compléter avec `Facture`, `Reglement`, `Projet`, `Tache`, `Jalon`, `Contrat`, `Prestation`, `Activite`, `Settings` selon les modules (mêmes conventions).

---

## 8. Endpoints API critiques

```
Auth       POST /auth/login   POST /auth/register   GET /auth/me   POST /auth/refresh
Athlètes   GET /athletes   POST /athletes   GET /athletes/:id   PUT /athletes/:id
Clients    GET /clients   POST /clients   GET /clients/:id   GET /clients/:id/timeline
Devis      GET /devis   POST /devis   GET /devis/:id/pdf   POST /devis/:id/convert
Factures   GET /factures   POST /factures   PATCH /factures/:id/paiement   GET /factures/:id/pdf
Projets    GET /projets   POST /projets   GET /projets/:id/kanban   PATCH /taches/:id/move
Contrats   POST /contrats/generate   GET /contrats/:id   POST /contrats/:id/sign   GET /contrats/:id/pdf
Dashboard  GET /dashboard/kpis   GET /dashboard/ca   GET /dashboard/pipeline   GET /dashboard/activites
Paiement   POST /reglements/initiate   GET /reglements/status/:orderNumber   POST /webhooks/flexpay
```

---

## 9. Auth + RBAC (5 rôles)

JWT (access 15 min + refresh 7 j en cookie HttpOnly). Le token porte `userId`, `role`, `agenceId`. Middleware `checkRole(roles[])` → 403 si non autorisé.

Matrice (✅ complet · 👁 lecture seule · ❌ aucun accès) :

| Module | Admin | Manager | Commercial | Coach | Comptable |
|---|---|---|---|---|---|
| Utilisateurs | ✅ | 👁 | ❌ | ❌ | ❌ |
| Athlètes | ✅ | ✅ | 👁 | ✅ | 👁 |
| Clients | ✅ | ✅ | ✅ | 👁 | 👁 |
| Devis / Factures | ✅ | ✅ | ✅ | ❌ | ✅ |
| Projets / Tâches | ✅ | ✅ | 👁 | ✅ | 👁 |
| Contrats | ✅ | ✅ | ❌ | ❌ | 👁 |
| Règlements | ✅ | ✅ | ❌ | ❌ | ✅ |
| Paramètres | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 10. Mobile Money (FlexPay)

```
POST /reglements/initiate          → appel FlexPay, retourne orderNumber
GET  /reglements/status/:orderNum  → vérifie statut (polling ~2 min côté UI)
POST /webhooks/flexpay             → confirmation, met à jour Facture.statut
```
- Variables d'env : `FLEXPAY_TOKEN`, `FLEXPAY_MERCHANT_CODE`.
- Sandbox : `https://backend.flexpay.cd/api/rest/v1/paymentService`.
- Les paiements peuvent rester « pending » → webhook + polling, UI claire pour l'attente.

---

## 11. Risques RDC & parades

| Risque | Parade |
|---|---|
| Internet instable | PWA + cache Athlètes/Clients en IndexedDB, sync au retour réseau |
| Mobile-first (Android terrain) | Responsive, test Chrome Android, zones ≥44px |
| Coupures de courant | Auto-save formulaires toutes les 30s en localStorage + indicateur |
| Mobile Money instable | Webhook + polling statut, UI d'attente explicite |
| Données sensibles (valeurs, contrats) | Chiffrement au repos, logs d'audit, Comptable en lecture seule |
| Latence internationale | Railway EU-West (Paris) + Cloudflare CDN, React Query pour réduire les requêtes |

---

## 12. Déploiement

- **Railway.app** : Node + PostgreSQL, CI/CD GitHub. `railway up`. ~12 $/mois.
- **Domaine** : `crm.ndembokin.cd`, SSL auto Let's Encrypt, CNAME → Railway.
- **Sauvegardes** : `pg_dump` quotidien + backups Railway, export Google Drive.
- **CDN** : Cloudflare devant Railway (latence Kinshasa −40 %).

### Checklist avant production
- [ ] Variables d'env en prod (pas de `.env` committé)
- [ ] HTTPS forcé + HSTS
- [ ] Rate limiting `/auth/login` (10 req/min)
- [ ] Validation Zod sur tous les inputs API
- [ ] Sauvegardes DB testées
- [ ] Logs structurés (pino)
- [ ] PWA manifest + service worker actif
- [ ] Test Mobile Money en sandbox
- [ ] CORS restreint au domaine prod
- [ ] PDF testé (UTF-8 + logo)
- [ ] Import CSV athlètes/clients testé

---

## 13. Workflow Claude Code — étape par étape

| # | Étape | Durée | Prompt résumé |
|---|---|---|---|
| 01 | Init monorepo | ~30 min | `apps/web` (Next 14 + Tailwind + shadcn), `apps/api` (Fastify + Prisma), `packages/types` |
| 02 | Schéma Prisma + seed | ~45 min | Coller le schéma (§7), `prisma migrate dev`, seed réaliste RDC |
| 03 | Auth + RBAC | ~1 h | JWT access/refresh, middleware `checkRole`, matrice §9, bcrypt |
| 04 | CRUD Athlètes + Clients | ~2 h | Table + drawer + formulaires, **caler sur les `.dc.html`** |
| 05 | Pipeline Devis → Facture | ~3 h | Lignes prestations, numérotation auto, conversion, PDF, paiement |
| 06 | Kanban Projets | ~2 h | `@dnd-kit/core`, 4 colonnes, `PATCH /taches/:id/move`, optimistic |
| 07 | Mobile Money (FlexPay) | ~2 h | initiate + status + webhook (§10) |
| 08 | Déploiement Railway | ~1 h | `railway.toml`, env, Dockerfile, `prisma migrate deploy` |

À chaque écran, ouvrir le `.dc.html` correspondant et **reproduire pixel par pixel** (couleurs §3, espacements, états hover/chargement/vide).

---

## 14. Message d'amorçage à donner à Claude Code

> Copie-colle ceci au démarrage, dans le dossier de ton projet, avec ce dossier `design_handoff_ndembo_kin_crm/` présent :

```
Tu vas construire le CRM "Ndembo Kin Connect" (agence de management sportif, Kinshasa RDC).

Le dossier design_handoff_ndembo_kin_crm/ contient :
- README.md : toutes les specs (stack, schéma Prisma, API, RBAC, tokens de design).
- designs/*.dc.html : les écrans de référence HAUTE-FIDÉLITÉ. Ouvre-les dans un
  navigateur pour voir l'apparence cible EXACTE.

Règle absolue : la source de vérité visuelle, ce sont les fichiers designs/*.dc.html.
Reproduis-les pixel par pixel — couleurs, typographie (Plus Jakarta Sans), espacements,
rayons, ombres, et états (hover, focus, chargement, vide) — avec le stack du README
(Next.js 14 + TailwindCSS + shadcn/ui + Fastify + Prisma + PostgreSQL).

Commence par l'étape 01 du §13 (init monorepo), puis enchaîne. Avant de coder un écran,
ouvre son .dc.html et liste les composants, couleurs et espacements que tu vas reproduire.
N'invente pas de contenu ni d'écrans non présents dans les designs.
```

---

## 15. Inventaire du dossier

```
design_handoff_ndembo_kin_crm/
├── README.md                      ← ce document
└── designs/                       ← références visuelles (ouvrir dans un navigateur)
    ├── support.js                 ← moteur de rendu (requis par les .dc.html)
    ├── assets/logo.png
    ├── Design System.dc.html      ← palette, typo, composants, rayons/ombres
    ├── Login Page.dc.html
    ├── Mot de passe oublié.dc.html
    ├── Dashboard.dc.html
    ├── Liste Athlètes.dc.html
    ├── Fiche Athlète.dc.html
    ├── Formulaire Nouvel Athlète.dc.html
    ├── Formulaire Nouveau Devis.dc.html
    ├── Pipeline Factures.dc.html
    ├── Kanban Projets.dc.html
    └── Paiement Mobile Money.dc.html
```

> **Assets de marque** : le logo est dans `designs/assets/logo.png`. Réutiliser le système de marque existant si la codebase en a déjà un, sinon repartir des tokens du §3.
