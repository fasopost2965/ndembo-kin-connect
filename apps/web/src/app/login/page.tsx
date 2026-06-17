'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { authApi } from '@/lib/api';

interface DemoAccount {
  role: string;
  email: string;
  initials: string;
  bgColor: string;
  password?: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'Administrateur',
    email: 'admin@ndembokin.cd',
    initials: 'AD',
    bgColor: 'bg-amber-100',
    password: 'demo123'
  },
  {
    role: 'Commercial',
    email: 'commercial@ndembokin.cd',
    initials: 'CC',
    bgColor: 'bg-blue-100',
    password: 'demo123'
  },
  {
    role: 'Coach',
    email: 'coach@ndembokin.cd',
    initials: 'CH',
    bgColor: 'bg-green-100',
    password: 'demo123'
  }
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  function handleDemoAccount(account: DemoAccount) {
    setEmail(account.email);
    setPassword(account.password || '');
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Navy Background */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#07101A] flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#3A6B84]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#FCD116]/5 rounded-full blur-3xl" />

        <div className="relative z-10">
          {/* Logo & Header */}
          <div className="mb-16">
            <div className="inline-flex items-center gap-3 mb-8">
              <div className="bg-white rounded-full p-2.5 w-12 h-12 flex items-center justify-center">
                <div className="w-8 h-8 bg-gradient-to-br from-[#07101A] to-[#3A6B84] rounded-full" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">Ndembo Kin</h1>
                <p className="text-[#FCD116] text-xs font-semibold tracking-wider">CONNECT SARL</p>
              </div>
            </div>

            <h2 className="text-white text-4xl font-bold leading-tight mb-4">
              Gérez vos athlètes, clients et contrats depuis Kinshasa.
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Plateforme CRM conçue pour l'agence sportive Ndembo Kin Connect — sport, business, excellence.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-8">
          <div>
            <div className="text-[#FCD116] text-3xl font-bold mb-1">14</div>
            <p className="text-slate-400 text-xs uppercase tracking-wide">modules actifs</p>
          </div>
          <div>
            <div className="text-[#FCD116] text-3xl font-bold mb-1">5</div>
            <p className="text-slate-400 text-xs uppercase tracking-wide">rôles d'accès</p>
          </div>
          <div>
            <div className="text-[#FCD116] text-3xl font-bold mb-1">PWA</div>
            <p className="text-slate-400 text-xs uppercase tracking-wide">offline-first</p>
          </div>
        </div>
      </div>

      {/* Right Side - White Background */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center p-6 lg:p-12">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo (visible on mobile) */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="bg-[#07101A] rounded-full p-2 w-10 h-10 flex items-center justify-center">
              <div className="w-6 h-6 bg-gradient-to-br from-[#FCD116] to-[#3A6B84] rounded-full" />
            </div>
            <div>
              <h1 className="text-[#07101A] font-bold">Ndembo Kin</h1>
              <p className="text-[#FCD116] text-xs font-semibold">CONNECT</p>
            </div>
          </div>

          {/* Welcome */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#07101A] mb-2">
              Bienvenue 👋
            </h1>
            <p className="text-slate-600 text-sm">
              Connectez-vous à votre espace de travail
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 mb-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-[#07101A] mb-2">
                Adresse e-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="email@ndembokin.cd"
                className="w-full px-4 py-3 border border-slate-200 rounded-lg text-[#07101A] placeholder-slate-400 focus:outline-none focus:border-[#FCD116] focus:ring-2 focus:ring-[#FCD116]/20 transition-all"
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-[#07101A]">
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#3A6B84] hover:text-[#FCD116] text-xs transition-colors"
                >
                  {showPassword ? 'Masquer' : 'Afficher'}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-slate-200 rounded-lg text-[#07101A] placeholder-slate-400 focus:outline-none focus:border-[#FCD116] focus:ring-2 focus:ring-[#FCD116]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-[#07101A] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <button
                type="button"
                className="text-[#3A6B84] hover:text-[#FCD116] text-xs mt-2 font-medium transition-colors"
              >
                Mot de passe oublié ?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#07101A] hover:bg-[#0F172A] text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              Se connecter
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="border-t border-slate-200 pt-8">
            <p className="text-slate-700 text-xs font-semibold uppercase tracking-wider mb-4 text-center">
              Comptes de démonstration
            </p>
            <div className="space-y-3">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleDemoAccount(account)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-[#FCD116] hover:bg-yellow-50/30 transition-all text-left group"
                >
                  <div className={`w-10 h-10 ${account.bgColor} rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm text-slate-700`}>
                    {account.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#07101A]">
                      {account.role}
                    </p>
                    <p className="text-xs text-slate-600 truncate">
                      {account.email}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#FCD116] transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
