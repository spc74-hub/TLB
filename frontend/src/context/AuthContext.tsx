import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  supabase,
  type User,
  type Session,
  type Perfil,
  obtenerPerfil,
  iniciarSesion,
  registrarUsuario,
  cerrarSesion,
  type LoginData,
  type RegistroData,
} from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  perfil: Perfil | null;
  loading: boolean;
  error: string | null;
  login: (data: LoginData) => Promise<void>;
  registro: (data: RegistroData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar perfil cuando hay usuario (NO bloqueante)
  const cargarPerfil = async (userId: string) => {
    try {
      const perfilData = await obtenerPerfil(userId);
      setPerfil(perfilData);
    } catch (err) {
      console.error("Error al cargar perfil:", err);
      setPerfil(null);
    }
  };

  // Inicializar autenticación
  useEffect(() => {
    let isMounted = true;

    // Obtener sesión inicial de forma NO bloqueante
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false); // Terminar loading INMEDIATAMENTE

      // Cargar perfil en background (no bloquea)
      if (session?.user) {
        cargarPerfil(session.user.id);
      }
    }).catch((err) => {
      if (!isMounted) return;
      console.error("Error obteniendo sesión:", err);
      setLoading(false);
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Cargar perfil en background
      if (session?.user) {
        cargarPerfil(session.user.id);
      } else {
        setPerfil(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Login
  const login = async (data: LoginData) => {
    try {
      setError(null);
      setLoading(true);
      await iniciarSesion(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al iniciar sesión";
      setError(traducirError(message));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Registro
  const registro = async (data: RegistroData) => {
    try {
      setError(null);
      setLoading(true);
      await registrarUsuario(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al registrarse";
      setError(traducirError(message));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setError(null);
      await cerrarSesion();
      setPerfil(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cerrar sesión";
      setError(message);
      throw err;
    }
  };

  // Limpiar error
  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
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
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}

// Traducir errores comunes de Supabase
function traducirError(message: string): string {
  const traducciones: Record<string, string> = {
    "Invalid login credentials": "Email o contraseña incorrectos",
    "Email not confirmed": "Debes confirmar tu email antes de iniciar sesión",
    "User already registered": "Este email ya está registrado",
    "Password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres",
    "Unable to validate email address: invalid format": "El formato del email no es válido",
    "Email rate limit exceeded": "Demasiados intentos. Espera unos minutos.",
    "Invalid email or password": "Email o contraseña incorrectos",
  };

  return traducciones[message] || message;
}
