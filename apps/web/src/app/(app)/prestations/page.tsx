'use client';

import { useEffect, useState } from 'react';
import { prestationsApi, PrestationInput } from '@/lib/api';

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

const CATS: Record<string, { color: string; bg: string; icon: string }> = {
  Gestion_carriere: { color: '#2563EB', bg: '#EFF6FF', icon: 'badge' },
  Conseil:          { color: '#6D28D9', bg: '#F5F3FF', icon: 'sports' },
  Camp:             { color: '#059669', bg: '#F0FDF4', icon: 'travel_explore' },
  Stage:            { color: '#B45309', bg: '#FEF9EE', icon: 'school' },
};
const CAT_LABEL: Record<string, string> = {
  Gestion_carriere: 'Gestion de carrière',
  Conseil: 'Conseil',
  Camp: 'Camp',
  Stage: 'Stage',
};

const TYPE_OPTIONS: { value: PrestationInput['type']; label: string }[] = [
  { value: 'Conseil', label: 'Conseil' },
  { value: 'Gestion_carriere', label: 'Gestion de carrière' },
  { value: 'Camp', label: 'Camp' },
  { value: 'Stage', label: 'Stage' },
];

interface Prestation {
  id: string;
  nom: string;
  categorie: string;
  prix: number;
  unite: string;
  description: string;
  isActive: boolean;
  // raw fields for edit
  type: string;
  prixBase: number;
  dureeEstimee: string;
}

function fmtPrix(n: number) {
  return '$' + n.toLocaleString('fr-FR');
}

const CAT_FILTER_ACTIVE: React.CSSProperties = {
  padding: '7px 15px', borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 6, border: '1.5px solid transparent',
  background: '#07101A', color: '#FCD116',
};
const CAT_FILTER_IDLE: React.CSSProperties = {
  padding: '7px 15px', borderRadius: 20, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 6, border: '1.5px solid #E2E8F0',
  background: '#fff', color: '#475569',
};

const INPUT_STYLE: React.CSSProperties = {
  width: '100%', padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10,
  fontSize: 13, fontFamily: 'Plus Jakarta Sans, sans-serif', color: '#0F172A',
  outline: 'none', background: '#fff', boxSizing: 'border-box',
};
const LABEL_STYLE: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 5,
};

const EMPTY_FORM = { nom: '', description: '', type: 'Conseil' as PrestationInput['type'], prixBase: 0, dureeEstimee: '', isActive: true };

export default function PrestationsPage() {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('');
  const [data, setData] = useState<Prestation[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function loadData() {
    setLoading(true);
    prestationsApi.list(false)
      .then(({ data }) => {
        const rows: Prestation[] = (data || []).map((p: any) => ({
          id: p.id,
          nom: p.nom,
          categorie: p.type,
          prix: p.prixBase ?? 0,
          unite: p.dureeEstimee ? `/ ${p.dureeEstimee}` : '',
          description: p.description ?? '',
          isActive: p.isActive ?? true,
          type: p.type,
          prixBase: p.prixBase ?? 0,
          dureeEstimee: p.dureeEstimee ?? '',
        }));
        setData(rows);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(p: Prestation) {
    setEditId(p.id);
    setForm({
      nom: p.nom,
      description: p.description,
      type: p.type as PrestationInput['type'],
      prixBase: p.prixBase,
      dureeEstimee: p.dureeEstimee,
      isActive: p.isActive,
    });
    setShowModal(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette prestation ?')) return;
    try {
      await prestationsApi.delete(id);
      loadData();
    } catch {
      alert('Erreur lors de la suppression.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: PrestationInput = {
        nom: form.nom,
        type: form.type,
        prixBase: Number(form.prixBase),
        dureeEstimee: form.dureeEstimee || undefined,
        description: form.description || undefined,
        isActive: form.isActive,
      };
      if (editId) {
        await prestationsApi.update(editId, payload);
      } else {
        await prestationsApi.create(payload);
      }
      setShowModal(false);
      loadData();
    } catch {
      alert('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  }

  const filtered = data.filter(p => {
    const q = search.toLowerCase();
    return (!q || p.nom.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
      && (!cat || p.categorie === cat);
  });

  const catFilters = [
    { id: '', label: 'Toutes', count: data.length },
    ...Object.keys(CATS)
      .filter(c => data.some(p => p.categorie === c))
      .map(c => ({ id: c, label: CAT_LABEL[c] ?? c, count: data.filter(p => p.categorie === c).length })),
  ];

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
              <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{editId ? 'Modifier la prestation' : 'Nouvelle prestation'}</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
                <MI name="close" size={20} color="#94A3B8" />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={LABEL_STYLE}>Nom *</label>
                <input
                  required
                  value={form.nom}
                  onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Ex: Gestion de carrière football"
                  style={INPUT_STYLE}
                  onFocus={e => { e.currentTarget.style.borderColor = '#3A6B84'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(58,107,132,0.08)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
              <div>
                <label style={LABEL_STYLE}>Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Description de la prestation…"
                  rows={3}
                  style={{ ...INPUT_STYLE, resize: 'vertical' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#3A6B84'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(58,107,132,0.08)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={LABEL_STYLE}>Type *</label>
                  <div style={{ position: 'relative' }}>
                    <select
                      required
                      value={form.type}
                      onChange={e => setForm(f => ({ ...f, type: e.target.value as PrestationInput['type'] }))}
                      style={{ ...INPUT_STYLE, appearance: 'none', paddingRight: 32, cursor: 'pointer' }}
                    >
                      {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'inline-flex' }}>
                      <MI name="expand_more" size={15} color="#94A3B8" />
                    </span>
                  </div>
                </div>
                <div>
                  <label style={LABEL_STYLE}>Prix de base ($) *</label>
                  <input
                    required
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.prixBase}
                    onChange={e => setForm(f => ({ ...f, prixBase: parseFloat(e.target.value) || 0 }))}
                    placeholder="0.00"
                    style={INPUT_STYLE}
                    onFocus={e => { e.currentTarget.style.borderColor = '#3A6B84'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(58,107,132,0.08)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>
              <div>
                <label style={LABEL_STYLE}>Unité</label>
                <input
                  value={form.dureeEstimee}
                  onChange={e => setForm(f => ({ ...f, dureeEstimee: e.target.value }))}
                  placeholder="heure, jour, forfait…"
                  style={INPUT_STYLE}
                  onFocus={e => { e.currentTarget.style.borderColor = '#3A6B84'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(58,107,132,0.08)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  id="actif"
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#07101A' }}
                />
                <label htmlFor="actif" style={{ fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Actif (visible dans le catalogue)</label>
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
                  {saving ? 'Enregistrement…' : (editId ? 'Mettre à jour' : 'Créer la prestation')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOPBAR */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E8ECF1', padding: '0 28px', display: 'flex', alignItems: 'center', height: 60, gap: 16, flexShrink: 0 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>Catalogue de prestations</span>
          <span style={{ fontSize: 12, fontWeight: 700, background: '#07101A', color: '#FCD116', padding: '2px 9px', borderRadius: 20 }}>{data.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'inline-flex', zIndex: 1 }}>
              <MI name="search" size={17} color="#94A3B8" />
            </span>
            <input
              type="text"
              placeholder="Rechercher une prestation…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '9px 14px 9px 38px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: '#0F172A', outline: 'none', background: '#F8FAFC', width: 240 }}
              onFocus={e => { e.currentTarget.style.borderColor = '#3A6B84'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(58,107,132,0.08)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
          <button
            onClick={openCreate}
            style={{ padding: '9px 18px', background: '#07101A', color: '#FCD116', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#132730')}
            onMouseLeave={e => (e.currentTarget.style.background = '#07101A')}
          >
            <MI name="add" size={16} color="#FCD116" />
            Nouvelle prestation
          </button>
        </div>
      </div>

      {/* CATEGORY CHIPS */}
      <div style={{ display: 'flex', gap: 8, padding: '20px 28px 0', flexWrap: 'wrap' }}>
        {catFilters.map(c => (
          <div
            key={c.id}
            onClick={() => setCat(c.id)}
            style={cat === c.id ? CAT_FILTER_ACTIVE : CAT_FILTER_IDLE}
          >
            {c.label} <span style={{ opacity: 0.6 }}>{c.count}</span>
          </div>
        ))}
      </div>

      {/* GRID */}
      <div style={{ padding: '18px 28px 32px', flex: 1 }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ height: 180, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16 }} className="animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '56px 20px', textAlign: 'center', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16 }}>
            <MI name="search_off" size={42} color="#CBD5E1" />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', marginTop: 10 }}>Aucune prestation trouvée</div>
            <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Essayez un autre mot-clé ou une autre catégorie.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {filtered.map(p => {
              const c = CATS[p.categorie] ?? { color: '#64748B', bg: '#F1F5F9', icon: 'category' };
              return (
                <PrestationCard key={p.id} p={p} c={c} onEdit={() => openEdit(p)} onDelete={() => handleDelete(p.id)} />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PrestationCard({ p, c, onEdit, onDelete }: { p: Prestation; c: { color: string; bg: string; icon: string }; onEdit: () => void; onDelete: () => void }) {
  return (
    <div
      style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 12, transition: 'border-color 0.15s, box-shadow 0.15s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#CBD5E1'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(0,0,0,0.06)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0'; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <MI name={c.icon} size={20} color={c.color} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: c.color, background: c.bg, padding: '3px 9px', borderRadius: 20, display: 'inline-block', whiteSpace: 'nowrap' }}>
          {CAT_LABEL[p.categorie] ?? p.categorie}
        </span>
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>{p.nom}</div>
        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 5, lineHeight: 1.5 }}>{p.description}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #F1F5F9' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#059669', letterSpacing: '-0.4px', fontFamily: 'monospace' }}>{fmtPrix(p.prix)}</div>
          <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 1 }}>{p.unite}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <ActionBtn icon="edit" onClick={onEdit} hoverBg="#EFF6FF" hoverBorder="#BFDBFE" />
          <ActionBtn icon="delete_outline" onClick={onDelete} hoverBg="#FEF2F2" hoverBorder="#FECACA" iconColor="#EF4444" />
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ icon, onClick, hoverBg, hoverBorder, iconColor = '#64748B' }: { icon: string; onClick: () => void; hoverBg: string; hoverBorder: string; iconColor?: string }) {
  return (
    <div
      onClick={onClick}
      style={{ width: 30, height: 30, borderRadius: 8, background: '#F1F5F9', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = hoverBg; (e.currentTarget as HTMLElement).style.borderColor = hoverBorder; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#F1F5F9'; (e.currentTarget as HTMLElement).style.borderColor = '#E2E8F0'; }}
    >
      <MI name={icon} size={15} color={iconColor} />
    </div>
  );
}
