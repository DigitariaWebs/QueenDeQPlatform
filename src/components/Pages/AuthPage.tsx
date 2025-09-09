import { useEffect, useState } from 'react';
import { ParticleCanvas } from '@/components/Effects/ParticleCanvas';
import { login, register, getCurrentUser } from '@/services/authService';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const {
    loginWithRedirect,
    isAuthenticated,
    isLoading: auth0Loading,
    user: auth0User,
  } = useAuth0();

  // Show loading screen during Auth0 authentication
  if (auth0Loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2d133e] via-[#130926] to-black/95 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
          <p className="text-lg">Connexion avec Google...</p>
          <p className="text-sm text-zinc-400 mt-2">
            Veuillez patienter pendant la vérification
          </p>
        </div>
      </div>
    );
  }

  // Check for existing user on mount only
  useEffect(() => {
    const checkExistingUser = () => {
      const user = getCurrentUser();
      if (user) {
        navigate("/", { replace: true });
      }
    };

    // Small delay to prevent immediate redirect conflicts
    const timer = setTimeout(checkExistingUser, 100);
    return () => clearTimeout(timer);
  }, []); // Empty dependency array - only run once

  // Handle search params
  useEffect(() => {
    const m = searchParams.get("mode");
    if (m === "signup" || m === "login") setMode(m);
  }, [searchParams]);

  // Handle Auth0 authentication - simplified
  useEffect(() => {
    if (isAuthenticated && !auth0Loading && auth0User) {
      // Use a longer delay and only navigate once
      const timer = setTimeout(() => {
        navigate("/", { replace: true });
      }, 1000); // Increased delay to allow Auth0 to settle

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, auth0Loading, auth0User, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setError(null);
      await loginWithRedirect({
        authorizationParams: {
          connection: "google-oauth2",
          redirect_uri: window.location.origin,
        },
      });
    } catch (error) {
      console.error("Auth0 login error:", error);
      setError("Failed to initiate Google login. Please try again.");
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res =
        mode === "login"
          ? await login(email, password)
          : await register(name, email, password);
      setLoading(false);
      if (res.success) navigate("/");
      else setError(res.error || "Authentication failed");
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || "Authentication failed");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2d133e] via-[#130926] to-black/95 text-white overflow-hidden">
      <ParticleCanvas />
      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        <div className="backdrop-blur-sm bg-white/10 border border-white/15 rounded-2xl p-8 shadow-2xl text-white">
          <div className="text-center mb-8">
            <img
              src="/assets/images/logo-gold.webp"
              alt="Queen de Q"
              className="mx-auto h-12 w-auto"
            />
            <h2 className="mt-4 text-2xl font-semibold tracking-wide">
              {mode === "login" ? "Bienvenue" : "Crée ton compte"}
            </h2>
            <p className="text-zinc-300 text-sm mt-1">
              Accédez au Salon de thé, à Miroir Miroir et à ton Journal
            </p>
          </div>

          <div className="space-y-4">
            <form onSubmit={onSubmit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block text-sm text-zinc-200 mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400/60 text-white placeholder:text-zinc-400"
                    placeholder="Ton nom"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-sm text-zinc-200 mb-1">
                  E‑mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400/60 text-white placeholder:text-zinc-400"
                  placeholder="vous@exemple.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-200 mb-1">
                  Mot de passe (min 8 caractères)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400/60 text-white placeholder:text-zinc-400"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>

              {error && <div className="text-red-400 text-sm">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 text-black font-medium py-2.5 hover:bg-amber-400 transition-colors disabled:opacity-60"
              >
                {loading
                  ? "Veuillez patienter…"
                  : mode === "login"
                  ? "Se connecter"
                  : "S'inscrire"}
              </button>
            </form>

            {/* <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-zinc-300">ou</span>
              <div className="h-px flex-1 bg-white/10" />
            </div> */}

            <div className="space-y-3">
              <button
                type="button"
                disabled={loading || auth0Loading}
                onClick={handleGoogleLogin}
                className="w-full inline-flex items-center justify-center gap-3 rounded-lg bg-white text-zinc-900 font-medium py-2.5 hover:bg-zinc-100 transition-colors disabled:opacity-60 border border-white/20"
              >
                {auth0Loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-zinc-900"></div>
                ) : (
                  <img
                    src="/assets/icons/google.svg"
                    alt="Google"
                    className="h-5 w-5"
                  />
                )}
                <span>
                  {auth0Loading
                    ? "Connexion en cours..."
                    : "Continuer avec Google"}
                </span>
              </button>
            </div>

            <div className="text-sm text-center text-zinc-300">
              {mode === "login" ? (
                <span>
                  Pas de compte ?{" "}
                  <button
                    className="text-amber-400 hover:underline"
                    onClick={() => setMode("signup")}
                  >
                    Inscris‑toi
                  </button>
                </span>
              ) : (
                <span>
                  Vous avez déjà un compte ?{" "}
                  <button
                    className="text-amber-400 hover:underline"
                    onClick={() => setMode("login")}
                  >
                    Connecte‑toi
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


