import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { configureApiAuth } from "@/lib/api/client";
import { authService, usersService } from "@/lib/api/services";
import {
  getAccessTokenFromStorage,
  getRefreshTokenFromStorage,
  setAccessTokenInStorage,
  setRefreshTokenInStorage,
} from "@/lib/api/tokenStorage";
import { AuthTokens } from "@/lib/api/types";

export interface User {
  id?: string;
  nom: string;
  prenom: string;
  email: string;
  phone?: string;
  role?: string;
  roles: string[];
  permissions: string[];
  photo?: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  login: (user: User) => void;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  completeAuthWithTokens: (tokens: AuthTokens) => Promise<void>;
  logout: () => void;
}

const noop = () => {};

const AuthContext = createContext<AuthContextType>({
  user: null,
  accessToken: null,
  isBootstrapping: true,
  isAuthenticated: false,
  login: noop,
  loginWithCredentials: async () => {},
  completeAuthWithTokens: async () => {},
  logout: noop,
});

function mapMeToUser(me: Awaited<ReturnType<typeof usersService.me>>): User {
  const firstName = (me as any).firstName || (me as any).first_name || "";
  const lastName = (me as any).lastName || (me as any).last_name || "";
  const fallbackName = me.email?.split("@")[0] || "Utilisateur";

  return {
    id: me.sub,
    nom: lastName || "",
    prenom: firstName || fallbackName,
    email: me.email,
    phone: me.phone,
    role: me.role,
    roles: me.roles || [],
    permissions: me.permissions || [],
  };
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(base64);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function mapTokenToUser(token: string): User | null {
  const payload = parseJwtPayload(token);
  if (!payload) return null;

  const email = typeof payload.email === "string" ? payload.email : "";
  const sub = typeof payload.sub === "string" ? payload.sub : undefined;
  const firstName = typeof payload.firstName === "string" ? payload.firstName : "";
  const lastName = typeof payload.lastName === "string" ? payload.lastName : "";
  const fallbackName = email ? email.split("@")[0] : "Utilisateur";

  const permissions = Array.isArray(payload.permissions)
    ? payload.permissions.filter((p): p is string => typeof p === "string")
    : [];

  const roles = Array.isArray(payload.roles)
    ? payload.roles.filter((p): p is string => typeof p === "string")
    : typeof payload.role === "string"
      ? [payload.role]
      : [];

  return {
    id: sub,
    nom: lastName,
    prenom: firstName || fallbackName,
    email,
    role: typeof payload.role === "string" ? payload.role : undefined,
    roles,
    permissions,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => getAccessTokenFromStorage());
  const [refreshToken, setRefreshToken] = useState<string | null>(() => getRefreshTokenFromStorage());
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const accessTokenRef = useRef<string | null>(getAccessTokenFromStorage());
  const refreshTokenRef = useRef<string | null>(getRefreshTokenFromStorage());

  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    accessTokenRef.current = null;
    refreshTokenRef.current = null;
    setAccessTokenInStorage(null);
    setRefreshTokenInStorage(null);
  }, []);

  const applyTokens = useCallback((tokens: AuthTokens) => {
    accessTokenRef.current = tokens.accessToken;
    refreshTokenRef.current = tokens.refreshToken;
    setAccessToken(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);
    setAccessTokenInStorage(tokens.accessToken);
    setRefreshTokenInStorage(tokens.refreshToken);
  }, []);

  const completeAuthWithTokens = useCallback(
    async (tokens: AuthTokens) => {
      applyTokens(tokens);

      try {
        const me = await usersService.me();
        setUser(mapMeToUser(me));
      } catch {
        // Fallback pour garder un login fonctionnel si /users/me est indisponible ou trop restrictif.
        const fallbackUser = mapTokenToUser(tokens.accessToken);
        if (!fallbackUser) {
          throw new Error("Impossible de récupérer le profil utilisateur.");
        }

        setUser(fallbackUser);
      }
    },
    [applyTokens]
  );

  const loginWithCredentials = useCallback(
    async (email: string, password: string) => {
      const tokens = await authService.login(email, password);
      await completeAuthWithTokens(tokens);
    },
    [completeAuthWithTokens]
  );

  useEffect(() => {
    configureApiAuth({
      getAccessToken: () => accessTokenRef.current,
      getRefreshToken: () => refreshTokenRef.current,
      refreshTokens: (token: string) => authService.refresh(token),
      onTokens: (tokens) => {
        applyTokens(tokens);
      },
      onAuthFailure: () => {
        logout();
      },
    });
  }, [applyTokens, logout]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const storedAccessToken = getAccessTokenFromStorage();
        const storedRefreshToken = getRefreshTokenFromStorage();

        if (storedAccessToken) {
          accessTokenRef.current = storedAccessToken;
          setAccessToken(storedAccessToken);

          const tokenUser = mapTokenToUser(storedAccessToken);
          if (tokenUser) {
            setUser(tokenUser);
          }
        }

        if (!storedRefreshToken) {
          setIsBootstrapping(false);
          return;
        }

        const tokens = await authService.refresh(storedRefreshToken);
        await completeAuthWithTokens(tokens);
      } catch {
        logout();
      } finally {
        setIsBootstrapping(false);
      }
    };

    bootstrap();
  }, [completeAuthWithTokens, logout]);

  const login = useCallback((u: User) => setUser(u), []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      accessToken,
      isBootstrapping,
      isAuthenticated: !!user && !!accessToken,
      login,
      loginWithCredentials,
      completeAuthWithTokens,
      logout,
    }),
    [user, accessToken, isBootstrapping, login, loginWithCredentials, completeAuthWithTokens, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
