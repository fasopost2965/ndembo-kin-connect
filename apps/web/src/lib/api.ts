import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Inject access token from localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
        localStorage.setItem('access_token', data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ accessToken: string; user: { id: string; name: string; email: string; role: string } }>('/auth/login', { email, password }),
  requestPasswordReset: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
  me: () => api.get('/auth/me'),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  kpis: () => api.get('/dashboard/kpis'),
  ca: () => api.get('/dashboard/ca'),
  pipeline: () => api.get('/dashboard/pipeline'),
  activites: () => api.get('/dashboard/activites'),
};

// ── Athletes ──────────────────────────────────────────────────────────────────
export const athletesApi = {
  list: (params?: Record<string, string | number>) => api.get('/athletes', { params }),
  get: (id: string) => api.get(`/athletes/${id}`),
  create: (data: unknown) => api.post('/athletes', data),
  update: (id: string, data: unknown) => api.put(`/athletes/${id}`, data),
  delete: (id: string) => api.delete(`/athletes/${id}`),
};

// ── Clients ───────────────────────────────────────────────────────────────────
export const clientsApi = {
  list: (params?: Record<string, string | number>) => api.get('/clients', { params }),
  get: (id: string) => api.get(`/clients/${id}`),
  timeline: (id: string) => api.get(`/clients/${id}/timeline`),
  create: (data: unknown) => api.post('/clients', data),
  update: (id: string, data: unknown) => api.put(`/clients/${id}`, data),
};

// ── Prestations ───────────────────────────────────────────────────────────────
export const prestationsApi = {
  list: (activesOnly = true) => api.get('/prestations', { params: activesOnly ? { actives: 'true' } : {} }),
};

// ── Devis ─────────────────────────────────────────────────────────────────────
export interface DevisLigneInput { prestationId: string; quantite: number; prixUnit?: number }
export interface DevisCreateInput { clientId: string; lignes: DevisLigneInput[]; tva?: number; notes?: string; validiteJours?: number }

export const devisApi = {
  list: (params?: Record<string, string | number>) => api.get('/devis', { params }),
  get: (id: string) => api.get(`/devis/${id}`),
  create: (data: DevisCreateInput) => api.post('/devis', data),
  updateStatut: (id: string, statut: string) => api.patch(`/devis/${id}/statut`, { statut }),
  convert: (id: string) => api.post(`/devis/${id}/convert`),
  pdf: (id: string) => openPdf(`/devis/${id}/pdf`),
};

// ── Factures ──────────────────────────────────────────────────────────────────
export const facturesApi = {
  list: (params?: Record<string, string | number>) => api.get('/factures', { params }),
  get: (id: string) => api.get(`/factures/${id}`),
  pdf: (id: string) => openPdf(`/factures/${id}/pdf`),
};

/**
 * Fetch a PDF endpoint as a blob (so the bearer token is sent) and open it in a
 * new tab. Falls back to a download if the popup is blocked.
 */
export async function openPdf(path: string): Promise<void> {
  const { data } = await api.get(path, { responseType: 'blob' });
  const url = URL.createObjectURL(data as Blob);
  const win = window.open(url, '_blank');
  if (!win) {
    const a = document.createElement('a');
    a.href = url;
    a.download = path.split('/').slice(-2).join('-') + '.pdf';
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// ── Règlements ────────────────────────────────────────────────────────────────
export interface ReglementInput {
  factureId: string;
  montant: number;
  moyenPaiement: 'BANK' | 'CARTE' | 'MTN_MONEY' | 'AIRTEL_MONEY' | 'ORANGE_MONEY';
  reference?: string;
}
export interface MobileMoneyInput {
  factureId: string;
  montant: number;
  moyenPaiement: 'MTN_MONEY' | 'AIRTEL_MONEY' | 'ORANGE_MONEY';
  phone: string;
}
export const reglementsApi = {
  list: (factureId?: string) => api.get('/reglements', { params: factureId ? { factureId } : {} }),
  create: (data: ReglementInput) => api.post('/reglements', data),
  // FlexPay Mobile Money
  initiate: (data: MobileMoneyInput) =>
    api.post<{ reglementId: string; orderNumber: string; statut: string; mock?: boolean; message?: string }>('/reglements/initiate', data),
  status: (orderNumber: string) =>
    api.get<{ orderNumber: string; statut: 'PENDING' | 'CONFIRME' | 'ECHEC' }>(`/reglements/status/${encodeURIComponent(orderNumber)}`),
};

// ── Projets ───────────────────────────────────────────────────────────────────
export const projetsApi = {
  list: (params?: Record<string, string | number>) => api.get('/projets', { params }),
  get: (id: string) => api.get(`/projets/${id}`),
  kanban: (id: string) => api.get(`/projets/${id}/kanban`),
  create: (data: unknown) => api.post('/projets', data),
};

// ── Tâches (Kanban) ─────────────────────────────────────────────────────────────
export type Colonne = 'TODO' | 'EN_COURS' | 'EN_ATTENTE' | 'TERMINE';
export const tachesApi = {
  list: (params?: { projetId?: string; assigneeId?: string }) => api.get('/taches', { params }),
  create: (data: { projetId: string; titre: string; colonne?: Colonne; priorite?: string }) =>
    api.post('/taches', data),
  move: (id: string, data: { colonne: Colonne; position: number }) =>
    api.patch(`/taches/${id}/move`, data),
  remove: (id: string) => api.delete(`/taches/${id}`),
};

// ── Jalons ──────────────────────────────────────────────────────────────────────
export const jalonsApi = {
  list: (projetId?: string) => api.get('/jalons', { params: projetId ? { projetId } : {} }),
  create: (data: { projetId: string; nom: string; datePrevis: string; statut?: string }) =>
    api.post('/jalons', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/jalons/${id}`, data),
  remove: (id: string) => api.delete(`/jalons/${id}`),
};

// ── Activités (journal CRM) ──────────────────────────────────────────────────────
export const activitesApi = {
  list: (params?: { clientId?: string; projetId?: string }) => api.get('/activites', { params }),
  create: (data: Record<string, unknown>) => api.post('/activites', data),
  remove: (id: string) => api.delete(`/activites/${id}`),
};

// ── Rapports & KPIs ──────────────────────────────────────────────────────────────
export const rapportsApi = {
  synthese: () => api.get('/rapports/synthese'),
};

// ── Contrats ──────────────────────────────────────────────────────────────────
export const contratsApi = {
  list: (params?: Record<string, string | number>) => api.get('/contrats', { params }),
  get: (id: string) => api.get(`/contrats/${id}`),
  generate: (data: unknown) => api.post('/contrats/generate', data),
  sign: (id: string, partie: 'CLIENT' | 'PRESTATAIRE') => api.post(`/contrats/${id}/sign`, { partie }),
  pdf: (id: string) => api.get(`/contrats/${id}/pdf`),
};

// ── Settings ──────────────────────────────────────────────────────────────────
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data: Record<string, string>) => api.put('/settings', data),
  users: () => api.get('/settings/users'),
  updateUser: (id: string, data: unknown) => api.patch(`/settings/users/${id}`, data),
};
