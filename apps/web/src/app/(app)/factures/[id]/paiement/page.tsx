'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

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

const OPERATEURS = [
  { id: 'mpesa',  name: 'M-Pesa',       sub: 'Vodacom Congo', emoji: '🟥', color: '#E30613' },
  { id: 'airtel', name: 'Airtel Money',  sub: 'Airtel Congo',  emoji: '🟧', color: '#ED1C24' },
  { id: 'orange', name: 'Orange Money',  sub: 'Orange RDC',    emoji: '🟠', color: '#FF7900' },
  { id: 'virement', name: 'Virement',    sub: 'Bancaire',      emoji: '🏦', color: '#3A6B84' },
];

const SHORTCUTS = [500, 1000, 2000, 3200];

type Step = 'form' | 'pending' | 'success';

export default function PaiementPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [step, setStep]         = useState<Step>('form');
  const [operateur, setOperateur] = useState('mpesa');
  const [phone, setPhone]       = useState('');
  const [montant, setMontant]   = useState<string>('');

  const soldeRestant = 3200;
  const soldeDepasse = Number(montant) > soldeRestant;

  function handlePay() {
    if (!phone || !montant || soldeDepasse) return;
    setStep('pending');
    setTimeout(() => setStep('success'), 2500);
  }

  const op = OPERATEURS.find(o => o.id === operateur) ?? OPERATEURS[0];

  return (
    <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', minHeight: '100vh', background: '#F0F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {step === 'form' && (
          <div style={{ background: '#fff', borderRadius: 24, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.1)' }}>
            {/* Header */}
            <div style={{ background: '#07101A', padding: '24px 26px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(252,209,22,0.1)', border: '1px solid rgba(252,209,22,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MI name="smartphone" size={22} color="#FCD116" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Paiement Mobile Money</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>FlexPay · RDC</div>
                </div>
              </div>
              {/* Invoice linked */}
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Facture</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>FAC-2026-{id?.padStart(3, '0') ?? '009'}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>AS Vita Club · 15 juin 2026</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>Solde restant</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#FCD116', letterSpacing: '-0.4px' }}>${soldeRestant.toLocaleString('fr-FR')}</div>
                </div>
              </div>
            </div>
            {/* Body */}
            <div style={{ padding: '24px 26px' }}>
              {/* Opérateur */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Opérateur</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {OPERATEURS.map(o => (
                    <div
                      key={o.id}
                      onClick={() => setOperateur(o.id)}
                      style={{
                        padding: '14px 16px', borderRadius: 12, cursor: 'pointer', border: `2px solid ${operateur === o.id ? o.color : '#E2E8F0'}`,
                        background: operateur === o.id ? '#F8FAFC' : '#fff', textAlign: 'center', transition: 'border-color 0.15s',
                      }}
                    >
                      <div style={{ fontSize: 22, marginBottom: 4 }}>{o.emoji}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{o.name}</div>
                      <div style={{ fontSize: 10, color: '#94A3B8' }}>{o.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Numéro */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Numéro {op.name}</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: '#94A3B8', fontWeight: 600 }}>+243</span>
                  <input
                    type="tel"
                    placeholder="8X XXX XXXX"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    maxLength={10}
                    style={{ width: '100%', padding: '13px 14px 13px 56px', border: '1.5px solid #E2E8F0', borderRadius: 12, fontSize: 15, fontFamily: 'inherit', color: '#0F172A', outline: 'none', background: '#FAFBFC', letterSpacing: 1 }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#3A6B84'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(58,107,132,0.08)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FAFBFC'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>
              {/* Montant */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Montant (USD)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: '#94A3B8', fontWeight: 700 }}>$</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={montant}
                    onChange={e => setMontant(e.target.value)}
                    min={1} max={soldeRestant}
                    style={{ width: '100%', padding: '13px 14px 13px 32px', border: `1.5px solid ${soldeDepasse ? '#FECDD3' : '#E2E8F0'}`, borderRadius: 12, fontSize: 16, fontFamily: 'inherit', fontWeight: 700, color: '#0F172A', outline: 'none', background: '#FAFBFC' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#3A6B84'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(58,107,132,0.08)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = soldeDepasse ? '#FECDD3' : '#E2E8F0'; e.currentTarget.style.background = '#FAFBFC'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {SHORTCUTS.map(s => (
                    <button
                      key={s}
                      onClick={() => setMontant(String(s))}
                      style={{ flex: 1, padding: '6px 0', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#475569', cursor: 'pointer', fontFamily: 'inherit' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#E2E8F0')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#F1F5F9')}
                    >
                      ${s.toLocaleString('fr-FR')}
                    </button>
                  ))}
                </div>
              </div>
              {/* Alerte solde dépassé */}
              {soldeDepasse && (
                <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <MI name="warning" size={16} color="#BE123C" />
                  <div style={{ fontSize: 12, color: '#BE123C', fontWeight: 600 }}>Le montant dépasse le solde restant (${soldeRestant.toLocaleString('fr-FR')}).</div>
                </div>
              )}
              {/* Bouton */}
              <button
                onClick={handlePay}
                disabled={!phone || !montant || soldeDepasse}
                style={{ width: '100%', padding: 15, background: '#07101A', color: '#FCD116', fontSize: 15, fontWeight: 800, border: 'none', borderRadius: 13, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, opacity: (!phone || !montant || soldeDepasse) ? 0.5 : 1 }}
                onMouseEnter={e => { if (!(!phone || !montant || soldeDepasse)) (e.currentTarget.style.background = '#132730'); }}
                onMouseLeave={e => (e.currentTarget.style.background = '#07101A')}
              >
                <MI name="payment" size={20} color="#FCD116" />
                Initier le paiement
              </button>
              <div style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8', marginTop: 10 }}>Sécurisé par FlexPay · Confirmation par SMS</div>
            </div>
          </div>
        )}

        {step === 'pending' && (
          <div style={{ background: '#fff', borderRadius: 24, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.1)' }}>
            <div style={{ background: '#07101A', padding: '24px 26px 20px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(252,209,22,0.1)', border: '1px solid rgba(252,209,22,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <MI name="hourglass_top" size={26} color="#FCD116" />
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Paiement en attente</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Validation FlexPay en cours…</div>
            </div>
            <div style={{ padding: '32px 26px', textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #E2E8F0', borderTopColor: '#3A6B84', margin: '0 auto 16px', animation: 'spin 0.7s linear infinite' }} />
              <div style={{ fontSize: 14, color: '#475569' }}>Attente de confirmation du paiement…</div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 6 }}>Vous recevrez un SMS de confirmation</div>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div style={{ background: '#fff', borderRadius: 24, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.1)' }}>
            <div style={{ background: '#059669', padding: '32px 26px', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <MI name="check_circle" size={36} color="#fff" />
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Paiement confirmé !</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>REG-2026-{String(Date.now()).slice(-3)} généré</div>
            </div>
            <div style={{ padding: '28px 26px' }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>Montant payé</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#059669', fontFamily: 'monospace' }}>${Number(montant).toLocaleString('fr-FR')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>Opérateur</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{op.name}</span>
                </div>
              </div>
              <button
                onClick={() => router.push('/reglements')}
                style={{ width: '100%', padding: '13px', background: '#07101A', color: '#FCD116', fontSize: 14, fontWeight: 700, border: 'none', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Voir les règlements
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
