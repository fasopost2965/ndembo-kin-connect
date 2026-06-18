'use client';

import { useEffect, useState } from 'react';
import { settingsApi } from '@/lib/api';

function MI({ name, size = 16, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  return (
    <span className="material-icons-outlined select-none leading-none"
      style={{ fontSize: size, display: 'inline-flex', alignItems: 'center', ...style }}>
      {name}
    </span>
  );
}

interface Settings { [key: string]: string }

// ── Design tokens ──────────────────────────────────────────────────────────────
const C = {
  navy:  '#07101A',
  gold:  '#FCD116',
  cyan:  '#7CC8E8',
  slate: '#3A6B84',
  t0:    '#0F172A',
  t1:    '#334155',
  t2:    '#475569',
  t3:    '#64748B',
  t4:    '#94A3B8',
  bd:    '#EEF1F4',
  bd2:   '#E2E8F0',
  bg1:   '#F7F9FB',
  bg2:   '#FAFBFC',
  bg3:   '#F1F5F9',
  green: '#059669',
  amber: '#C9960C',
  amberBg: '#FEF9EE',
  amberBd: '#FCE7B0',
  blue:  '#3A6B84',
  blueBg: '#EBF6FB',
  blueBd: '#C4E4F2',
};

const MONO: React.CSSProperties = { fontFamily: 'JetBrains Mono, Courier New, monospace' };

// ── Shared sub-components ─────────────────────────────────────────────────────

function MetaRow({ col1Label, col1Val, col2Label, col2Val, badge, badgeBg, badgeBd, badgeColor, badgeText }: {
  col1Label: string; col1Val: string;
  col2Label: string; col2Val: string;
  badge: string; badgeBg: string; badgeBd: string; badgeColor: string; badgeText: string;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: `1px solid ${C.bd}` }}>
      <div style={{ padding: '13px 44px', borderRight: `1px solid ${C.bd}` }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: C.t4, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{col1Label}</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.t0 }}>{col1Val}</div>
      </div>
      <div style={{ padding: '13px 20px', borderRight: `1px solid ${C.bd}` }}>
        <div style={{ fontSize: 8, fontWeight: 700, color: C.t4, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{col2Label}</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.t0 }}>{col2Val}</div>
      </div>
      <div style={{ padding: '13px 20px', display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: badgeColor, background: badgeBg, border: `1px solid ${badgeBd}`, padding: '5px 11px', borderRadius: 7 }}>
          {badge}
        </span>
      </div>
    </div>
  );
}

function AddressBlock({ label, name, addr, legal, nameFontSize = 11 }: {
  label: string; name: string; addr: string; legal?: string; nameFontSize?: number;
}) {
  return (
    <div>
      <div style={{ fontSize: 8, fontWeight: 700, color: C.t4, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: nameFontSize, fontWeight: 700, color: C.t0, marginBottom: 3 }}>{name}</div>
      <div style={{ fontSize: 9.5, color: C.t2, lineHeight: 1.7 }}>{addr}</div>
      {legal && <div style={{ fontSize: 8, color: C.t4, lineHeight: 1.7, marginTop: 7, ...MONO }}>{legal}</div>}
    </div>
  );
}

function TableHeader({ dark }: { dark: boolean }) {
  const bg = dark ? C.navy : C.bg3;
  const bd = dark ? undefined : C.bd2;
  const textColor = dark ? 'rgba(255,255,255,0.55)' : C.t3;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '51% 10% 19.5% 19.5%', background: bg, borderRadius: '8px 8px 0 0', padding: '10px 16px', border: bd ? `1px solid ${bd}` : undefined }}>
      {['Désignation', 'Qté', 'P. unitaire', 'Total HT'].map((h, i) => (
        <div key={h} style={{ fontSize: 7, fontWeight: 700, color: textColor, textTransform: 'uppercase', letterSpacing: 0.8, textAlign: i === 0 ? undefined : i === 1 ? 'center' : 'right' as any }}>{h}</div>
      ))}
    </div>
  );
}

interface Ligne { desig: string; desc?: string; qte: number; pu: string; tot: string }

function TableRow({ l, alt, bordered }: { l: Ligne; alt: boolean; bordered: boolean }) {
  const bg = alt ? C.bg2 : undefined;
  const bd = bordered ? `1px solid ${C.bd2}` : undefined;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '51% 10% 19.5% 19.5%', padding: '12px 16px', borderBottom: `1px solid ${bordered ? C.bd2 : C.bg3}`, borderLeft: bd, borderRight: bd, background: bg, alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.t0 }}>{l.desig}</div>
        {l.desc && <div style={{ fontSize: 8.5, color: C.t4, marginTop: 2 }}>{l.desc}</div>}
      </div>
      <div style={{ fontSize: 11, color: C.t1, textAlign: 'center' }}>{l.qte}</div>
      <div style={{ fontSize: 11, color: C.t1, textAlign: 'right', ...MONO }}>{l.pu}</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.t0, textAlign: 'right', ...MONO }}>{l.tot}</div>
    </div>
  );
}

function TotalsCol({ ht, tva, tvaRate, remise, ttc }: { ht: string; tva: string; tvaRate: number; remise: string; ttc: string }) {
  return (
    <div style={{ width: 220, flexShrink: 0 }}>
      {[
        { label: 'Sous-total HT', val: ht, color: C.t0, border: false },
        { label: `TVA (${tvaRate} %)`, val: tva, color: C.t0, border: true },
        { label: 'Remise', val: remise, color: C.green, border: true },
      ].map(r => (
        <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderTop: r.border ? `1px solid ${C.bg3}` : undefined }}>
          <span style={{ fontSize: 10, color: C.t3 }}>{r.label}</span>
          <span style={{ fontSize: 10, ...MONO, color: r.color }}>{r.val}</span>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.navy, borderRadius: 9, padding: '13px 16px', marginTop: 9 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Total TTC</span>
        <span style={{ fontSize: 20, fontWeight: 800, color: C.gold, letterSpacing: -0.5, ...MONO }}>{ttc}</span>
      </div>
    </div>
  );
}

// ── Facture template ──────────────────────────────────────────────────────────

function FactureTemplate({ settings }: { settings: Settings }) {
  const agenceNom = settings.agence_nom || 'Ndembo Kin Connect SARL';
  const agenceAddr = settings.agence_adresse || '12, Avenue du Commerce — Gombe\nKinshasa, République Démocratique du Congo';
  const agenceContact = [settings.agence_telephone, settings.agence_email].filter(Boolean).join(' · ');
  const mpesa  = settings.mobile_mpesa  || '0815 000 000';
  const airtel = settings.mobile_airtel || '0995 000 000';
  const iban   = settings.banque_iban ? `Rawbank — IBAN ${settings.banque_iban}` : 'Rawbank — IBAN CD12 0050 1000 4200 0042';

  const lignes: Ligne[] = [
    { desig: 'Négociation de transfert — J. Mbala', desc: 'Commission sur transfert vers club partenaire', qte: 1, pu: '$8 500', tot: '$8 500' },
    { desig: 'Représentation sportive internationale', desc: 'Mandat annuel — saison 2026', qte: 1, pu: '$5 000', tot: '$5 000' },
    { desig: 'Coaching tactique (session)', desc: 'Préparation pré-saison — 4 sessions', qte: 4, pu: '$800', tot: '$3 200' },
  ];

  return (
    <div style={{ width: 794, minHeight: 1123, background: '#fff', boxShadow: '0 6px 28px rgba(0,0,0,0.12)', borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      {/* Header dark */}
      <div style={{ background: C.navy, padding: '36px 48px 30px', position: 'relative' }}>
        <div style={{ height: 4, background: C.gold, position: 'absolute', top: 0, left: 0, right: 0 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 11, padding: '9px 11px' }}>
              <img src="/logo.png" style={{ height: 40, width: 'auto', display: 'block' }} alt="" />
            </div>
            <div>
              <div style={{ fontSize: 19, fontWeight: 800, color: '#fff', letterSpacing: -0.3 }}>{settings.agence_nom || 'Ndembo Kin Connect'}</div>
              <div style={{ fontSize: 12, color: C.cyan, fontWeight: 600, marginTop: 2 }}>Management & Représentation Sportive</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: C.gold, letterSpacing: 2, lineHeight: 1 }}>FACTURE</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 8, ...MONO }}>N° FAC-2026-0042</div>
          </div>
        </div>
      </div>

      <MetaRow
        col1Label="Date d'émission" col1Val="12 juin 2026"
        col2Label="Échéance" col2Val="12 juillet 2026"
        badge="● En attente de paiement"
        badgeBg={C.amberBg} badgeBd={C.amberBd} badgeColor={C.amber} badgeText=""
      />

      {/* Émetteur / Client */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '28px 48px 22px', gap: 40 }}>
        <AddressBlock label="Émis par" name={agenceNom} addr={`${agenceAddr}\n${agenceContact}`} legal={[settings.agence_rccm ? `RCCM ${settings.agence_rccm}` : 'RCCM CD/KIN/RCCM/26-B-0042', settings.agence_nif ? `NIF ${settings.agence_nif}` : 'NIF A2604200P'].join('\n')} />
        <div style={{ background: C.bg1, border: `1px solid ${C.bd}`, borderRadius: 12, padding: '18px 20px' }}>
          <AddressBlock label="Facturé à" name="AS Vita Club" nameFontSize={14} addr={`Club de football professionnel\nStade des Martyrs — Kinshasa\n+243 99 555 11 22 · admin@asvitaclub.cd`} legal="RCCM CD/KIN/12-A-1199" />
        </div>
      </div>

      {/* Table */}
      <div style={{ padding: '0 48px' }}>
        <TableHeader dark={true} />
        {lignes.map((l, i) => <TableRow key={i} l={l} alt={i % 2 === 1} bordered={false} />)}
      </div>

      {/* Bottom */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 28, padding: '24px 48px 0', alignItems: 'flex-start' }}>
        <div style={{ background: C.bg1, border: `1px solid ${C.bd}`, borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: C.t4, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>Modalités de paiement</div>
          <div style={{ fontSize: 9, color: C.t2, lineHeight: 1.7 }}>Paiement à 30 jours. Mobile Money accepté :</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <span style={{ fontSize: 8, fontWeight: 600, color: '#B45309', background: '#FEF9EE', padding: '4px 9px', borderRadius: 6 }}>M-Pesa · {mpesa}</span>
            <span style={{ fontSize: 8, fontWeight: 600, color: '#BE123C', background: '#FFF1F2', padding: '4px 9px', borderRadius: 6 }}>Airtel · {airtel}</span>
          </div>
          <div style={{ fontSize: 8, color: C.t4, lineHeight: 1.7, marginTop: 9, ...MONO }}>{iban}</div>
        </div>
        <TotalsCol ht="$16 700" tva="$2 672" tvaRate={16} remise="− $0" ttc="$19 372" />
      </div>

      {/* Footer */}
      <div style={{ marginTop: 'auto', padding: '22px 48px 28px' }}>
        <div style={{ borderTop: `1px solid ${C.bd}`, paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 8, color: C.t4, lineHeight: 1.6 }}>Merci de votre confiance. Tout retard de paiement entraîne une pénalité de 1,5 % / mois.</div>
          <div style={{ fontSize: 8, color: '#CBD5E1', ...MONO }}>ndembokin.cd</div>
        </div>
      </div>
    </div>
  );
}

// ── Devis template ────────────────────────────────────────────────────────────

function DevisTemplate({ settings }: { settings: Settings }) {
  const agenceNom = settings.agence_nom || 'Ndembo Kin Connect SARL';
  const agenceAddr = settings.agence_adresse || '12, Avenue du Commerce — Gombe\nKinshasa, République Démocratique du Congo';
  const agenceContact = [settings.agence_telephone, settings.agence_email].filter(Boolean).join(' · ');

  const lignes: Ligne[] = [
    { desig: 'Scouting & recrutement', desc: 'Détection de 3 jeunes talents — académies Katanga', qte: 1, pu: '$4 500', tot: '$4 500' },
    { desig: "Organisation d'événement sportif", desc: 'Tournoi de présaison — logistique complète', qte: 1, pu: '$6 200', tot: '$6 200' },
    { desig: 'Coaching tactique (session)', desc: 'Encadrement technique — 6 sessions', qte: 6, pu: '$800', tot: '$4 800' },
  ];

  return (
    <div style={{ width: 794, minHeight: 1123, background: '#fff', boxShadow: '0 6px 28px rgba(0,0,0,0.12)', borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      {/* Header light */}
      <div style={{ background: '#fff', padding: '36px 48px 26px', borderBottom: `2px solid ${C.navy}`, position: 'relative' }}>
        <div style={{ height: 4, background: C.cyan, position: 'absolute', top: 0, left: 0, right: 0 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: C.navy, borderRadius: 11, padding: '9px 11px' }}>
              <img src="/logo.png" style={{ height: 40, width: 'auto', display: 'block' }} alt="" />
            </div>
            <div>
              <div style={{ fontSize: 19, fontWeight: 800, color: C.t0, letterSpacing: -0.3 }}>{settings.agence_nom || 'Ndembo Kin Connect'}</div>
              <div style={{ fontSize: 12, color: C.slate, fontWeight: 600, marginTop: 2 }}>Management & Représentation Sportive</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: C.t0, letterSpacing: 2, lineHeight: 1 }}>DEVIS</div>
            <div style={{ fontSize: 13, color: C.t4, marginTop: 8, ...MONO }}>N° DEV-2026-014</div>
          </div>
        </div>
      </div>

      <MetaRow
        col1Label="Date d'émission" col1Val="12 juin 2026"
        col2Label="Valable jusqu'au" col2Val="12 juillet 2026"
        badge="● Proposition commerciale"
        badgeBg={C.blueBg} badgeBd={C.blueBd} badgeColor={C.blue} badgeText=""
      />

      {/* Émetteur / Client */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '28px 48px 22px', gap: 40 }}>
        <AddressBlock label="Émis par" name={agenceNom} addr={`${agenceAddr}\n${agenceContact}`} legal={[settings.agence_rccm ? `RCCM ${settings.agence_rccm}` : 'RCCM CD/KIN/RCCM/26-B-0042', settings.agence_nif ? `NIF ${settings.agence_nif}` : 'NIF A2604200P'].join('\n')} />
        <div style={{ background: C.bg1, border: `1px solid ${C.bd}`, borderRadius: 12, padding: '18px 20px' }}>
          <AddressBlock label="À l'attention de" name="TP Mazembe" nameFontSize={14} addr={`Club de football professionnel\nStade TP Mazembe — Lubumbashi\n+243 97 333 44 55 · contact@tpmazembe.cd`} legal="RCCM CD/LSH/08-A-0455" />
        </div>
      </div>

      {/* Table */}
      <div style={{ padding: '0 48px' }}>
        <TableHeader dark={false} />
        {lignes.map((l, i) => <TableRow key={i} l={l} alt={i % 2 === 1} bordered={true} />)}
      </div>

      {/* Bottom */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 28, padding: '24px 48px 0', alignItems: 'flex-start' }}>
        <div style={{ border: `1.5px dashed ${C.bd2}`, borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 8, fontWeight: 700, color: C.t4, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>Bon pour accord</div>
          <div style={{ fontSize: 9, color: C.t2, lineHeight: 1.7 }}>Date, nom et signature du client précédés de la mention « Bon pour accord ».</div>
          <div style={{ height: 50, borderBottom: `1px solid ${C.bd2}`, marginTop: 14 }} />
          <div style={{ fontSize: 8, color: C.t4, marginTop: 5 }}>Signature</div>
        </div>
        <TotalsCol ht="$15 500" tva="$2 480" tvaRate={16} remise="− $775" ttc="$17 205" />
      </div>

      {/* Footer */}
      <div style={{ marginTop: 'auto', padding: '22px 48px 28px' }}>
        <div style={{ borderTop: `1px solid ${C.bd}`, paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 8, color: C.t4, lineHeight: 1.6 }}>Devis valable 30 jours. Les prix s'entendent hors frais de déplacement éventuels.</div>
          <div style={{ fontSize: 8, color: '#CBD5E1', ...MONO }}>ndembokin.cd</div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ModelesPage() {
  const [settings, setSettings] = useState<Settings>({});

  useEffect(() => {
    settingsApi.get().then(({ data }) => setSettings(data || {})).catch(() => {});
  }, []);

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', minHeight: '100vh', background: '#F0F2F5', display: 'flex', flexDirection: 'column' }}>

      {/* Topbar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E8ECF1', padding: '0 28px', display: 'flex', alignItems: 'center', height: 60, gap: 12, flexShrink: 0 }}>
        <div style={{ background: C.navy, borderRadius: 8, padding: '4px 5px', lineHeight: 0 }}>
          <img src="/logo.png" alt="NKC" style={{ height: 22, width: 'auto', display: 'block' }} />
        </div>
        <span style={{ fontSize: 13, color: '#94A3B8' }}>/</span>
        <span style={{ fontSize: 16, fontWeight: 800, color: C.t0, letterSpacing: '-0.3px' }}>Modèles Facture & Devis</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B', background: C.bg3, border: `1px solid ${C.bd2}`, padding: '5px 11px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <MI name="visibility" size={14} />
          Aperçu uniquement — génération via PDF
        </span>
      </div>

      {/* Canvas */}
      <div style={{ padding: '40px 48px 56px', flex: 1, overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 56, alignItems: 'flex-start', width: 'max-content' }}>

          {/* Facture */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6B6862', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Modèle — Facture</div>
            <FactureTemplate settings={settings} />
          </div>

          {/* Devis */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6B6862', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Modèle — Devis</div>
            <DevisTemplate settings={settings} />
          </div>

        </div>
      </div>
    </div>
  );
}
