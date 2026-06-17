# Déploiement — Railway.app

Le monorepo se déploie en **deux services Railway** (API + Web) branchés sur une
base **PostgreSQL** Railway. Les deux services pointent sur le **même repo** ; le
*Root Directory* reste la racine du dépôt et chaque service lit son
`railway.toml` :

| Service | Config path            | Dockerfile          | Port |
|---------|------------------------|---------------------|------|
| API     | `apps/api/railway.toml`| `apps/api/Dockerfile`| 3001 |
| Web     | `apps/web/railway.toml`| `apps/web/Dockerfile`| 3000 |

## 1. Base de données
Ajoutez le plugin **PostgreSQL** → Railway fournit `DATABASE_URL`. Référencez-la
dans le service API (`DATABASE_URL = ${{Postgres.DATABASE_URL}}`).

Les migrations s'appliquent **automatiquement au démarrage** de l'API
(`prisma migrate deploy`, voir Dockerfile/`railway.toml`). Pour le premier
déploiement, lancez le seed une fois :
```bash
railway run --service api pnpm --filter @nkc/api db:seed
```

## 2. Variables d'environnement

### Service API
| Variable | Exemple / source | Requis |
|----------|------------------|--------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | ✅ |
| `JWT_SECRET` | chaîne aléatoire ≥ 32 car. | ✅ |
| `FRONTEND_URL` | `https://web-xxxx.up.railway.app` (CORS) | ✅ |
| `API_PUBLIC_URL` | `https://api-xxxx.up.railway.app` (webhook FlexPay) | ✅ |
| `FLEXPAY_TOKEN` | token FlexPay — *vide = mode mock* | ⬜ |
| `FLEXPAY_MERCHANT_CODE` | code marchand FlexPay | ⬜ |
| `FLEXPAY_BASE_URL` | `https://backend.flexpay.cd/api/rest/v1/paymentService` | ⬜ |
| `FLEXPAY_CURRENCY` | `USD` ou `CDF` | ⬜ |

### Service Web
| Variable | Exemple | Requis |
|----------|---------|--------|
| `NEXT_PUBLIC_API_URL` | `https://api-xxxx.up.railway.app` | ✅ |

> `NEXT_PUBLIC_API_URL` est **inliné au build** : Railway le transmet au build
> Docker comme build-arg. Un changement de cette valeur nécessite un rebuild.

## 3. Ordre de déploiement
1. PostgreSQL plugin.
2. Service **API** (renseigner `DATABASE_URL`, `JWT_SECRET`, `API_PUBLIC_URL`,
   `FRONTEND_URL` provisoire). Récupérer son URL publique.
3. Service **Web** (`NEXT_PUBLIC_API_URL` = URL de l'API). Récupérer son URL.
4. Mettre à jour `FRONTEND_URL` sur l'API avec l'URL réelle du Web → redeploy API.
5. Configurer le **webhook FlexPay** sur `${API_PUBLIC_URL}/webhooks/flexpay`.

## Build local des images (test)
```bash
# depuis la racine du repo (contexte = racine)
docker build -f apps/api/Dockerfile -t nkc-api .
docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_API_URL=http://localhost:3001 -t nkc-web .
```

## Checklist pré-prod (rappel du handoff)
- [ ] `DATABASE_URL`, `JWT_SECRET` en variables (pas de `.env` commité)
- [ ] HTTPS forcé (Railway le fait par défaut)
- [ ] Rate-limit `/auth/login` actif (déjà en place : 10/min)
- [ ] Validation Zod sur les inputs (en place)
- [ ] Sauvegardes PostgreSQL configurées
- [ ] Test Mobile Money en sandbox FlexPay
- [ ] CORS restreint à `FRONTEND_URL`
- [ ] PDF (UTF-8 + logo) testé
