'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { authApi } from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.requestPasswordReset(email);
      setSubmitted(true);
    } catch {
      setError('Une erreur est survenue. Veuillez vérifier votre e-mail.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Navy Background */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#07101A] flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#3A6B84]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#FCD116]/5 rounded-full blur-3xl" />

        <div className="relative z-10 text-center">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <div className="bg-white rounded-xl p-3 shadow-lg">
              <img src="/logo.png" alt="Ndembo Kin Connect" className="h-12 w-auto" />
            </div>
          </div>

          {/* Lock Icon */}
          <div className="w-16 h-16 rounded-2xl border-2 border-[#FCD116]/30 flex items-center justify-center mb-8 mx-auto">
            <div className="text-[#FCD116] text-2xl">🔐</div>
          </div>

          {/* Text */}
          <h2 className="text-white text-3xl font-bold mb-4">
            Réinitialisation sécurisée
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            Un lien de réinitialisation sera envoyé à votre adresse e-mail enregistrée.
          </p>
        </div>
      </div>

      {/* Right Side - White Background */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center p-6 lg:p-12">
        <div className="w-full max-w-md mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.push('/login')}
            className="flex items-center gap-2 text-slate-600 hover:text-[#3A6B84] transition-colors mb-8 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la connexion
          </button>

          {!submitted ? (
            <>
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#07101A] mb-2">
                  Mot de passe oublié ?
                </h1>
                <p className="text-slate-600 text-sm">
                  Entrez votre e-mail et nous vous enverrons un lien de réinitialisation.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
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
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="votre@email.cd"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg text-[#07101A] placeholder-slate-400 focus:outline-none focus:border-[#FCD116] focus:ring-2 focus:ring-[#FCD116]/20 transition-all"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#07101A] hover:bg-[#0F172A] text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                  Envoyer le lien
                  <span className="text-[#FCD116] group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-[#07101A] mb-2">
                  Email envoyé !
                </h2>
                <p className="text-slate-600 text-sm mb-6">
                  Vérifiez votre boîte de réception et cliquez sur le lien pour réinitialiser votre mot de passe.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-800">
                  N'oubliez pas de vérifier votre dossier "Spam" ou "Promotions".
                </div>

                <button
                  onClick={() => router.push('/login')}
                  className="w-full bg-[#07101A] hover:bg-[#0F172A] text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  Retour à la connexion
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
