import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { type User, type Perfil } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  session: any;
  perfil: Perfil | null;
  loading: boolean;
  error: string | null;
  login: (data: any) => Promise<void>;
  registro: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded user — Cloudflare Access handles real auth
const DEFAULT_USER: User = {
  id: '4dd7f4ec-928a-4b99-8e56-3e1d19cd263a',
  email: 'sergio.porcar@gmail.com',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user] = useState<User | null>(DEFAULT_USER);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load profile from API
    fetch('/api/v1/usuarios/' + DEFAULT_USER.id)
      .then(r => r.ok ? r.json() : null)
      .then(data => setPerfil(data))
      .catch(() => setPerfil(null));
  }, []);

  const login = async () => {};
  const registro = async () => {};
  const logout = async () => {};
  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        session: { user },
        perfil,
        loading,
        error,
        login,
        registro,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
