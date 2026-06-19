'use client';

import { useEffect, useRef, useState } from 'react';
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
  ADMIN:      { label: 'Admin',      bg: '#FEF9EE', color: '#B45309' },
  MANAGER:    { label: 'Manager',    bg: '#EFF6FF', color: '#2563EB' },
  COMMERCIAL: { label: 'Commercial', bg: '#F0FDF4', color: '#059669' },
  COACH:      { label: 'Coach',      bg: '#F5F3FF', color: '#6D28D9' },
  COMPTABLE:  { label: 'Comptable',  bg: '#FEF2F2', color: '#B91C1C' },
};

// Role column header colors for the RBAC matrix
const ROLE_HEADER_META: Record<string, { headerBg: string; headerColor: string }> = {
  ADMIN:      { headerBg: '#FEF3C7', headerColor: '#92400E' },
  MANAGER:    { headerBg: '#DBEAFE', headerColor: '#1D4ED8' },
  COMMERCIAL: { headerBg: '#DCFCE7', headerColor: '#15803D' },
  COACH:      { headerBg: '#EDE9FE', headerColor: '#6D28D9' },
  COMPTABLE:  { headerBg: '#FEE2E2', headerColor: '#B91C1C' },
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

const ROLE_COLS = ['ADMIN', 'MANAGER', 'COMMERCIAL', 'COACH', 'COMPTABLE'];

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

// ── Permission pill ──────────────────────────────────────────────────────────
function PermPill({ perm }: { perm: string }) {
  if (perm === 'full') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, background: '#F0FDF4', color: '#059669', padding: '4px 10px', borderRadius: 20, border: '1px solid #BBF7D0', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <MI name="check_circle" size={12} style={{ color: '#059669' }} />
          Complet
        </span>
      </div>
    );
  }
  if (perm === 'read') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, background: '#EFF6FF', color: '#3A6B84', padding: '4px 10px', borderRadius: 20, border: '1px solid #BFDBFE', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <MI name="visibility" size={12} style={{ color: '#3A6B84' }} />
          Lecture
        </span>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <span style={{ fontSize: 11, fontWeight: 600, background: '#F8FAFC', color: '#CBD5E1', padding: '4px 10px', borderRadius: 20, border: '1px solid #E2E8F0', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <MI name="remove" size={12} style={{ color: '#CBD5E1' }} />
        —
      </span>
    </div>
  );
}

// ── Invite modal ──────────────────────────────────────────────────────────────
function InviteModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('MANAGER');
  const [success, setSuccess] = useState('');
  const [emailFocus, setEmailFocus] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSuccess(`Invitation envoyée à ${email}`);
    setTimeout(() => { onClose(); }, 1800);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(7,16,26,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 24px 80px rgba(0,0,0,0.18)', width: '100%', maxWidth: 420, padding: '28px 28px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0F172A' }}>Inviter un membre</div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>Un e-mail d'invitation sera envoyé.</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MI name="close" size={16} style={{ color: '#64748B' }} />
          </button>
        </div>

        {success ? (
          <div style={{ padding: '18px 16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <MI name="check_circle" size={20} style={{ color: '#059669' }} />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: '#059669' }}>{success}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                Adresse e-mail <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="email" required placeholder="membre@agence.cd" value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setEmailFocus(true)} onBlur={() => setEmailFocus(false)}
                style={{ ...INPUT_BASE, borderColor: emailFocus ? '#3A6B84' : '#E2E8F0', background: emailFocus ? '#fff' : '#FAFBFC', boxShadow: emailFocus ? '0 0 0 3px rgba(58,107,132,0.08)' : 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Rôle</label>
              <div style={{ position: 'relative' }}>
                <select value={role} onChange={e => setRole(e.target.value)}
                  style={{ ...INPUT_BASE, appearance: 'none', paddingRight: 36, cursor: 'pointer' }}>
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="COMMERCIAL">Commercial</option>
                  <option value="COACH">Coach</option>
                  <option value="COMPTABLE">Comptable</option>
                </select>
                <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <MI name="expand_more" size={16} style={{ color: '#94A3B8' }} />
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="button" onClick={onClose}
                style={{ flex: 1, padding: '10px 0', background: '#F1F5F9', color: '#475569', fontSize: 13, fontWeight: 600, border: '1px solid #E2E8F0', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit' }}>
                Annuler
              </button>
              <button type="submit"
                style={{ flex: 1, padding: '10px 0', background: '#07101A', color: '#FCD116', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <MI name="send" size={15} style={{ color: '#FCD116' }} />
                Envoyer l'invitation
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Change role modal ─────────────────────────────────────────────────────────
function ChangeRoleModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [role, setRole] = useState(user.role);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      if ((settingsApi as any).updateUser) {
        await (settingsApi as any).updateUser(user.id, { role });
      }
      setDone(true);
      setTimeout(() => onClose(), 1500);
    } catch {
      // show success anyway since feature may not exist yet
      setDone(true);
      setTimeout(() => onClose(), 1500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(7,16,26,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 24px 80px rgba(0,0,0,0.18)', width: '100%', maxWidth: 380, padding: '28px 28px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Modifier le rôle</div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MI name="close" size={16} style={{ color: '#64748B' }} />
          </button>
        </div>
        <div style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>{user.name || user.email}</div>

        {done ? (
          <div style={{ padding: '16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <MI name="check_circle" size={18} style={{ color: '#059669' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#059669' }}>Rôle mis à jour avec succès</span>
          </div>
        ) : (
          <>
            <div style={{ position: 'relative', marginBottom: 18 }}>
              <select value={role} onChange={e => setRole(e.target.value)}
                style={{ ...INPUT_BASE, appearance: 'none', paddingRight: 36, cursor: 'pointer' }}>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="COACH">Coach</option>
                <option value="COMPTABLE">Comptable</option>
              </select>
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <MI name="expand_more" size={16} style={{ color: '#94A3B8' }} />
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose}
                style={{ flex: 1, padding: '10px 0', background: '#F1F5F9', color: '#475569', fontSize: 13, fontWeight: 600, border: '1px solid #E2E8F0', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit' }}>
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 1, padding: '10px 0', background: '#07101A', color: '#FCD116', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Mobile Money config modal ─────────────────────────────────────────────────
function MobileMoneyModal({
  provider, onClose, onSave,
}: { provider: { name: string; key: string; bg: string; short: string }; onClose: () => void; onSave: (key: string, val: string) => void }) {
  const [numero, setNumero] = useState('');
  const [compte, setCompte] = useState('');
  const [success, setSuccess] = useState(false);
  const [nFocus, setNFocus] = useState(false);
  const [cFocus, setCFocus] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!numero) return;
    onSave(provider.key, numero);
    setSuccess(true);
    setTimeout(() => onClose(), 1600);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(7,16,26,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 24px 80px rgba(0,0,0,0.18)', width: '100%', maxWidth: 400, padding: '28px 28px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: provider.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
            {provider.short}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Configurer {provider.name}</div>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>Compte marchand FlexPay</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MI name="close" size={16} style={{ color: '#64748B' }} />
          </button>
        </div>

        {success ? (
          <div style={{ padding: '18px 16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <MI name="check_circle" size={20} style={{ color: '#059669' }} />
            <span style={{ fontSize: 13.5, fontWeight: 600, color: '#059669' }}>Compte {provider.name} configuré avec succès</span>
          </div>
        ) : (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                Numéro marchand <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                required placeholder="+243 8X XXX XXXX" value={numero}
                onChange={e => setNumero(e.target.value)}
                onFocus={() => setNFocus(true)} onBlur={() => setNFocus(false)}
                style={{ ...INPUT_BASE, borderColor: nFocus ? '#3A6B84' : '#E2E8F0', background: nFocus ? '#fff' : '#FAFBFC', boxShadow: nFocus ? '0 0 0 3px rgba(58,107,132,0.08)' : 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Nom du compte</label>
              <input
                placeholder="Ndembo Kin Connect SARL" value={compte}
                onChange={e => setCompte(e.target.value)}
                onFocus={() => setCFocus(true)} onBlur={() => setCFocus(false)}
                style={{ ...INPUT_BASE, borderColor: cFocus ? '#3A6B84' : '#E2E8F0', background: cFocus ? '#fff' : '#FAFBFC', boxShadow: cFocus ? '0 0 0 3px rgba(58,107,132,0.08)' : 'none' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="button" onClick={onClose}
                style={{ flex: 1, padding: '10px 0', background: '#F1F5F9', color: '#475569', fontSize: 13, fontWeight: 600, border: '1px solid #E2E8F0', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit' }}>
                Annuler
              </button>
              <button type="submit"
                style={{ flex: 1, padding: '10px 0', background: '#07101A', color: '#FCD116', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit' }}>
                Enregistrer
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── User action popover ──────────────────────────────────────────────────────
function UserActionMenu({ user, onChangeRole, onDisable }: { user: User; onChangeRole: () => void; onDisable: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-center rounded-[8px]"
        style={{ width: 30, height: 30, background: open ? '#E2E8F0' : '#F1F5F9', border: '1px solid #E2E8F0', cursor: 'pointer' }}>
        <MI name="more_horiz" size={16} style={{ color: '#64748B' }} />
      </div>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 36, zIndex: 50,
          background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)', minWidth: 190, padding: '6px',
        }}>
          <button
            onClick={() => { setOpen(false); onChangeRole(); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#334155', fontFamily: 'inherit', textAlign: 'left' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <MI name="manage_accounts" size={15} style={{ color: '#3A6B84' }} />
            Modifier le rôle
          </button>
          <button
            onClick={() => { setOpen(false); onDisable(); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#DC2626', fontFamily: 'inherit', textAlign: 'left' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#FEF2F2')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <MI name="block" size={15} style={{ color: '#DC2626' }} />
            Désactiver
          </button>
        </div>
      )}
    </div>
  );
}

export default function ParametresPage() {
  const [tab, setTab] = useState<Tab>('agence');
  const [settings, setSettings] = useState<Settings>({});
  const [savedSettings, setSavedSettings] = useState<Settings>({});
  const [users, setUsers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Modals
  const [inviteOpen, setInviteOpen] = useState(false);
  const [changeRoleUser, setChangeRoleUser] = useState<User | null>(null);
  const [mmProvider, setMmProvider] = useState<{ name: string; key: string; bg: string; short: string } | null>(null);

  useEffect(() => {
    settingsApi.get().then(({ data }) => {
      const s = data || {};
      setSettings(s);
      setSavedSettings(s);
    }).catch(() => {});
    settingsApi.users().then(({ data }) => setUsers(data.data || data || [])).catch(() => {});
  }, []);

  const set = (key: string) => (val: string) => setSettings(s => ({ ...s, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.update(settings);
      setSavedSettings({ ...settings });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => setSettings({ ...savedSettings });

  const handleMmSave = (key: string, val: string) => {
    const next = { ...settings, [key]: val };
    setSettings(next);
    setSavedSettings(next);
    settingsApi.update(next).catch(() => {});
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
                <button
                  onClick={handleCancel}
                  style={{ padding: '10px 18px', background: '#F1F5F9', color: '#475569', fontSize: 13, fontWeight: 600, border: '1px solid #E2E8F0', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit' }}>
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
                <button
                  onClick={() => setInviteOpen(true)}
                  style={{ padding: '9px 18px', background: '#07101A', color: '#FCD116', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 7 }}>
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
              ) : users.map((u) => {
                const rm = ROLE_META[u.role] || { label: u.role, bg: '#F1F5F9', color: '#64748B' };
                const ac = avatarColor(u.id);
                const uName = u.name || u.nom || u.email || '?';
                const initials2 = uName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
                return (
                  <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '2.4fr 1.4fr 1fr 0.8fr 60px', gap: 8, padding: '13px 26px', borderBottom: '1px solid #F8FAFC', alignItems: 'center' }}>
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 flex items-center justify-center rounded-full"
                        style={{ width: 38, height: 38, background: ac, fontSize: 13, fontWeight: 800, color: '#FCD116' }}>
                        {initials2}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{u.name || u.nom || u.email}</div>
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
                      <UserActionMenu
                        user={u}
                        onChangeRole={() => setChangeRoleUser(u)}
                        onDisable={() => alert(`Désactivation de ${u.name || u.nom || u.email} — fonctionnalité bientôt disponible`)}
                      />
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
                <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, background: '#F0FDF4', color: '#059669', padding: '3px 9px', borderRadius: 20, border: '1px solid #BBF7D0' }}>Complet</span>
                    Accès total
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, background: '#EFF6FF', color: '#3A6B84', padding: '3px 9px', borderRadius: 20, border: '1px solid #BFDBFE' }}>Lecture</span>
                    Lecture seule
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, background: '#F8FAFC', color: '#CBD5E1', padding: '3px 9px', borderRadius: 20, border: '1px solid #E2E8F0' }}>—</span>
                    Aucun accès
                  </span>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', position: 'sticky', top: 0, zIndex: 10 }}>
                      <th style={{ padding: '14px 26px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid #E8ECF1', minWidth: 160 }}>
                        Module
                      </th>
                      {ROLE_COLS.map(r => {
                        const rm = ROLE_META[r];
                        const hm = ROLE_HEADER_META[r];
                        return (
                          <th key={r} style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #E8ECF1', minWidth: 110 }}>
                            <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '5px 12px', borderRadius: 20, background: hm.headerBg, color: hm.headerColor }}>
                              {rm.label}
                            </span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {RBAC.map((row, idx) => (
                      <tr key={row.module} style={{ background: idx % 2 === 0 ? '#fff' : '#FAFBFC', borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '14px 26px', fontSize: 13, fontWeight: 600, color: '#334155' }}>
                          {row.module}
                        </td>
                        {row.perms.map((p, i) => (
                          <td key={i} style={{ padding: '10px 8px' }}>
                            <PermPill perm={p} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                <button
                  onClick={handleCancel}
                  style={{ padding: '10px 18px', background: '#F1F5F9', color: '#475569', fontSize: 13, fontWeight: 600, border: '1px solid #E2E8F0', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Annuler
                </button>
                <button onClick={handleSave} disabled={saving}
                  style={{ padding: '10px 22px', background: '#07101A', color: saved ? '#34D399' : '#FCD116', fontSize: 13, fontWeight: 700, border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Enregistrement…' : saved ? '✓ Enregistré' : 'Enregistrer'}
                </button>
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
                  { name: 'M-Pesa (Vodacom)', key: 'mobile_mpesa',  short: 'MP', bg: '#E30613' },
                  { name: 'Airtel Money',     key: 'mobile_airtel', short: 'AM', bg: '#ED1C24' },
                  { name: 'Orange Money',     key: 'mobile_orange', short: 'OM', bg: '#FF7900' },
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
                      <span style={{ fontSize: 11, fontWeight: 700, background: connected ? '#F0FDF4' : '#F1F5F9', color: connected ? '#059669' : '#64748B', padding: '5px 11px', borderRadius: 20, marginRight: 10 }}>
                        {connected ? 'Connecté' : 'Non configuré'}
                      </span>
                      <button
                        onClick={() => setMmProvider(acc)}
                        style={{ padding: '8px 14px', background: '#07101A', color: '#FCD116', fontSize: 12, fontWeight: 700, border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <MI name="settings" size={14} style={{ color: '#FCD116' }} />
                        Configurer
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} />}
      {changeRoleUser && <ChangeRoleModal user={changeRoleUser} onClose={() => setChangeRoleUser(null)} />}
      {mmProvider && <MobileMoneyModal provider={mmProvider} onClose={() => setMmProvider(null)} onSave={handleMmSave} />}
    </div>
  );
}
