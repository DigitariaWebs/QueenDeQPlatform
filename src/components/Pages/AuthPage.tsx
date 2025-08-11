import { useEffect, useState } from 'react';
import { ParticleCanvas } from '@/components/Effects/ParticleCanvas';
import { login, register, getCurrentUser } from '@/services/authService';
import { useNavigate, useSearchParams } from 'react-router-dom';

declare global {
  interface Window {
    google?: any;
  }
}

// const GOOGLE_BUTTON_ID = 'google-login-button';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  // Google auth disabled for testing; using hardcoded credentials via button click
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = getCurrentUser();
    if (user) navigate('/');
  }, [navigate]);

  useEffect(() => {
    const m = searchParams.get('mode');
    if (m === 'signup' || m === 'login') setMode(m);
  }, [searchParams]);

  // Google auth initialization is commented out for test mode

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = mode === 'login'
        ? await login(email, password)
        : await register(name, email, password);
      setLoading(false);
      if (res.success) navigate('/');
      else setError(res.error || 'Authentication failed');
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Authentication failed');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2d133e] via-[#130926] to-black/95 text-white overflow-hidden">
      <ParticleCanvas />
      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        <div className="backdrop-blur-sm bg-white/10 border border-white/15 rounded-2xl p-8 shadow-2xl text-white">
          <div className="text-center mb-8">
            <img src="/assets/images/logo-gold.webp" alt="Queen de Q" className="mx-auto h-12 w-auto" />
            <h2 className="mt-4 text-2xl font-semibold tracking-wide">{mode === 'login' ? 'Bienvenue' : 'Créez votre compte'}</h2>
            <p className="text-zinc-300 text-sm mt-1">Accédez au Salon de thé, à Miroir Miroir et à votre Journal</p>
          </div>

          <div className="space-y-4">
            <form onSubmit={onSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm text-zinc-200 mb-1">Nom</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                   className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400/60 text-white placeholder:text-zinc-400"
                    placeholder="Votre nom"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm text-zinc-200 mb-1">E‑mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400/60 text-white placeholder:text-zinc-400"
                  placeholder="vous@exemple.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-200 mb-1">Mot de passe (min 8 caractères)</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400/60 text-white placeholder:text-zinc-400"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>

              {error && (
                <div className="text-red-400 text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 text-black font-medium py-2.5 hover:bg-amber-400 transition-colors disabled:opacity-60"
              >
                {loading ? 'Veuillez patienter…' : (mode === 'login' ? 'Se connecter' : "S'inscrire")}
              </button>
            </form>

            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-zinc-300">ou</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="space-y-3">
              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  setError(null);
                  const res = await login('mohamed@gmail.com', 'mohamed123');
                  setLoading(false);
                  if (res.success) navigate('/');
                  else setError(res.error || "Échec de l'authentification de test");
                }}
                className="w-full inline-flex items-center justify-center gap-3 rounded-lg bg-white text-zinc-900 font-medium py-2.5 hover:bg-zinc-100 transition-colors disabled:opacity-60 border border-white/20"
              >
                <img src="/assets/icons/google.svg" alt="Google" className="h-5 w-5" />
                <span>Se connecter avec Google</span>
              </button>
              {/* Google rendered button disabled for testing */}
            </div>

            <div className="text-sm text-center text-zinc-300">
              {mode === 'login' ? (
                <span>
                  Pas de compte ?{' '}
                  <button className="text-amber-400 hover:underline" onClick={() => setMode('signup')}>Inscrivez‑vous</button>
                </span>
              ) : (
                <span>
                  Vous avez déjà un compte ?{' '}
                  <button className="text-amber-400 hover:underline" onClick={() => setMode('login')}>Connectez‑vous</button>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


