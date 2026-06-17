// ─── Enums ────────────────────────────────────────────────────────────────────

export type Role = 'ADMIN' | 'MANAGER' | 'COMMERCIAL' | 'COACH' | 'COMPTABLE';

export type Niveau = 'AMATEUR' | 'SEMI_PRO' | 'PRO';

export type DevisStatut = 'EN_ATTENTE' | 'VALIDE' | 'REFUSE' | 'CONVERTI';

export type FactureStatut = 'IMPAYEE' | 'ACOMPTE_PERCU' | 'PARTIELLE' | 'PAYEE';

export type ProjetStatut = 'TODO' | 'EN_COURS' | 'EN_ATTENTE' | 'TERMINE';

export type ContratStatut = 'EN_PREPARATION' | 'SIGNE' | 'EN_COURS' | 'EXPIRE';

export type TypeActivite = 'APPEL' | 'RENCONTRE' | 'EMAIL';

export type MoyenPaiement = 'BANK' | 'CARTE' | 'MTN_MONEY' | 'AIRTEL_MONEY' | 'ORANGE_MONEY';

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface JwtPayload {
  userId: string;
  role: Role;
  agenceId: string;
}

// ─── Athlete ──────────────────────────────────────────────────────────────────

export interface Athlete {
  id: string;
  nom: string;
  sport: string;
  poste: string;
  niveau: Niveau;
  clubActuel?: string;
  valeurMarchande?: number;
  nationalite: string;
  statut: string;
  createdAt: string;
}

export type AthleteCreate = Omit<Athlete, 'id' | 'createdAt'>;
export type AthleteUpdate = Partial<AthleteCreate>;

// ─── Client ───────────────────────────────────────────────────────────────────

export interface Client {
  id: string;
  nom: string;
  type: 'Club' | 'Academie' | 'Sponsor' | 'Partenaire';
  rccm?: string;
  nif?: string;
  email: string;
  telephone: string;
  ville: string;
  createdAt: string;
}

export type ClientCreate = Omit<Client, 'id' | 'createdAt'>;
export type ClientUpdate = Partial<ClientCreate>;

// ─── Prestation ───────────────────────────────────────────────────────────────

export interface Prestation {
  id: string;
  nom: string;
  type: 'Conseil' | 'Gestion_carriere' | 'Camp' | 'Stage';
  prixBase: number;
  dureeEstimee?: string;
  isActive: boolean;
}

// ─── Devis ────────────────────────────────────────────────────────────────────

export interface LigneDevis {
  prestationId: string;
  designation: string;
  quantite: number;
  prixUnit: number;
  total: number;
}

export interface Devis {
  id: string;
  numero: string;
  clientId: string;
  client?: Client;
  lignes: LigneDevis[];
  montantHT: number;
  tva: number;
  montantTTC: number;
  statut: DevisStatut;
  pdfUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type DevisCreate = {
  clientId: string;
  lignes: LigneDevis[];
};

// ─── Facture ──────────────────────────────────────────────────────────────────

export interface Facture {
  id: string;
  numero: string;
  clientId: string;
  client?: Client;
  devisId?: string;
  lignes: LigneDevis[];
  montantHT: number;
  tva: number;
  montantTTC: number;
  acomptePercu: number;
  statutPaiement: FactureStatut;
  pdfUrl?: string;
  lienPaiement?: string;
  createdAt: string;
}

// ─── Reglement ────────────────────────────────────────────────────────────────

export interface Reglement {
  id: string;
  factureId: string;
  montant: number;
  dateReglement: string;
  moyenPaiement: MoyenPaiement;
  reference?: string;
  orderNumber?: string;
}

// ─── Projet ───────────────────────────────────────────────────────────────────

export interface Projet {
  id: string;
  numero: string;
  clientId: string;
  client?: Client;
  factureId?: string;
  objet: string;
  typeProjet: 'gestion_carriere' | 'camp' | 'stage';
  dateDebut: string;
  dateFin?: string;
  budgetTotal: number;
  statut: ProjetStatut;
  tauxAvancement: number;
  createdAt: string;
}

// ─── Tache ────────────────────────────────────────────────────────────────────

export interface Tache {
  id: string;
  projetId: string;
  titre: string;
  colonne: 'TODO' | 'EN_COURS' | 'EN_ATTENTE' | 'TERMINE';
  position: number;
  assigneeId?: string;
  assignee?: User;
  dateEcheance?: string;
  priorite: 'BASSE' | 'NORMALE' | 'HAUTE' | 'URGENTE';
  pourcentageAvancement: number;
}

export interface TacheMovePayload {
  colonne: Tache['colonne'];
  position: number;
}

// ─── Jalon ────────────────────────────────────────────────────────────────────

export interface Jalon {
  id: string;
  projetId: string;
  nom: string;
  datePrevis: string;
  dateReelle?: string;
  statut: 'planifie' | 'en_cours' | 'termine' | 'retard';
}

// ─── Contrat ──────────────────────────────────────────────────────────────────

export interface Contrat {
  id: string;
  numero: string;
  clientId: string;
  client?: Client;
  projetId?: string;
  athleteId?: string;
  typeContrat: string;
  contenu: Record<string, string>;
  statut: ContratStatut;
  signeParClient: boolean;
  signeParPrestataire: boolean;
  pdfUrl?: string;
  createdAt: string;
}

// ─── Activite ─────────────────────────────────────────────────────────────────

export interface Activite {
  id: string;
  clientId: string;
  client?: Client;
  userId: string;
  user?: User;
  type: TypeActivite;
  dateActivite: string;
  statut: string;
  resultat?: string;
  nextAction?: string;
  dateNextAction?: string;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardKpis {
  chiffreAffaires: number;
  chiffreAffairesVariation: number;
  pipeline: number;
  pipelineVariation: number;
  athletesActifs: number;
  athletesVariation: number;
  tauxConversion: number;
  tauxConversionVariation: number;
}
