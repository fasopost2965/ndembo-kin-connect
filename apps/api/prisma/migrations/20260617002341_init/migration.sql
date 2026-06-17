-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'COMMERCIAL', 'COACH', 'COMPTABLE');

-- CreateEnum
CREATE TYPE "Niveau" AS ENUM ('AMATEUR', 'SEMI_PRO', 'PRO');

-- CreateEnum
CREATE TYPE "DevisStatut" AS ENUM ('EN_ATTENTE', 'VALIDE', 'REFUSE', 'CONVERTI');

-- CreateEnum
CREATE TYPE "FactureStatut" AS ENUM ('IMPAYEE', 'ACOMPTE_PERCU', 'PARTIELLE', 'PAYEE');

-- CreateEnum
CREATE TYPE "ProjetStatut" AS ENUM ('TODO', 'EN_COURS', 'EN_ATTENTE', 'TERMINE');

-- CreateEnum
CREATE TYPE "ContratStatut" AS ENUM ('EN_PREPARATION', 'SIGNE', 'EN_COURS', 'EXPIRE');

-- CreateEnum
CREATE TYPE "MoyenPaiement" AS ENUM ('BANK', 'CARTE', 'MTN_MONEY', 'AIRTEL_MONEY', 'ORANGE_MONEY');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'COMMERCIAL',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "athletes" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "poste" TEXT NOT NULL,
    "niveau" "Niveau" NOT NULL,
    "clubActuel" TEXT,
    "valeurMarchande" DOUBLE PRECISION,
    "nationalite" TEXT NOT NULL DEFAULT 'RDC',
    "dateNaissance" TIMESTAMP(3),
    "telephone" TEXT,
    "email" TEXT,
    "photo" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'Actif',
    "priorityScouting" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athletes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "rccm" TEXT,
    "nif" TEXT,
    "email" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "adresse" TEXT,
    "ville" TEXT NOT NULL,
    "secteurActivite" TEXT,
    "montantSponsorisation" DOUBLE PRECISION,
    "contactNom" TEXT,
    "contactPoste" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prestations" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "prixBase" DOUBLE PRECISION NOT NULL,
    "dureeEstimee" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prestations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devis" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "lignes" JSONB NOT NULL,
    "montantHT" DOUBLE PRECISION NOT NULL,
    "tva" DOUBLE PRECISION NOT NULL DEFAULT 16,
    "montantTTC" DOUBLE PRECISION NOT NULL,
    "statut" "DevisStatut" NOT NULL DEFAULT 'EN_ATTENTE',
    "validiteJours" INTEGER NOT NULL DEFAULT 30,
    "notes" TEXT,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factures" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "devisId" TEXT,
    "lignes" JSONB NOT NULL,
    "montantHT" DOUBLE PRECISION NOT NULL,
    "tva" DOUBLE PRECISION NOT NULL DEFAULT 16,
    "montantTTC" DOUBLE PRECISION NOT NULL,
    "acomptePercu" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "statutPaiement" "FactureStatut" NOT NULL DEFAULT 'IMPAYEE',
    "echeanceDate" TIMESTAMP(3),
    "pdfUrl" TEXT,
    "lienPaiement" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "factures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reglements" (
    "id" TEXT NOT NULL,
    "factureId" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "dateReglement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moyenPaiement" "MoyenPaiement" NOT NULL,
    "reference" TEXT,
    "orderNumber" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'CONFIRME',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reglements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projets" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "factureId" TEXT,
    "objet" TEXT NOT NULL,
    "typeProjet" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "budgetTotal" DOUBLE PRECISION NOT NULL,
    "statut" "ProjetStatut" NOT NULL DEFAULT 'TODO',
    "tauxAvancement" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taches" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "colonne" TEXT NOT NULL DEFAULT 'TODO',
    "position" INTEGER NOT NULL DEFAULT 0,
    "assigneeId" TEXT,
    "dateEcheance" TIMESTAMP(3),
    "priorite" TEXT NOT NULL DEFAULT 'NORMALE',
    "pourcentageAvancement" INTEGER NOT NULL DEFAULT 0,
    "tags" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "taches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jalons" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "datePrevis" TIMESTAMP(3) NOT NULL,
    "dateReelle" TIMESTAMP(3),
    "statut" TEXT NOT NULL DEFAULT 'planifie',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jalons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contrats" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "projetId" TEXT,
    "athleteId" TEXT,
    "typeContrat" TEXT NOT NULL,
    "contenu" JSONB NOT NULL,
    "statut" "ContratStatut" NOT NULL DEFAULT 'EN_PREPARATION',
    "signeParClient" BOOLEAN NOT NULL DEFAULT false,
    "signeParPrestataire" BOOLEAN NOT NULL DEFAULT false,
    "dateSignature" TIMESTAMP(3),
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contrats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activites" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "projetId" TEXT,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "dateActivite" TIMESTAMP(3) NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'PLANIFIE',
    "resultat" TEXT,
    "nextAction" TEXT,
    "dateNextAction" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rapports" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "periodeDebut" TIMESTAMP(3) NOT NULL,
    "periodeFin" TIMESTAMP(3) NOT NULL,
    "donnees" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rapports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sequences" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "prefixe" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "valeur" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sequences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "devis_numero_key" ON "devis"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "factures_numero_key" ON "factures"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "factures_devisId_key" ON "factures"("devisId");

-- CreateIndex
CREATE UNIQUE INDEX "projets_numero_key" ON "projets"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "contrats_numero_key" ON "contrats"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "sequences_type_key" ON "sequences"("type");

-- AddForeignKey
ALTER TABLE "devis" ADD CONSTRAINT "devis_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factures" ADD CONSTRAINT "factures_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factures" ADD CONSTRAINT "factures_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "devis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reglements" ADD CONSTRAINT "reglements_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "factures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projets" ADD CONSTRAINT "projets_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projets" ADD CONSTRAINT "projets_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "factures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taches" ADD CONSTRAINT "taches_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taches" ADD CONSTRAINT "taches_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jalons" ADD CONSTRAINT "jalons_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrats" ADD CONSTRAINT "contrats_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrats" ADD CONSTRAINT "contrats_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrats" ADD CONSTRAINT "contrats_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "athletes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activites" ADD CONSTRAINT "activites_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activites" ADD CONSTRAINT "activites_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activites" ADD CONSTRAINT "activites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapports" ADD CONSTRAINT "rapports_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
