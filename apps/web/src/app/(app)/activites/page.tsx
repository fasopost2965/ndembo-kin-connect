'use client';

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

const SAMPLE = [
  { id: 1, type: 'athlete',  icon: 'directions_run', color: '#3A6B84', bg: '#EFF6FF', text: 'Fiche athlète Théo Lukaku Mbemba créée',             user: 'Jean-Pierre K.', time: 'Il y a 5 min' },
  { id: 2, type: 'contrat',  icon: 'gavel',           color: '#059669', bg: '#F0FDF4', text: 'Contrat CON-2026-018 signé avec AS Vita Club',        user: 'Amadou S.',      time: 'Il y a 23 min' },
  { id: 3, type: 'facture',  icon: 'receipt_long',    color: '#2563EB', bg: '#EFF6FF', text: 'Facture FAC-2026-0042 émise — $8 500',                user: 'Esther B.',      time: 'Il y a 1h' },
  { id: 4, type: 'paiement', icon: 'payments',        color: '#B45309', bg: '#FEF9EE', text: 'Règlement REG-2026-051 enregistré ($8 500 M-Pesa)',    user: 'Esther B.',      time: 'Il y a 2h' },
  { id: 5, type: 'devis',    icon: 'request_quote',   color: '#6D28D9', bg: '#F5F3FF', text: 'Devis DEV-2026-014 validé par DC Motema Pembe',       user: 'Marie-Claire N.', time: 'Il y a 4h' },
  { id: 6, type: 'client',   icon: 'business',        color: '#0E7490', bg: '#ECFEFF', text: 'Client BC Kinshasa ajouté',                           user: 'Amadou S.',      time: 'Hier 17:42' },
  { id: 7, type: 'projet',   icon: 'work',            color: '#BE123C', bg: '#FFF1F2', text: 'Projet "Tournoi présaison AS Vita" créé',             user: 'Jean-Pierre K.', time: 'Hier 14:10' },
  { id: 8, type: 'athlete',  icon: 'directions_run',  color: '#3A6B84', bg: '#EFF6FF', text: 'Profil Joël Mbuyi Kabongo mis à jour',                user: 'Didier M.',      time: 'Hier 09:30' },
];

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('');
}

const AVATAR_COLORS: Record<string, string> = {
  'Jean-Pierre K.': '#3A6B84',
  'Amadou S.': '#1D4ED8',
  'Esther B.': '#059669',
  'Marie-Claire N.': '#B45309',
  'Didier M.': '#6D28D9',
};

export default function ActivitesPage() {
  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', minHeight: '100vh', background: '#F0F2F5', display: 'flex', flexDirection: 'column' }}>

      {/* TOPBAR */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E8ECF1', padding: '0 28px', display: 'flex', alignItems: 'center', height: 60, gap: 16, flexShrink: 0 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>Activités</span>
          <span style={{ fontSize: 12, fontWeight: 700, background: '#07101A', color: '#FCD116', padding: '2px 9px', borderRadius: 20 }}>{SAMPLE.length}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'inline-flex', zIndex: 1 }}>
              <MI name="search" size={17} color="#94A3B8" />
            </span>
            <input
              type="text"
              placeholder="Filtrer les activités…"
              style={{ padding: '9px 14px 9px 38px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, fontFamily: 'inherit', color: '#0F172A', outline: 'none', background: '#F8FAFC', width: 220 }}
              onFocus={e => { e.currentTarget.style.borderColor = '#3A6B84'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(58,107,132,0.08)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
        </div>
      </div>

      {/* TIMELINE */}
      <div style={{ padding: '24px 28px 32px', flex: 1, maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid #F1F5F9' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Journal d'activités</span>
            <span style={{ fontSize: 12, color: '#94A3B8', marginLeft: 8 }}>Aujourd'hui</span>
          </div>
          <div style={{ padding: '8px 22px' }}>
            {SAMPLE.map((a, i) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 0', borderBottom: i < SAMPLE.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: a.bg, border: `1px solid ${a.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MI name={a.icon} size={18} color={a.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: '#334155', lineHeight: 1.4 }}>{a.text}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: AVATAR_COLORS[a.user] ?? '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                      {initials(a.user)}
                    </div>
                    <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>{a.user}</span>
                    <span style={{ fontSize: 11, color: '#CBD5E1' }}>·</span>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>{a.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
