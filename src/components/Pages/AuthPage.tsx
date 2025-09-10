import { useEffect } from "react";
import { ParticleCanvas } from "@/components/Effects/ParticleCanvas";
import { getCurrentUser } from "@/services/authService";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useAuth } from "@/context/AuthContext";

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, isAuthenticating } = useAuth();
  const {
    loginWithRedirect,
    isAuthenticated,
    isLoading: auth0Loading,
    user: auth0User,
  } = useAuth0();

  // Show loading screen during Auth0 authentication or backend sync
  if (auth0Loading || isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2d133e] via-[#130926] to-black/95 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
          <p className="text-lg">
            {auth0Loading ? "Connexion en cours..." : "Synchronisation..."}
          </p>
          <p className="text-sm text-zinc-400 mt-2">
            Veuillez patienter pendant la vérification
          </p>
        </div>
      </div>
    );
  }

  // Navigate to dashboard if user is already authenticated
  useEffect(() => {
    if (
      user &&
      !isAuthenticating &&
      !auth0Loading &&
      window.location.pathname === "/auth"
    ) {
      console.log(
        "AuthPage: User authenticated, navigating to dashboard...",
        user
      );
      // Add small delay to ensure state is settled
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 100);
    }
  }, [user, isAuthenticating, auth0Loading, navigate]);

  // Only handle localStorage user check for non-Auth0 cases
  useEffect(() => {
    // Only check localStorage if Auth0 is not involved at all and not authenticating
    if (
      !isAuthenticated &&
      !auth0Loading &&
      !auth0User &&
      !isAuthenticating &&
      window.location.pathname === "/auth"
    ) {
      const localUser = getCurrentUser();
      if (localUser) {
        // Add small delay to avoid race conditions
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 100);
      }
    }
  }, [isAuthenticated, auth0Loading, auth0User, isAuthenticating, navigate]);

  const handleLogin = async () => {
    try {
      await loginWithRedirect({
        authorizationParams: {
          redirect_uri: window.location.origin,
        },
      });
    } catch (error) {
      console.error("Auth0 login error:", error);
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
              Bienvenue
            </h2>
            <p className="text-zinc-300 text-sm mt-1">
              Accédez au Salon de thé, à Miroir Miroir et à ton Journal
            </p>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              disabled={auth0Loading}
              onClick={handleLogin}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 text-black font-medium py-2.5 hover:bg-amber-400 transition-colors disabled:opacity-60"
            >
              {auth0Loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
              ) : (
                "Se connecter"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
