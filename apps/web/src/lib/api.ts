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
export interface DevisCreateInput { clientId: string; lignes: DevisLigneInput[]; tva?: number; notes?: string }

export const devisApi = {
  list: (params?: Record<string, string | number>) => api.get('/devis', { params }),
  get: (id: string) => api.get(`/devis/${id}`),
  create: (data: DevisCreateInput) => api.post('/devis', data),
  updateStatut: (id: string, statut: string) => api.patch(`/devis/${id}/statut`, { statut }),
  convert: (id: string) => api.post(`/devis/${id}/convert`),
  pdf: (id: string) => api.get(`/devis/${id}/pdf`),
};

// ── Factures ──────────────────────────────────────────────────────────────────
export const facturesApi = {
  list: (params?: Record<string, string | number>) => api.get('/factures', { params }),
  get: (id: string) => api.get(`/factures/${id}`),
  pdf: (id: string) => api.get(`/factures/${id}/pdf`),
};

// ── Règlements ────────────────────────────────────────────────────────────────
export interface ReglementInput {
  factureId: string;
  montant: number;
  moyenPaiement: 'BANK' | 'CARTE' | 'MTN_MONEY' | 'AIRTEL_MONEY' | 'ORANGE_MONEY';
  reference?: string;
}
export const reglementsApi = {
  list: (factureId?: string) => api.get('/reglements', { params: factureId ? { factureId } : {} }),
  create: (data: ReglementInput) => api.post('/reglements', data),
};

// ── Projets ───────────────────────────────────────────────────────────────────
export const projetsApi = {
  list: (params?: Record<string, string | number>) => api.get('/projets', { params }),
  get: (id: string) => api.get(`/projets/${id}`),
  kanban: (id: string) => api.get(`/projets/${id}/kanban`),
  create: (data: unknown) => api.post('/projets', data),
  moveTask: (taskId: string, data: { colonne: string; position: number }) =>
    api.patch(`/projets/taches/${taskId}/move`, data),
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
