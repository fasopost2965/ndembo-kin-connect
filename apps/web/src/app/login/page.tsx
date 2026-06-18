'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';

function MI({ name, size = 16, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  return (
    <span
      className="material-icons-outlined select-none leading-none"
      style={{ fontSize: size, display: 'inline-flex', alignItems: 'center', ...style }}
    >
      {name}
    </span>
  );
}

const DEMO_ACCOUNTS = [
  {
    role: 'Administrateur',
    email: 'admin@ndembokin.cd',
    password: 'demo123',
    initials: 'AD',
    avatarStyle: { background: 'linear-gradient(135deg,#DAA520,#FCD116)', color: '#07101A' },
  },
  {
    role: 'Commercial',
    email: 'commercial@ndembokin.cd',
    password: 'demo123',
    initials: 'CC',
    avatarStyle: { background: 'linear-gradient(135deg,#3A6B84,#2563EB)', color: '#fff' },
  },
  {
    role: 'Coach',
    email: 'coach@ndembokin.cd',
    password: 'demo123',
    initials: 'CH',
    avatarStyle: { background: 'linear-gradient(135deg,#059669,#10B981)', color: '#fff' },
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.login(email, password);
      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch {
      setError('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#F0F2F5', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>

      {/* ── Left panel (42%) ── */}
      <div
        className="hidden lg:flex flex-col justify-between relative overflow-hidden shrink-0"
        style={{ width: '42%', background: '#07101A', padding: '48px 40px' }}
      >
        {/* Halos décoratifs */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'rgba(58,107,132,0.08)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: 'rgba(252,209,22,0.05)', filter: 'blur(50px)' }} />

        {/* Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-white rounded-[10px] px-1.5 py-1 flex items-center justify-center"
              style={{ height: 40 }}>
              <img src="/logo.png" alt="NKC" className="h-7 w-auto" />
            </div>
            <div>
              <div className="font-extrabold text-white text-[15px] leading-tight">Ndembo Kin</div>
              <div className="font-bold text-[9px] tracking-[1.5px] uppercase" style={{ color: 'rgba(252,209,22,0.55)' }}>
                CONNECT SARL
              </div>
            </div>
          </div>

          <h2 className="text-white font-extrabold text-[32px] leading-[1.15] tracking-[-0.6px] mb-4">
            Gérez vos athlètes,<br />clients et contrats<br />depuis Kinshasa.
          </h2>
          <p className="text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Plateforme CRM conçue pour l'agence sportive<br />Ndembo Kin Connect — sport, business, excellence.
          </p>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-5">
          {[
            { value: '14', label: 'Modules actifs' },
            { value: '5', label: "Rôles d'accès" },
            { value: 'PWA', label: 'Offline-first' },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-xl p-4"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(252,209,22,0.08)',
              }}
            >
              <div className="text-[28px] font-black leading-none mb-1" style={{ color: '#FCD116' }}>{s.value}</div>
              <div className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel (58%) ── */}
      <div
        className="flex-1 flex flex-col items-center justify-center"
        style={{ background: '#F0F2F5', padding: '32px 24px' }}
      >
        {/* Logo mobile */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="bg-[#07101A] rounded-[10px] px-1.5 py-1 flex items-center justify-center">
            <img src="/logo.png" alt="NKC" className="h-7 w-auto" />
          </div>
          <div>
            <div className="font-extrabold text-[#07101A] text-[15px]">Ndembo Kin</div>
            <div className="font-bold text-[9px] tracking-[1.5px] uppercase" style={{ color: '#FCD116' }}>
              CONNECT SARL
            </div>
          </div>
        </div>

        {/* Form card */}
        <div
          className="w-full"
          style={{
            maxWidth: 430,
            background: '#fff',
            borderRadius: 20,
            boxShadow: '0 4px 24px rgba(15,23,42,0.06)',
            padding: 40,
          }}
        >
          <div className="mb-7">
            <div className="text-[24px] font-extrabold mb-1" style={{ color: '#0F172A' }}>
              Connexion
            </div>
            <div className="text-[14px]" style={{ color: '#64748B' }}>
              Accédez à votre espace de gestion
            </div>
          </div>

          {error && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-[13px] font-medium mb-5"
              style={{ background: '#FFF1F2', border: '1px solid #FECDD3', color: '#BE123C' }}
            >
              <MI name="error_outline" size={16} style={{ color: '#BE123C' }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#334155' }}>
                Adresse e-mail
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-0 bottom-0 flex items-center pointer-events-none">
                  <MI name="mail_outline" size={16} style={{ color: '#94A3B8' }} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="email@ndembokin.cd"
                  style={{
                    width: '100%',
                    paddingLeft: 40,
                    paddingRight: 14,
                    paddingTop: 11,
                    paddingBottom: 11,
                    borderRadius: 10,
                    border: '1.5px solid #E2E8F0',
                    background: '#FAFBFC',
                    color: '#0F172A',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color .15s, box-shadow .15s',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#3A6B84';
                    e.target.style.boxShadow = '0 0 0 3px rgba(58,107,132,0.12)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#E2E8F0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[13px] font-semibold" style={{ color: '#334155' }}>
                  Mot de passe
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[12px] font-semibold hover:underline"
                  style={{ color: '#3A6B84' }}
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-0 bottom-0 flex items-center pointer-events-none">
                  <MI name="lock_outline" size={16} style={{ color: '#94A3B8' }} />
                </div>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    paddingLeft: 40,
                    paddingRight: 44,
                    paddingTop: 11,
                    paddingBottom: 11,
                    borderRadius: 10,
                    border: '1.5px solid #E2E8F0',
                    background: '#FAFBFC',
                    color: '#0F172A',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color .15s, box-shadow .15s',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = '#3A6B84';
                    e.target.style.boxShadow = '0 0 0 3px rgba(58,107,132,0.12)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = '#E2E8F0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-0 bottom-0 flex items-center"
                >
                  <MI
                    name={showPwd ? 'visibility_off' : 'visibility'}
                    size={17}
                    style={{ color: '#94A3B8' }}
                  />
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 font-bold text-[14px] rounded-[10px] transition-all"
              style={{
                marginTop: 4,
                padding: '13px 24px',
                background: loading ? '#132730' : '#07101A',
                color: '#FCD116',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
                border: 'none',
              }}
            >
              {loading ? (
                <>
                  <span
                    className="w-4 h-4 rounded-full border-2 border-[#FCD116] border-t-transparent"
                    style={{ animation: 'spin 0.7s linear infinite' }}
                  />
                  Connexion…
                </>
              ) : (
                <>
                  Se connecter
                  <MI name="arrow_forward" size={16} style={{ color: '#FCD116' }} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Demo accounts */}
        <div className="w-full mt-5" style={{ maxWidth: 430 }}>
          <div
            className="text-center text-[11px] font-bold uppercase tracking-[1.5px] mb-3"
            style={{ color: '#94A3B8' }}
          >
            Comptes de démonstration
          </div>
          <div className="flex flex-col gap-2">
            {DEMO_ACCOUNTS.map(acc => (
              <button
                key={acc.email}
                type="button"
                onClick={() => {
                  setEmail(acc.email);
                  setPassword(acc.password);
                }}
                className="flex items-center gap-3 w-full text-left transition-all"
                style={{
                  background: '#fff',
                  border: '1px solid #E8ECF1',
                  borderRadius: 12,
                  padding: '11px 14px',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#3A6B84';
                  (e.currentTarget as HTMLButtonElement).style.background = '#F8FBFC';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#E8ECF1';
                  (e.currentTarget as HTMLButtonElement).style.background = '#fff';
                }}
              >
                <div
                  className="flex items-center justify-center text-[9px] font-black shrink-0"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    fontSize: 9,
                    fontWeight: 800,
                    ...acc.avatarStyle,
                  }}
                >
                  {acc.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold" style={{ color: '#0F172A' }}>{acc.role}</div>
                  <div className="text-[11px] truncate" style={{ color: '#94A3B8' }}>{acc.email}</div>
                </div>
                <MI name="chevron_right" size={16} style={{ color: '#CBD5E1' }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
