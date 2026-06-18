'use client';

import { useCallback, useEffect, useState } from 'react';
import { settingsApi } from '@/lib/api';

function MI({ name, size = 16, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  return (
    <span className="material-icons-outlined select-none leading-none"
      style={{ fontSize: size, display: 'inline-flex', alignItems: 'center', ...style }}>
      {name}
    </span>
  );
}

type Tab = 'agence' | 'users' | 'roles' | 'billing' | 'pay';

interface User {
  id: string;
  nom: string;
  email: string;
  role: string;
  lastLogin?: string;
  actif: boolean;
}

interface Settings { [key: string]: string }

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'agence',  label: 'Agence',                icon: 'business' },
  { id: 'users',   label: 'Utilisateurs',           icon: 'group' },
  { id: 'roles',   label: 'Rôles & permissions',    icon: 'shield' },
  { id: 'billing', label: 'Facturation',             icon: 'receipt_long' },
  { id: 'pay',     label: 'Mobile Money',            icon: 'smartphone' },
];

const ROLE_META: Record<string, { label: string; bg: string; color: string }> = {
  PLANIFICATEUR: { label: 'Admin',      bg: '#FEF9EE', color: '#B45309' },
  SUPERVISEUR:   { label: 'Manager',    bg: '#EFF6FF', color: '#2563EB' },
  COMMERCIAL:    { label: 'Commercial', bg: '#F0FDF4', color: '#059669' },
  COACH:         { label: 'Coach',      bg: '#F5F3FF', color: '#6D28D9' },
  OBSERVATEUR:   { label: 'Observateur',bg: '#FEF2F2', color: '#B91C1C' },
};

const RBAC = [
  { module: 'Utilisateurs',      perms: ['full','read','none','none','none'] },
  { module: 'Athlètes',          perms: ['full','full','read','full','read'] },
  { module: 'Clients',           perms: ['full','full','full','read','read'] },
  { module: 'Devis / Factures',  perms: ['full','full','full','none','full'] },
  { module: 'Projets / Tâches',  perms: ['full','full','read','full','read'] },
  { module: 'Contrats',          perms: ['full','full','none','none','read'] },
  { module: 'Règlements',        perms: ['full','full','none','none','full'] },
  { module: 'Paramètres',        perms: ['full','none','none','none','none'] },
];

const ROLE_COLS = ['PLANIFICATEUR', 'SUPERVISEUR', 'COMMERCIAL', 'COACH', 'OBSERVATEUR'];

const AVATAR_COLORS = ['#07101A', '#3A6B84', '#059669', '#6D28D9', '#B45309'];
function avatarColor(id: string) {
  const h = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

const INPUT_BASE: React.CSSProperties = {
  width: '100%', padding: '11px 14px', border: '1.5px solid #E2E8F0', borderRadius: 9,
  fontSize: 14, fontFamily: 'inherit', color: '#0F172A', outline: 'none', background: '#FAFBFC',
};

function SettingsInput({ label, value, onChange, span2 = false }: { label: string; value: string; onChange: (v: string) => void; span2?: boolean }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={span2 ? { gridColumn: 'span 2' } : {}}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>{label}</label>
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{ ...INPUT_BASE, borderColor: focus ? '#3A6B84' : '#E2E8F0', background: focus ? '#fff' : '#FAFBFC', boxShadow: focus ? '0 0 0 3px rgba(58,107,132,0.08)' : 'none' }}
      />
    </div>
  );
}

export default function ParametresPage() {
  const [tab, setTab] = useState<Tab>('agence');
  const [settings, setSettings] = useState<Settings>({});
  const [users, setUsers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    settingsApi.get().then(({ data }) => setSettings(data || {})).catch(() => {});
    settingsApi.users().then(({ data }) => setUsers(data.data || data || [])).catch(() => {});
  }, []);

  const set = (key: string) => (val: string) => setSettings(s => ({ ...s, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.update(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#F0F2F5' }}>

      {/* Topbar */}
      <div className="flex items-center gap-3 px-7 shrink-0"
        style={{ background: '#fff', borderBottom: '1px solid #E8ECF1', height: 60 }}>
        <div style={{ background: '#07101A', borderRadius: 8, padding: '4px 5px', lineHeight: 0 }}>
          <img src="/logo.png" alt="NKC" style={{ height: 22, width: 'auto', display: 'block' }} />
        </div>
        <span style={{ fontSize: 13, color: '#94A3B8' }}>/</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>Paramètres</span>
        <div className="flex-1" />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#B45309', background: '#FEF9EE', border: '1px solid #FDE68A', padding: '5px 11px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <MI name="admin_panel_settings" size={14} style={{ color: '#B45309' }} />
          Accès Administrateur
        </span>
      </div>

      {/* Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, padding: '24px 28px 48px', maxWidth: 1180, margin: '0 auto', width: '100%' }}>

        {/* Left nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {TABS.map(t => (
            <div key={t.id} onClick={() => setTab(t.id)} className="flex items-center gap-3"
              style={{
                padding: '11px 14px', borderRadius: 10, fontSize: 13.5, cursor: 'pointer',
                fontWeight: tab === t.id ? 700 : 600,
                background: tab === t.id ? '#07101A' : 'transparent',
                color: tab === t.id ? '#FCD116' : '#475569',
              }}>
              <MI name={t.icon} size={18} style={{ color: tab === t.id ? '#FCD116' : '#94A3B8' }} />
              {t.label}
            </div>
          ))}
        </div>

        {/* Right panel */}
        <div>

          {/* Agence */}
          {tab === 'agence' && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 26px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Informations de l'agence</div>
                <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 2 }}>Ces données apparaissent sur les devis, factures et contrats générés.</div>
              </div>
              <div style={{ padding: '24px 26px' }}>
                {/* Logo row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, paddingBottom: 22, marginBottom: 22, borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ width: 72, height: 72, borderRadius: 14, background: '#07101A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src="/logo.png" alt="Logo" style={{ height: 42, width: 'auto' }} />
                  </div>
                  <div>
                    <button style={{ padding: '8px 16px', background: '#F1F5F9', color: '#475569', fontSize: 13, fontWeight: 600, border: '1px solid #E2E8F0', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7 }}>
                      <MI name="upload" size={15} />Changer le logo
                    </button>
                    <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 7 }}>PNG ou SVG, fond transparent, max 1 Mo.</div>
                  </div>
                </div>
                {/* Fields grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <SettingsInput label="Raison sociale"      value={settings.agence_nom || ''}       onChange={set('agence_nom')}       span2 />
                  <SettingsInput label="Adresse"             value={settings.agence_adresse || ''}   onChange={set('agence_adresse')}   span2 />
                  <SettingsInput label="Téléphone"           value={settings.agence_telephone || ''} onChange={set('agence_telephone')} />
                  <SettingsInput label="Email"               value={settings.agence_email || ''}     onChange={set('agence_email')} />
                  <SettingsInput label="RCCM"                value={settings.agence_rccm || ''}      onChange={set('agence_rccm')} />
                  <SettingsInput label="ID. Nationale"       value={settings.agence_idnat || ''}     onChange={set('agence_idnat')} />
                  <SettingsInput label="NIF"                 value={settings.agence_nif || ''}       onChange={set('agence_nif')} />
                  <SettingsInput label="IBAN (Rawbank)"      value={settings.banque_iban || ''}      onChange={set('banque_iban')} />
                </div>
              </div>
              <div style={{ padding: '16px 26px', borderTop: '1px solid #F1F5F9', background: '#FAFBFC', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button style={{ padding: '10px 18px', background: '#F1F5F9', color: '#475569', fontSize: 13, fontWeight: 600, border: '1px solid #E2E8F0', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Annuler
                </button>
                <button onClick={handleSave} disabled={saving}
                  style={{ padding: '10px 22px', background: '#07101A', color: saved ? '#34D399' : '#FCD116', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Enregistrement…' : saved ? '✓ Enregistré' : 'Enregistrer'}
                </button>
              </div>
            </div>
          )}

          {/* Utilisateurs */}
          {tab === 'users' && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 26px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Utilisateurs & accès</div>
                  <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 2 }}>Gérez les membres de l'équipe et leur rôle.</div>
                </div>
                <button style={{ padding: '9px 18px', background: '#07101A', color: '#FCD116', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7 }}>
                  <MI name="person_add" size={16} style={{ color: '#FCD116' }} />
                  Inviter un membre
                </button>
              </div>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '2.4fr 1.4fr 1fr 0.8fr 60px', gap: 8, padding: '11px 26px', background: '#F8FAFC', borderBottom: '1px solid #E8ECF1' }}>
                {['Membre', 'Rôle', 'Dernière connexion', 'Statut', ''].map(h => (
                  <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 }}>{h}</div>
                ))}
              </div>
              {users.length === 0 ? (
                <div style={{ padding: '40px 26px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Aucun utilisateur trouvé.</div>
              ) : users.map((u, i) => {
                const rm = ROLE_META[u.role] || { label: u.role, bg: '#F1F5F9', color: '#64748B' };
                const ac = avatarColor(u.id);
                const initials2 = u.nom.split(' ').map(w => w[0]).slice(0, 2).join('');
                return (
                  <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2.4fr 1.4fr 1fr 0.8fr 60px', gap: 8, padding: '13px 26px', borderBottom: '1px solid #F8FAFC', alignItems: 'center' }}>
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 flex items-center justify-center rounded-full"
                        style={{ width: 38, height: 38, background: ac, fontSize: 13, fontWeight: 800, color: '#FCD116' }}>
                        {initials2}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{u.nom}</div>
                        <div style={{ fontSize: 11, color: '#94A3B8' }}>{u.email}</div>
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, background: rm.bg, color: rm.color, padding: '4px 11px', borderRadius: 20, display: 'inline-block' }}>
                        {rm.label}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: '#64748B' }}>
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('fr-FR') : '—'}
                    </div>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 700, background: u.actif ? '#F0FDF4' : '#FEF9EE', color: u.actif ? '#059669' : '#B45309', padding: '3px 9px', borderRadius: 20 }}>
                        {u.actif ? 'Actif' : 'Invité'}
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <div className="flex items-center justify-center rounded-[8px]"
                        style={{ width: 30, height: 30, background: '#F1F5F9', border: '1px solid #E2E8F0', cursor: 'pointer' }}>
                        <MI name="more_horiz" size={16} style={{ color: '#64748B' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rôles */}
          {tab === 'roles' && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 26px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Rôles & permissions</div>
                <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 2 }}>
                  Matrice d'accès par module. <span style={{ color: '#059669', fontWeight: 600 }}>✓ complet</span> · <span style={{ color: '#3A6B84', fontWeight: 600 }}>◐ lecture seule</span> · <span style={{ color: '#CBD5E1', fontWeight: 600 }}>— aucun</span>
                </div>
              </div>
              <div style={{ padding: '8px 26px 26px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.6fr repeat(5,1fr)', padding: '14px 0 12px', borderBottom: '1px solid #E8ECF1' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Module</div>
                  {ROLE_COLS.map(r => {
                    const rm = ROLE_META[r];
                    return <div key={r} style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center', color: rm.color }}>{rm.label}</div>;
                  })}
                </div>
                {RBAC.map(row => (
                  <div key={row.module} style={{ display: 'grid', gridTemplateColumns: '1.6fr repeat(5,1fr)', padding: '12px 0', borderBottom: '1px solid #F1F5F9', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{row.module}</div>
                    {row.perms.map((p, i) => (
                      <div key={i} style={{ textAlign: 'center', fontSize: p === 'full' ? 15 : 14, fontWeight: p !== 'none' ? 800 : 400, color: p === 'full' ? '#059669' : p === 'read' ? '#3A6B84' : '#CBD5E1' }}>
                        {p === 'full' ? '✓' : p === 'read' ? '◐' : '—'}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Facturation */}
          {tab === 'billing' && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 26px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Facturation</div>
                <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 2 }}>Numérotation automatique et taxe par défaut.</div>
              </div>
              <div style={{ padding: '24px 26px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <SettingsInput label="Préfixe devis"    value={settings.prefix_devis    || 'DEV-{AAAA}-{NNN}'}  onChange={set('prefix_devis')} />
                <SettingsInput label="Préfixe facture"  value={settings.prefix_facture  || 'FAC-{AAAA}-{NNNN}'} onChange={set('prefix_facture')} />
                <SettingsInput label="TVA par défaut (%)" value={settings.tva_default   || '16'}                onChange={set('tva_default')} />
                <SettingsInput label="Devise"           value={settings.devise          || 'USD'}               onChange={set('devise')} />
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Validité par défaut des devis (jours)</label>
                  <input type="text" value={settings.devis_validite_jours || '30'} onChange={e => set('devis_validite_jours')(e.target.value)}
                    style={{ ...INPUT_BASE, width: 200 }} />
                </div>
              </div>
              <div style={{ padding: '16px 26px', borderTop: '1px solid #F1F5F9', background: '#FAFBFC', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button style={{ padding: '10px 18px', background: '#F1F5F9', color: '#475569', fontSize: 13, fontWeight: 600, border: '1px solid #E2E8F0', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
                <button onClick={handleSave} style={{ padding: '10px 22px', background: '#07101A', color: '#FCD116', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit' }}>Enregistrer</button>
              </div>
            </div>
          )}

          {/* Mobile Money */}
          {tab === 'pay' && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 26px', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Mobile Money</div>
                <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 2 }}>Comptes marchands pour l'encaissement via FlexPay.</div>
              </div>
              <div style={{ padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { name: 'M-Pesa (Vodacom)', key: 'mobile_mpesa',  short: 'MP', bg: '#E30613', statut: 'Connecté' },
                  { name: 'Airtel Money',     key: 'mobile_airtel', short: 'AM', bg: '#ED1C24', statut: 'Connecté' },
                  { name: 'Orange Money',     key: 'mobile_orange', short: 'OM', bg: '#FF7900', statut: 'Non configuré' },
                ].map(acc => {
                  const connected = !!settings[acc.key];
                  return (
                    <div key={acc.key} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 18px', border: '1px solid #E2E8F0', borderRadius: 12, background: '#FAFBFC' }}>
                      <div style={{ width: 48, height: 48, borderRadius: 11, background: acc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0, letterSpacing: '-0.5px' }}>
                        {acc.short}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{acc.name}</div>
                        <div style={{ fontSize: 12, color: '#94A3B8', fontFamily: 'monospace', marginTop: 2 }}>
                          {settings[acc.key] || '—'}
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, background: connected ? '#F0FDF4' : '#F1F5F9', color: connected ? '#059669' : '#64748B', padding: '5px 11px', borderRadius: 20 }}>
                        {connected ? 'Connecté' : 'Non configuré'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: '16px 26px', borderTop: '1px solid #F1F5F9', background: '#FAFBFC', display: 'flex', justifyContent: 'flex-end' }}>
                <button style={{ padding: '10px 22px', background: '#07101A', color: '#FCD116', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit' }}>Configurer</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
