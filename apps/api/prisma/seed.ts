import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Ndembo Kin Connect CRM…');

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminPw = await bcrypt.hash('Admin2026!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ndembokin.cd' },
    update: {},
    create: { email: 'admin@ndembokin.cd', password: adminPw, name: 'Admin NKC', role: 'ADMIN' },
  });

  const managerPw = await bcrypt.hash('Manager2026!', 12);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@ndembokin.cd' },
    update: {},
    create: { email: 'manager@ndembokin.cd', password: managerPw, name: 'Jean-Pierre Mukeba', role: 'MANAGER' },
  });

  await prisma.user.upsert({
    where: { email: 'commercial@ndembokin.cd' },
    update: {},
    create: {
      email: 'commercial@ndembokin.cd',
      password: await bcrypt.hash('Commercial2026!', 12),
      name: 'Marie Kabila', role: 'COMMERCIAL',
    },
  });

  // ── Séquences ──────────────────────────────────────────────────────────────
  for (const [type, prefixe] of [['DEVIS','DEV'],['FACTURE','FACT'],['PROJET','PROJ'],['CONTRAT','CONT']] as const) {
    await prisma.sequence.upsert({
      where: { type },
      update: {},
      create: { type, prefixe, annee: 2026, valeur: 0 },
    });
  }

  // ── Paramètres par défaut ──────────────────────────────────────────────────
  const defaultSettings = [
    { key: 'agence_nom', value: 'Ndembo Kin Connect' },
    { key: 'agence_email', value: 'contact@ndembokin.cd' },
    { key: 'agence_telephone', value: '+243 81 234 5678' },
    { key: 'agence_adresse', value: 'Avenue du Commerce, Kinshasa, RDC' },
    { key: 'devise', value: 'USD' },
    { key: 'tva_taux', value: '16' },
  ];
  for (const s of defaultSettings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: {}, create: s });
  }

  // ── Athlètes ───────────────────────────────────────────────────────────────
  const athletes = await Promise.all([
    prisma.athlete.upsert({
      where: { id: 'athlete-001' },
      update: {},
      create: {
        id: 'athlete-001', nom: 'Lukaku', prenom: 'Joël', sport: 'football',
        poste: 'Attaquant', niveau: 'SEMI_PRO', clubActuel: 'AS Vita Club',
        valeurMarchande: 150000, nationalite: 'RDC', statut: 'Actif',
        priorityScouting: 'HAUTE',
      },
    }),
    prisma.athlete.upsert({
      where: { id: 'athlete-002' },
      update: {},
      create: {
        id: 'athlete-002', nom: 'Mbuyi', prenom: 'Christian', sport: 'basketball',
        poste: 'Meneur', niveau: 'PRO', clubActuel: 'BBC Kinshasa',
        valeurMarchande: 80000, nationalite: 'RDC', statut: 'Actif',
        priorityScouting: 'NORMALE',
      },
    }),
    prisma.athlete.upsert({
      where: { id: 'athlete-003' },
      update: {},
      create: {
        id: 'athlete-003', nom: 'Kabongo', prenom: 'David', sport: 'football',
        poste: 'Milieu central', niveau: 'SEMI_PRO', clubActuel: 'TP Mazembe',
        valeurMarchande: 200000, nationalite: 'RDC', statut: 'Actif',
        priorityScouting: 'HAUTE',
      },
    }),
    prisma.athlete.upsert({
      where: { id: 'athlete-004' },
      update: {},
      create: {
        id: 'athlete-004', nom: 'Nsimba', prenom: 'Grace', sport: 'athletisme',
        poste: 'Sprint 100m', niveau: 'AMATEUR', nationalite: 'RDC', statut: 'Actif',
        priorityScouting: 'NORMALE',
      },
    }),
    prisma.athlete.upsert({
      where: { id: 'athlete-005' },
      update: {},
      create: {
        id: 'athlete-005', nom: 'Tshisekedi', prenom: 'Patrick', sport: 'football',
        poste: 'Gardien', niveau: 'PRO', clubActuel: 'DC Motema Pembe',
        valeurMarchande: 120000, nationalite: 'RDC', statut: 'Actif',
        priorityScouting: 'BASSE',
      },
    }),
  ]);

  // ── Clients ────────────────────────────────────────────────────────────────
  const clients = await Promise.all([
    prisma.client.upsert({
      where: { id: 'client-001' },
      update: {},
      create: {
        id: 'client-001', nom: 'AS Vita Club', type: 'Club',
        email: 'contact@asvita.cd', telephone: '+243 81 111 2222',
        ville: 'Kinshasa', contactNom: 'Directeur Sportif',
      },
    }),
    prisma.client.upsert({
      where: { id: 'client-002' },
      update: {},
      create: {
        id: 'client-002', nom: 'MTN Congo', type: 'Sponsor',
        email: 'sponsoring@mtn.cd', telephone: '+243 81 333 4444',
        ville: 'Kinshasa', montantSponsorisation: 50000,
        contactNom: 'Directeur Marketing',
      },
    }),
    prisma.client.upsert({
      where: { id: 'client-003' },
      update: {},
      create: {
        id: 'client-003', nom: 'Académie Football Kinshasa', type: 'Academie',
        email: 'direction@afk.cd', telephone: '+243 81 555 6666',
        ville: 'Kinshasa', contactNom: 'Directeur Académie',
      },
    }),
    prisma.client.upsert({
      where: { id: 'client-004' },
      update: {},
      create: {
        id: 'client-004', nom: 'TP Mazembe', type: 'Club',
        email: 'secretariat@tpmazembe.cd', telephone: '+243 99 777 8888',
        ville: 'Lubumbashi', contactNom: 'Secrétaire Général',
      },
    }),
    prisma.client.upsert({
      where: { id: 'client-005' },
      update: {},
      create: {
        id: 'client-005', nom: 'Airtel Congo', type: 'Sponsor',
        email: 'partenariat@airtel.cd', telephone: '+243 99 999 0000',
        ville: 'Kinshasa', montantSponsorisation: 30000,
        contactNom: 'Responsable Partenariats',
      },
    }),
  ]);

  // ── Prestations ────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.prestation.upsert({
      where: { id: 'prest-001' },
      update: {},
      create: {
        id: 'prest-001', nom: 'Gestion de carrière annuelle', type: 'Gestion_carriere',
        prixBase: 12000, dureeEstimee: '12 mois',
      },
    }),
    prisma.prestation.upsert({
      where: { id: 'prest-002' },
      update: {},
      create: {
        id: 'prest-002', nom: 'Camp de scouting (5 jours)', type: 'Camp',
        prixBase: 3500, dureeEstimee: '5 jours',
      },
    }),
    prisma.prestation.upsert({
      where: { id: 'prest-003' },
      update: {},
      create: {
        id: 'prest-003', nom: 'Conseil en recrutement', type: 'Conseil',
        prixBase: 2000, dureeEstimee: '1 mois',
      },
    }),
    prisma.prestation.upsert({
      where: { id: 'prest-004' },
      update: {},
      create: {
        id: 'prest-004', nom: 'Stage d\'intégration club', type: 'Stage',
        prixBase: 5000, dureeEstimee: '3 semaines',
      },
    }),
  ]);

  // ── Devis ──────────────────────────────────────────────────────────────────
  const devis1 = await prisma.devis.upsert({
    where: { numero: 'DEV-2026-001' },
    update: {},
    create: {
      numero: 'DEV-2026-001', clientId: clients[0].id,
      lignes: [
        { designation: 'Gestion de carrière annuelle', quantite: 1, prixUnit: 12000, total: 12000 },
        { designation: 'Camp de scouting', quantite: 2, prixUnit: 3500, total: 7000 },
      ],
      montantHT: 19000, tva: 16, montantTTC: 22040, statut: 'VALIDE',
    },
  });

  await prisma.devis.upsert({
    where: { numero: 'DEV-2026-002' },
    update: {},
    create: {
      numero: 'DEV-2026-002', clientId: clients[1].id,
      lignes: [{ designation: 'Conseil en recrutement', quantite: 3, prixUnit: 2000, total: 6000 }],
      montantHT: 6000, tva: 16, montantTTC: 6960, statut: 'EN_ATTENTE',
    },
  });

  await prisma.devis.upsert({
    where: { numero: 'DEV-2026-003' },
    update: {},
    create: {
      numero: 'DEV-2026-003', clientId: clients[2].id,
      lignes: [{ designation: 'Stage d\'intégration club', quantite: 1, prixUnit: 5000, total: 5000 }],
      montantHT: 5000, tva: 16, montantTTC: 5800, statut: 'EN_ATTENTE',
    },
  });

  await prisma.devis.upsert({
    where: { numero: 'DEV-2026-004' },
    update: {},
    create: {
      numero: 'DEV-2026-004', clientId: clients[3].id,
      lignes: [{ designation: 'Gestion de carrière (6 mois)', quantite: 1, prixUnit: 7000, total: 7000 }],
      montantHT: 7000, tva: 16, montantTTC: 8120, statut: 'REFUSE',
    },
  });

  // ── Facture (depuis devis-001 converti) ────────────────────────────────────
  await prisma.devis.update({ where: { numero: 'DEV-2026-001' }, data: { statut: 'CONVERTI' } });

  const facture = await prisma.facture.upsert({
    where: { numero: 'FACT-2026-001' },
    update: {},
    create: {
      numero: 'FACT-2026-001', clientId: clients[0].id, devisId: devis1.id,
      lignes: [
        { designation: 'Gestion de carrière annuelle', quantite: 1, prixUnit: 12000, total: 12000 },
        { designation: 'Camp de scouting', quantite: 2, prixUnit: 3500, total: 7000 },
      ],
      montantHT: 19000, tva: 16, montantTTC: 22040,
      acomptePercu: 11020, statutPaiement: 'PARTIELLE',
    },
  });

  // ── Séquences — mise à jour des compteurs ─────────────────────────────────
  await prisma.sequence.updateMany({ where: { type: 'DEVIS' }, data: { valeur: 4 } });
  await prisma.sequence.updateMany({ where: { type: 'FACTURE' }, data: { valeur: 1 } });

  console.log('✅ Seed terminé avec succès');
  console.log('');
  console.log('Comptes créés :');
  console.log('  admin@ndembokin.cd       / Admin2026!     (ADMIN)');
  console.log('  manager@ndembokin.cd     / Manager2026!   (MANAGER)');
  console.log('  commercial@ndembokin.cd  / Commercial2026! (COMMERCIAL)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
