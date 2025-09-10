import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import type { AuthUser } from '@/services/authService';
import { loginWithAuth0 } from "@/services/authService";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  setUser: (u: AuthUser | null) => void;
  isAuthenticating: boolean; // New flag to track Auth0 sync process
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const {
    isAuthenticated,
    isLoading: auth0Loading,
    user: auth0User,
    getAccessTokenSilently,
  } = useAuth0();

  useEffect(() => {
    // Initial hydrate from localStorage
    try {
      const json = localStorage.getItem("auth_user");
      setUser(json ? (JSON.parse(json) as AuthUser) : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === "auth_user") {
        try {
          setUser(e.newValue ? (JSON.parse(e.newValue) as AuthUser) : null);
        } catch {
          setUser(null);
        }
      }
    };

    const onAuthChanged = () => {
      try {
        const json = localStorage.getItem("auth_user");
        const newUser = json ? (JSON.parse(json) as AuthUser) : null;

        console.log(
          "Auth changed event - setting user:",
          newUser?.email || "null"
        );
        setUser(newUser);
      } catch {
        setUser(null);
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("auth:changed", onAuthChanged as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(
        "auth:changed",
        onAuthChanged as EventListener
      );
    };
  }, []); // Remove user dependency to avoid stale closures

  // Enhanced Auth0 handling - sync with backend database
  useEffect(() => {
    const handleAuth0Login = async () => {
      // Only process Auth0 login if we have all the required data
      if (isAuthenticated && auth0User && !auth0Loading) {
        console.log(
          "Auth0 user authenticated, syncing with backend...",
          auth0User.email
        );
        setIsAuthenticating(true);

        try {
          // Get the Auth0 access token
          const accessToken = await getAccessTokenSilently();
          console.log("Got Auth0 access token, calling backend...");

          // Call our backend to save/update user in database
          const result = await loginWithAuth0(accessToken);

          if (result.success && result.user && result.token) {
            // Backend successfully created/updated user
            console.log(
              "Successfully synced Auth0 user with backend:",
              result.user
            );
            setUser(result.user);
            // saveSession is already called in loginWithAuth0
          } else {
            console.error(
              "Failed to sync Auth0 user with backend:",
              result.error
            );
            // Fallback to client-side user data if backend fails
            const auth0UserData = {
              id: auth0User.sub || "",
              email: auth0User.email || "",
              name: auth0User.name || auth0User.nickname || "Auth0 User",
              role: "Tiare",
              isPremium: false,
              authProvider: "auth0",
            };

            localStorage.setItem("auth_user", JSON.stringify(auth0UserData));
            localStorage.setItem("auth_token", "auth0-session");
            setUser(auth0UserData);
          }
        } catch (error) {
          console.error("Error during Auth0 backend sync:", error);
          // Fallback to client-side storage
          const auth0UserData = {
            id: auth0User.sub || "",
            email: auth0User.email || "",
            name: auth0User.name || auth0User.nickname || "Auth0 User",
            role: "Tiare",
            isPremium: false,
            authProvider: "auth0",
          };

          localStorage.setItem("auth_user", JSON.stringify(auth0UserData));
          localStorage.setItem("auth_token", "auth0-session");
          setUser(auth0UserData);
        } finally {
          setIsAuthenticating(false);
          console.log("Auth0 sync completed, isAuthenticating set to false");
        }

        // Ensure auth state change is propagated
        setTimeout(() => {
          window.dispatchEvent(new Event("auth:changed"));
        }, 50);
      }
    };

    handleAuth0Login();
  }, [isAuthenticated, auth0User, auth0Loading, getAccessTokenSilently]);

  // Ensure loading is false when Auth0 is done and no user is found
  useEffect(() => {
    if (!auth0Loading && !isAuthenticating && !isAuthenticated) {
      setLoading(false);
    }
  }, [auth0Loading, isAuthenticating, isAuthenticated]);

  const value = useMemo(() => {
    // Calculate final loading state
    // We're loading if: initial loading OR Auth0 is loading OR we're syncing with backend
    const finalLoading = loading || auth0Loading || isAuthenticating;

    console.log("AuthContext state:", {
      user: user?.email || null,
      loading,
      auth0Loading,
      isAuthenticating,
      finalLoading,
    });

    return {
      user,
      loading: finalLoading,
      setUser,
      isAuthenticating,
    };
  }, [user, loading, auth0Loading, isAuthenticating]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


