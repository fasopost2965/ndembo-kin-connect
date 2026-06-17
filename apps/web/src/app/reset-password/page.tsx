'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { authApi } from '@/lib/api';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenError(true);
    }
  }, [token]);

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordValid = password && password.length >= 8;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError('Lien de réinitialisation invalide');
      return;
    }
    if (!passwordsMatch) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (!passwordValid) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authApi.resetPassword(token, password);
      setSubmitted(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setError('Ce lien a expiré. Veuillez en demander un nouveau.');
    } finally {
      setLoading(false);
    }
  }

  if (tokenError) {
    return (
      <div className="min-h-screen flex">
        {/* Left Side */}
        <div className="hidden lg:flex lg:w-1/2 bg-[#07101A] flex-col justify-center items-center p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#3A6B84]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#FCD116]/5 rounded-full blur-3xl" />
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 rounded-2xl border-2 border-red-500/30 flex items-center justify-center mb-8 mx-auto">
              <div className="text-red-500 text-2xl">⚠️</div>
            </div>
            <h2 className="text-white text-3xl font-bold mb-4">Lien expiré</h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              Ce lien de réinitialisation n'est plus valide.
            </p>
          </div>
        </div>

        {/* Right Side */}
        <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center p-6 lg:p-12">
          <div className="w-full max-w-md mx-auto text-center">
            <div className="inline-flex justify-center mb-6">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#07101A] mb-2">Lien invalide ou expiré</h1>
            <p className="text-slate-600 text-sm mb-6">
              Ce lien de réinitialisation n'est plus valide ou a expiré. Veuillez en demander un nouveau.
            </p>
            <button
              onClick={() => router.push('/forgot-password')}
              className="w-full bg-[#07101A] hover:bg-[#0F172A] text-white font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Demander un nouveau lien
            </button>
            <button
              onClick={() => router.push('/login')}
              className="w-full mt-3 border-2 border-[#07101A] text-[#07101A] hover:bg-slate-50 font-bold py-3 px-4 rounded-lg transition-colors"
            >
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Navy Background */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#07101A] flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#3A6B84]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#FCD116]/5 rounded-full blur-3xl" />

        <div className="relative z-10 text-center">
          <div className="w-16 h-16 rounded-2xl border-2 border-[#FCD116]/30 flex items-center justify-center mb-8 mx-auto">
            <div className="text-[#FCD116] text-2xl">🔑</div>
          </div>

          <h2 className="text-white text-3xl font-bold mb-4">
            Créer un nouveau mot de passe
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            Choisissez un mot de passe fort pour sécuriser votre compte.
          </p>
        </div>
      </div>

      {/* Right Side - White Background */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col justify-center p-6 lg:p-12">
        <div className="w-full max-w-md mx-auto">
          {!submitted ? (
            <>
              {/* Back Button */}
              <button
                onClick={() => router.push('/login')}
                className="flex items-center gap-2 text-slate-600 hover:text-[#3A6B84] transition-colors mb-8 text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour à la connexion
              </button>

              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#07101A] mb-2">
                  Nouveau mot de passe
                </h1>
                <p className="text-slate-600 text-sm">
                  Entrez un mot de passe fort pour sécuriser votre compte.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                    {error}
                  </div>
                )}

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-semibold text-[#07101A] mb-2">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="Minimum 8 caractères"
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
                  {password && password.length < 8 && (
                    <p className="text-xs text-red-600 mt-1">Minimum 8 caractères requis</p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className="block text-sm font-semibold text-[#07101A] mb-2">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Confirmez votre mot de passe"
                      className="w-full px-4 py-3 border border-slate-200 rounded-lg text-[#07101A] placeholder-slate-400 focus:outline-none focus:border-[#FCD116] focus:ring-2 focus:ring-[#FCD116]/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-[#07101A] transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirm ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-xs text-red-600 mt-1">Les mots de passe ne correspondent pas</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !passwordsMatch || !passwordValid}
                  className="w-full bg-[#07101A] hover:bg-[#0F172A] text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                  Réinitialiser le mot de passe
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
                  Mot de passe réinitialisé !
                </h2>
                <p className="text-slate-600 text-sm mb-6">
                  Votre mot de passe a été changé avec succès. Vous allez être redirigé vers la connexion.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 mb-6">
                  Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
                </div>

                <button
                  onClick={() => router.push('/login')}
                  className="w-full bg-[#07101A] hover:bg-[#0F172A] text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  Aller à la connexion
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
