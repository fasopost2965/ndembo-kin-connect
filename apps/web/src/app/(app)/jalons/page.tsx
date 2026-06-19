'use client';

import { useEffect, useState } from 'react';
import { jalonsApi, projetsApi } from '@/lib/api';

function MI({ name, size = 16, color }: { name: string; size?: number; color?: string }) {
  return (
    <span
      className="material-icons-outlined select-none leading-none"
      style={{ fontSize: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color }}
    >
      {name}
    </span>
  );
}

type JalonStatut = 'ATTEINT' | 'EN_COURS' | 'A_VENIR';

const JALON_META: Record<JalonStatut, { label: string; bg: string; c: string; dotBg: string; dotIcon: string }> = {
  ATTEINT:  { label: 'Atteint',  bg: '#F0FDF4', c: '#059669', dotBg: '#059669', dotIcon: 'check' },
  EN_COURS: { label: 'En cours', bg: '#EFF6FF', c: '#2563EB', dotBg: '#2563EB', dotIcon: 'pending' },
  A_VENIR:  { label: 'À venir',  bg: '#F1F5F9', c: '#94A3B8', dotBg: '#E2E8F0', dotIcon: '' },
};

const PROJECT_META: Record<string, { icon: string; color: string; bg: string }> = {
  'Transfert J. Mbala':        { icon: 'swap_horiz',    color: '#2563EB', bg: '#EFF6FF' },
  'Tournoi présaison AS Vita': { icon: 'emoji_events',  color: '#B45309', bg: '#FEF9EE' },
  'Partenariat MTN RDC':       { icon: 'handshake',     color: '#059669', bg: '#F0FDF4' },
};

interface JalonItem { id: string; titre: string; date: string; statut: JalonStatut; rawStatut: string }
interface ProjetJalons { nom: string; client: string; jalons: JalonItem[] }

const STATUT_MAP: Record<string, JalonStatut> = {
  termine: 'ATTEINT', en_cours: 'EN_COURS', retard: 'EN_COURS', planifie: 'A_VENIR',
  ATTEINT: 'ATTEINT', EN_ATTENTE: 'A_VENIR', RETARD: 'EN_COURS',
};

function fmtJalonDate(j: any): string {
  const d = j.statut === 'termine' && j.dateReelle ? j.dateReelle : j.datePrevis;
  const label = new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  if (j.statut === 'termine') return label;
  if (j.statut === 'en_cours') return `En cours · échéance ${new Date(j.datePrevis).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
  return `Prévu ${new Date(j.datePrevis).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10,
  fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#0F172A',
  outline: 'none', background: '#fff', boxSizing: 'border-box',
};
const LABEL_STYLE: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5,
};

interface Projet { id: string; objet: string }

export default function JalonsPage() {
  const [filterProjet, setFilterProjet] = useState('');
  const [data, setData] = useState<ProjetJalons[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [form, setForm] = useState({ projetId: '', nom: '', datePrevis: '', statut: 'planifie' });
  const [saving, setSaving] = useState(false);

  // Raw jalon ids for status update
  const [rawJalons, setRawJalons] = useState<any[]>([]);

  function loadData() {
    setLoading(true);
    jalonsApi.list()
      .then(({ data }) => {
        setRawJalons(data || []);
        const groups = new Map<string, ProjetJalons>();
        for (const j of (data || []) as any[]) {
          const nom = j.projet?.objet ?? '—';
          if (!groups.has(nom)) {
            groups.set(nom, { nom, client: j.projet?.client?.nom ?? '—', jalons: [] });
          }
          groups.get(nom)!.jalons.push({
            id: j.id,
            titre: j.nom,
            date: fmtJalonDate(j),
            statut: STATUT_MAP[j.statut] ?? 'A_VENIR',
            rawStatut: j.statut,
          });
        }
        setData([...groups.values()]);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  function openModal() {
    projetsApi.list()
      .then(({ data }) => {
        setProjets((data || []).map((p: any) => ({ id: p.id, objet: p.objet ?? p.titre ?? p.id })));
      })
      .catch(() => setProjets([]));
    setForm({ projetId: '', nom: '', datePrevis: '', statut: 'planifie' });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await jalonsApi.create({
        projetId: form.projetId,
        nom: form.nom,
        datePrevis: form.datePrevis,
        statut: form.statut,
      });
      setShowModal(false);
      loadData();
    } catch {
      alert('Erreur lors de la création du jalon.');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusClick(jalonId: string, currentStatut: string) {
    const nextMap: Record<string, string> = {
      planifie: 'en_cours', EN_ATTENTE: 'en_cours',
      en_cours: 'termine',
      retard: 'termine',
      termine: 'planifie', ATTEINT: 'planifie',
    };
    const next = nextMap[currentStatut] ?? 'planifie';
    try {
      await jalonsApi.update(jalonId, { statut: next });
      loadData();
    } catch {
      alert('Erreur lors de la mise à jour du statut.');
    }
  }

  const totalCount = data.reduce((a, p) => a + p.jalons.length, 0);
  const filtered = filterProjet ? data.filter(p => p.nom === filterProjet) : data;

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', minHeight: '100vh', background: '#F0F2F5', display: 'flex', flexDirection: 'column' }}>

      {/* MODAL */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', width: '100%', maxWidth: 520 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Nouveau jalon</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
                <MI name="close" size={20} color="#94A3B8" />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={LABEL_STYLE}>Projet *</label>
                <div style={{ position: 'relative' }}>
                  <select
                    required
                    value={form.projetId}
                    onChange={e => setForm(f => ({ ...f, projetId: e.target.value }))}
                    style={{ ...INPUT_STYLE, appearance: 'none', paddingRight: 32, cursor: 'pointer' }}
                  >
                    <option value="">Sélectionner un projet…</option>
                    {projets.map(p => <option key={p.id} value={p.id}>{p.objet}</option>)}
                  </select>
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'inline-flex' }}>
                    <MI name="expand_more" size={15} color="#94A3B8" />
                  </span>
                </div>
              </div>
              <div>
                <label style={LABEL_STYLE}>Nom du jalon *</label>
                <input
                  required
                  value={form.nom}
                  onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Ex: Signature du contrat"
                  style={INPUT_STYLE}
                  onFocus={e => { e.currentTarget.style.borderColor = '#3A6B84'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(58,107,132,0.08)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={LABEL_STYLE}>Date prévisionnelle *</label>
                  <input
                    required
                    type="date"
                    value={form.datePrevis}
                    onChange={e => setForm(f => ({ ...f, datePrevis: e.target.value }))}
                    style={INPUT_STYLE}
                    onFocus={e => { e.currentTarget.style.borderColor = '#3A6B84'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(58,107,132,0.08)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Statut</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={form.statut}
                      onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}
                      style={{ ...INPUT_STYLE, appearance: 'none', paddingRight: 32, cursor: 'pointer' }}
                    >
                      <option value="planifie">Planifié</option>
                      <option value="en_cours">En cours</option>
                      <option value="termine">Terminé</option>
                      <option value="retard">En retard</option>
                    </select>
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'inline-flex' }}>
                      <MI name="expand_more" size={15} color="#94A3B8" />
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 6, borderTop: '1px solid #F1F5F9', marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '10px 20px', background: '#F1F5F9', color: '#475569', fontSize: 13, fontWeight: 600, border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: '10px 24px', background: '#07101A', color: '#FCD116', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 10, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Création…' : 'Créer le jalon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOPBAR */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E8ECF1', padding: '0 28px', display: 'flex', alignItems: 'center', height: 60, gap: 16, flexShrink: 0 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>Jalons</span>
          <span style={{ fontSize: 12, fontWeight: 700, background: '#07101A', color: '#FCD116', padding: '2px 9px', borderRadius: 20 }}>{totalCount}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <select
              value={filterProjet}
              onChange={e => setFilterProjet(e.target.value)}
              style={{ padding: '9px 32px 9px 12px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: '#0F172A', outline: 'none', background: '#F8FAFC', appearance: 'none', cursor: 'pointer', minWidth: 200 }}
            >
              <option value="">Tous les projets</option>
              {data.map(p => <option key={p.nom} value={p.nom}>{p.nom}</option>)}
            </select>
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'inline-flex' }}>
              <MI name="expand_more" size={15} color="#94A3B8" />
            </span>
          </div>
          <button
            onClick={openModal}
            style={{ padding: '9px 18px', background: '#07101A', color: '#FCD116', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#132730')}
            onMouseLeave={e => (e.currentTarget.style.background = '#07101A')}
          >
            <MI name="add" size={16} color="#FCD116" />
            Nouveau jalon
          </button>
        </div>
      </div>

      {/* PROJECTS */}
      <div style={{ padding: '22px 28px 32px', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        {loading ? (
          <div style={{ padding: '56px 20px', textAlign: 'center', color: '#94A3B8', fontSize: 13, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16 }}>Chargement…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '56px 20px', textAlign: 'center', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16 }}>
            <MI name="flag" size={42} color="#CBD5E1" />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginTop: 10 }}>Aucun jalon</div>
            <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Les jalons des projets apparaîtront ici.</div>
          </div>
        ) : filtered.map(p => {
          const meta = PROJECT_META[p.nom] ?? { icon: 'flag', color: '#3A6B84', bg: '#EFF6FF' };
          const done = p.jalons.filter(j => j.statut === 'ATTEINT').length;
          const pct = Math.round(done / p.jalons.length * 100);

          return (
            <div key={p.nom} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              {/* Project header */}
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MI name={meta.icon} size={20} color={meta.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{p.nom}</div>
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 1 }}>{p.client} · {done}/{p.jalons.length} jalons atteints</div>
                </div>
                <div style={{ width: 140 }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: meta.color }}>{pct}%</span>
                  </div>
                  <div style={{ height: 7, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: meta.color, borderRadius: 4 }} />
                  </div>
                </div>
              </div>

              {/* Jalons timeline */}
              <div style={{ padding: '18px 24px' }}>
                <div style={{ position: 'relative', paddingLeft: 26 }}>
                  <div style={{ position: 'absolute', left: 9, top: 6, bottom: 6, width: 2, background: '#E8ECF1' }} />
                  {p.jalons.map((j, ji) => {
                    const jm = JALON_META[j.statut];
                    return (
                      <div key={ji} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                        {/* Timeline dot */}
                        <div style={{ position: 'absolute', left: -26, width: 20, height: 20, borderRadius: '50%', background: jm.dotBg, border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 0 0 2px ${jm.dotBg}` }}>
                          {jm.dotIcon && <MI name={jm.dotIcon} size={12} color="#fff" />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: j.statut === 'A_VENIR' ? '#94A3B8' : '#334155' }}>{j.titre}</div>
                          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 1 }}>{j.date}</div>
                        </div>
                        <span
                          title="Cliquer pour changer le statut"
                          onClick={() => handleStatusClick(j.id, j.rawStatut)}
                          style={{ fontSize: 10, fontWeight: 700, background: jm.bg, color: jm.c, padding: '3px 10px', borderRadius: 20, display: 'inline-block', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
                        >
                          {jm.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
