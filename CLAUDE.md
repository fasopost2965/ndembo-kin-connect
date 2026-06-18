# Ndembo Kin Connect CRM — Instructions projet

CRM pour une agence de management sportif à Kinshasa (RDC). Cycle : **Scouting athlètes → Clients → Devis → Factures → Projets → Contrats**. Contexte RDC : offline-first (PWA), Mobile Money (MTN/Airtel/Orange via FlexPay), usage mobile Android prioritaire.

## ⚠️ Source de vérité visuelle

Le dossier **`design_handoff_ndembo_kin_crm/`** contient les références de design haute-fidélité et toutes les specs techniques.

- **`design_handoff_ndembo_kin_crm/README.md`** : stack, schéma Prisma, endpoints API, matrice RBAC, tokens de design (couleurs, typo, rayons, ombres), workflow d'implémentation, déploiement.
- **`design_handoff_ndembo_kin_crm/designs/*.dc.html`** : les 10 écrans de référence + le Design System. **Ouvre-les dans un navigateur** pour voir l'apparence cible EXACTE.

**Règle absolue :** la source de vérité visuelle, ce sont les fichiers `designs/*.dc.html`. On les reproduit **pixel par pixel** — couleurs, typographie (Plus Jakarta Sans), espacements, rayons, ombres, et états (hover, focus, chargement, vide). On n'invente pas de contenu ni d'écrans absents des designs. On n'« améliore » pas ce qui n'a pas été demandé.

Avant de coder ou modifier un écran : ouvre son `.dc.html`, repère couleurs/espacements/composants, puis reproduis-les fidèlement avec le stack du projet.

## Tokens de design essentiels

- **Bleu Drapeau** `#132730` (sidebar, boutons primaires) · **Ardoise** `#3A6B84` (liens, icônes) · **Cyan Connect** `#7CC8E8` (accent principal) · **Or RDC** `#FCD116` (accent secondaire).
- Police : **Plus Jakarta Sans** (400–800), mono **JetBrains Mono** (vues techniques).
- Rayons : 8px (boutons/badges), 10–12px (champs), 16px (cartes). Ombre carte : `0 1px 3px rgba(0,0,0,0.05)`.
- Responsive ≥375px, zones tactiles ≥44px, auto-save formulaires (coupures de courant), états de chargement/vide explicites.

Détails complets et matrice RBAC : voir `design_handoff_ndembo_kin_crm/README.md`.
