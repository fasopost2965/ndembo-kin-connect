'use client';

import { useCallback, useEffect, useState } from 'react';
import { projetsApi, clientsApi } from '@/lib/api';
import { KanbanBoard, type KanbanData } from './KanbanBoard';

function MI({ name, size = 16, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  return (
    <span className="material-icons-outlined select-none leading-none"
      style={{ fontSize: size, display: 'inline-flex', alignItems: 'center', ...style }}>
      {name}
    </span>
  );
}

interface ProjetLite { id: string; numero: string; objet: string; client?: { nom: string } }
interface ClientLite { id: string; nom: string }

const EMPTY: KanbanData = { TODO: [], EN_COURS: [], EN_ATTENTE: [], TERMINE: [] };

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '10px 13px', border: '1.5px solid #E2E8F0', borderRadius: 9,
  fontSize: 14, fontFamily: 'inherit', color: '#0F172A', outline: 'none', background: '#F8FAFC',
  boxSizing: 'border-box',
};

export default function ProjetsPage() {
  const [projets, setProjets] = useState<ProjetLite[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [data, setData] = useState<KanbanData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [form, setForm] = useState({ clientId: '', objet: '', dateDebut: '', dateFin: '', typeProjet: 'gestion_carriere', budgetTotal: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientForm, setNewClientForm] = useState({ nom: '', email: '', telephone: '' });
  const [savingClient, setSavingClient] = useState(false);

  useEffect(() => {
    projetsApi.list({ limit: 100 }).then((r) => {
      const list: ProjetLite[] = r.data.data;
      setProjets(list);
      if (list.length) setSelectedId(list[0].id);
      else setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (showModal && clients.length === 0) {
      clientsApi.list({ limit: 200 }).then(r => {
        setClients(r.data.data || r.data || []);
      }).catch(() => {});
    }
  }, [showModal]);

  const loadKanban = useCallback(async (id: string) => {
    setLoading(true);
    setData(null);
    try {
      const { data } = await projetsApi.kanban(id);
      setData({ ...EMPTY, ...data });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (selectedId) loadKanban(selectedId); }, [selectedId, loadKanban]);

  const current = projets.find((p) => p.id === selectedId);
  const totalTaches = data ? Object.values(data).flat().length : 0;
  const terminees = data?.TERMINE?.length ?? 0;

  const handleSubmit = async () => {
    if (!form.clientId) { setFormError('Veuillez sélectionner un client.'); return; }
    if (!form.objet.trim()) { setFormError("Veuillez saisir l'objet du projet."); return; }
    setFormError('');
    setSubmitting(true);
    try {
      await projetsApi.create({
        clientId: form.clientId,
        objet: form.objet,
        typeProjet: form.typeProjet,
        budgetTotal: form.budgetTotal ? Number(form.budgetTotal) : 0,
        ...(form.dateDebut && { dateDebut: form.dateDebut }),
        ...(form.dateFin && { dateFin: form.dateFin }),
      });
      setShowModal(false);
      setForm({ clientId: '', objet: '', dateDebut: '', dateFin: '', typeProjet: 'gestion_carriere', budgetTotal: '' });
      // Reload list
      const r = await projetsApi.list({ limit: 100 });
      const list: ProjetLite[] = r.data.data;
      setProjets(list);
      if (list.length) setSelectedId(list[0].id);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.response?.data?.error || 'Erreur lors de la création du projet.';
      setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#F0F2F5' }}>

      {/* ── Topbar ── */}
      <div
        className="flex items-center gap-4 shrink-0"
        style={{ background: '#fff', borderBottom: '1px solid #E8ECF1', height: 60, padding: '0 28px' }}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-[18px] font-extrabold tracking-[-0.3px]" style={{ color: '#0F172A' }}>Projets</span>
          <span className="text-[12px] font-bold px-2.5 py-0.5" style={{ background: '#07101A', color: '#FCD116', borderRadius: 20 }}>
            Kanban
          </span>
        </div>

        {/* Project selector */}
        {projets.length > 0 && (
          <div
            className="flex items-center gap-2 px-3 rounded-[9px]"
            style={{ background: '#F1F5F9', border: '1px solid #E2E8F0', height: 36 }}
          >
            <MI name="folder_open" size={14} style={{ color: '#94A3B8' }} />
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              style={{
                background: 'none', border: 'none', outline: 'none',
                fontSize: 13, color: '#334155', cursor: 'pointer', minWidth: 200,
              }}
            >
              {projets.map(p => (
                <option key={p.id} value={p.id}>{p.numero} — {p.objet}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex-1" />

        {/* Stats mini */}
        {data && (
          <div className="flex items-center gap-4 text-[12px]" style={{ color: '#94A3B8' }}>
            <span>
              <strong style={{ color: '#0F172A', fontWeight: 700 }}>{totalTaches}</strong> tâches
            </span>
            <span>
              <strong style={{ color: '#10B981', fontWeight: 700 }}>{terminees}</strong> terminées
            </span>
          </div>
        )}

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 font-bold text-[13px] rounded-[9px]"
          style={{ height: 36, background: '#07101A', color: '#FCD116', border: 'none', cursor: 'pointer' }}
        >
          <MI name="add" size={15} style={{ color: '#FCD116' }} />
          Nouveau projet
        </button>
      </div>

      {/* ── Kanban content ── */}
      <div className="flex-1 p-6 overflow-x-auto">
        {loading ? (
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[420px] animate-pulse rounded-2xl" style={{ background: '#fff', border: '1px solid #E2E8F0' }} />
            ))}
          </div>
        ) : !selectedId ? (
          <div
            className="flex flex-col items-center justify-center rounded-2xl py-20 text-center"
            style={{ background: '#fff', border: '1px dashed #E2E8F0' }}
          >
            <MI name="dashboard" size={48} style={{ color: '#E2E8F0', marginBottom: 12 }} />
            <div className="text-[15px] font-semibold" style={{ color: '#CBD5E1' }}>Aucun projet trouvé</div>
            <div className="text-[13px] mt-1" style={{ color: '#94A3B8' }}>
              Convertissez une facture en projet pour démarrer un Kanban.
            </div>
          </div>
        ) : data ? (
          <KanbanBoard key={selectedId} projetId={selectedId} initial={data} />
        ) : null}
      </div>

      {/* ── Modal Nouveau projet ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(7,16,26,0.55)', backdropFilter: 'blur(3px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            style={{
              background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
              width: '100%', maxWidth: 480, padding: '28px 28px 24px',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between" style={{ marginBottom: 22 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#0F172A' }}>Nouveau projet</div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Créer un projet Kanban lié à un client</div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <MI name="close" size={16} style={{ color: '#64748B' }} />
              </button>
            </div>

            {/* Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Client */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                  Client <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={form.clientId}
                    onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                    style={{ ...INPUT_STYLE, appearance: 'none', paddingRight: 36, cursor: 'pointer' }}
                  >
                    <option value="">Sélectionner un client…</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </select>
                  <MI name="expand_more" size={16} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
                </div>
                {!showNewClient ? (
                  <button type="button" onClick={() => setShowNewClient(true)} style={{ marginTop: 6, fontSize: 12, color: '#3A6B84', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MI name="add" size={14} style={{ color: '#3A6B84' }} /> Nouveau client
                  </button>
                ) : (
                  <div style={{ marginTop: 8, padding: 12, background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Créer un client</div>
                    <input placeholder="Nom / Société *" value={newClientForm.nom} onChange={e => setNewClientForm(f => ({ ...f, nom: e.target.value }))} style={{ ...INPUT_STYLE, padding: '7px 10px', fontSize: 12 }} />
                    <input placeholder="Email" value={newClientForm.email} onChange={e => setNewClientForm(f => ({ ...f, email: e.target.value }))} style={{ ...INPUT_STYLE, padding: '7px 10px', fontSize: 12 }} />
                    <input placeholder="Téléphone" value={newClientForm.telephone} onChange={e => setNewClientForm(f => ({ ...f, telephone: e.target.value }))} style={{ ...INPUT_STYLE, padding: '7px 10px', fontSize: 12 }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" disabled={savingClient || !newClientForm.nom.trim()} onClick={async () => {
                        setSavingClient(true);
                        try {
                          const { data: c } = await clientsApi.create({ nom: newClientForm.nom, email: newClientForm.email || undefined, telephone: newClientForm.telephone || undefined, type: 'ENTREPRISE' });
                          const r = await clientsApi.list({ limit: 200 });
                          setClients(r.data.data || r.data || []);
                          setForm(f => ({ ...f, clientId: c.id }));
                          setShowNewClient(false);
                          setNewClientForm({ nom: '', email: '', telephone: '' });
                        } catch { setFormError('Erreur création client.'); }
                        finally { setSavingClient(false); }
                      }} style={{ padding: '6px 14px', background: '#07101A', color: '#FCD116', fontSize: 11, fontWeight: 700, border: 'none', borderRadius: 7, cursor: 'pointer' }}>
                        {savingClient ? 'Création…' : 'Créer'}
                      </button>
                      <button type="button" onClick={() => setShowNewClient(false)} style={{ padding: '6px 14px', background: '#F1F5F9', color: '#64748B', fontSize: 11, fontWeight: 600, border: '1px solid #E2E8F0', borderRadius: 7, cursor: 'pointer' }}>Annuler</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Objet */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                  Objet / Titre <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex : Scouting Europe — Été 2026"
                  value={form.objet}
                  onChange={e => setForm(f => ({ ...f, objet: e.target.value }))}
                  style={INPUT_STYLE}
                />
              </div>

              {/* Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Date début</label>
                  <input
                    type="date"
                    value={form.dateDebut}
                    onChange={e => setForm(f => ({ ...f, dateDebut: e.target.value }))}
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Date fin</label>
                  <input
                    type="date"
                    value={form.dateFin}
                    onChange={e => setForm(f => ({ ...f, dateFin: e.target.value }))}
                    style={INPUT_STYLE}
                  />
                </div>
              </div>

              {/* Type projet */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Type de projet</label>
                <div style={{ position: 'relative' }}>
                  <select value={form.typeProjet} onChange={e => setForm(f => ({ ...f, typeProjet: e.target.value }))} style={{ ...INPUT_STYLE, appearance: 'none', paddingRight: 36, cursor: 'pointer' }}>
                    <option value="gestion_carriere">Gestion de carrière</option>
                    <option value="camp">Camp / Formation</option>
                    <option value="stage">Stage</option>
                  </select>
                  <MI name="expand_more" size={16} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Budget */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Budget (USD)</label>
                <input type="number" min="0" placeholder="Ex : 5000" value={form.budgetTotal} onChange={e => setForm(f => ({ ...f, budgetTotal: e.target.value }))} style={INPUT_STYLE} />
              </div>

              {/* Error */}
              {formError && (<parameter>
</invoke>
                <div style={{ fontSize: 13, color: '#EF4444', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '9px 13px' }}>
                  {formError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ padding: '10px 18px', background: '#F1F5F9', color: '#475569', fontSize: 13, fontWeight: 600, border: '1px solid #E2E8F0', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{ padding: '10px 22px', background: '#07101A', color: '#FCD116', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 9, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? 'Création…' : 'Créer le projet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
