'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

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

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [step, setStep]         = useState<'email' | 'sent'>('email');
  const [loading, setLoading]   = useState(false);
  const [showError, setShowError] = useState(false);

  async function handleSend() {
    if (!email || !email.includes('@')) { setShowError(true); return; }
    setLoading(true);
    setShowError(false);
    try {
      await authApi.requestPasswordReset(email);
      setStep('sent');
    } catch {
      setShowError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>

      {/* LEFT PANEL */}
      <div style={{ width: '42%', background: '#07101A', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px 52px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: -100, right: -80, width: 340, height: 340, borderRadius: '50%', border: '1px solid rgba(252,209,22,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -60, width: 260, height: 260, borderRadius: '50%', border: '1px solid rgba(58,107,132,0.12)', pointerEvents: 'none' }} />
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '10px 13px', display: 'inline-block', marginBottom: 32 }}>
            <img src="/logo.png" alt="NKC" style={{ height: 44, width: 'auto', display: 'block' }} />
          </div>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(252,209,22,0.08)', border: '1px solid rgba(252,209,22,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <MI name="lock_reset" size={32} color="#FCD116" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 10, letterSpacing: '-0.4px' }}>Réinitialisation<br/>sécurisée</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, maxWidth: 240, margin: '0 auto' }}>Un lien de réinitialisation sera envoyé à votre adresse e-mail enregistrée.</div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, background: '#F0F2F5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {step === 'email' && (
            <>
              <div style={{ marginBottom: 32 }}>
                <button
                  onClick={() => router.push('/login')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 24, fontFamily: 'inherit', padding: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#3A6B84')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#64748B')}
                >
                  <MI name="arrow_back" size={16} color="currentColor" />
                  Retour à la connexion
                </button>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px', marginBottom: 8 }}>Mot de passe oublié ?</div>
                <div style={{ fontSize: 14, color: '#64748B' }}>Entrez votre e-mail et nous vous enverrons un lien de réinitialisation.</div>
              </div>

              <div style={{ background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 4px 24px rgba(15,23,42,0.06)', border: '1px solid #E8ECF1' }}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 7 }}>Adresse e-mail</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'inline-flex' }}>
                      <MI name="email" size={18} color="#94A3B8" />
                    </span>
                    <input
                      type="email"
                      placeholder="votre@email.cd"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setShowError(false); }}
                      onKeyDown={e => e.key === 'Enter' && handleSend()}
                      style={{ width: '100%', padding: '13px 14px 13px 44px', border: '1.5px solid #E2E8F0', borderRadius: 11, fontSize: 14, fontFamily: 'inherit', color: '#0F172A', outline: 'none', background: '#FAFBFC', boxSizing: 'border-box' }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#3A6B84'; e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(58,107,132,0.08)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FAFBFC'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                  </div>
                </div>

                {showError && (
                  <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: 9, padding: '10px 14px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MI name="error_outline" size={16} color="#BE123C" />
                    <div style={{ fontSize: 13, color: '#BE123C' }}>E-mail non reconnu. Vérifiez votre saisie.</div>
                  </div>
                )}

                <button
                  onClick={handleSend}
                  disabled={loading}
                  style={{ width: '100%', padding: 14, background: '#07101A', color: '#FCD116', fontSize: 15, fontWeight: 700, border: 'none', borderRadius: 11, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#132730'; }}
                  onMouseLeave={e => (e.currentTarget.style.background = '#07101A')}
                >
                  {loading
                    ? <span style={{ width: 16, height: 16, border: '2px solid rgba(252,209,22,0.3)', borderTopColor: '#FCD116', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                    : <>
                        <span>Envoyer le lien</span>
                        <MI name="send" size={18} color="#FCD116" />
                      </>
                  }
                </button>
              </div>
            </>
          )}

          {step === 'sent' && (
            <div style={{ background: '#fff', borderRadius: 20, padding: '40px 32px', boxShadow: '0 4px 24px rgba(15,23,42,0.06)', border: '1px solid #E8ECF1', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <MI name="mark_email_read" size={28} color="#059669" />
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 10, letterSpacing: '-0.3px' }}>E-mail envoyé !</div>
              <div style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 8 }}>Vérifiez votre boîte de réception à</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#3A6B84', marginBottom: 24 }}>{email}</div>
              <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 24, lineHeight: 1.6 }}>
                Le lien expire dans <strong style={{ color: '#334155' }}>30 minutes</strong>. Vérifiez également vos spams.
              </div>
              <button
                onClick={() => setStep('email')}
                style={{ width: '100%', padding: 12, background: '#F1F5F9', color: '#334155', fontSize: 14, fontWeight: 600, border: '1px solid #E2E8F0', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#E2E8F0')}
                onMouseLeave={e => (e.currentTarget.style.background = '#F1F5F9')}
              >
                Renvoyer l'e-mail
              </button>
              <button
                onClick={() => router.push('/login')}
                style={{ display: 'block', marginTop: 14, fontSize: 13, color: '#3A6B84', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%' }}
              >
                ← Retour à la connexion
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
