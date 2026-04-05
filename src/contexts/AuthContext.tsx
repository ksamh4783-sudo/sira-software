import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, LoginCredentials, ApiResponse } from '@/types';
import { authApi } from '@/services/localApi';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<ApiResponse<{ token: string; user: User }>>;
  logout: () => void;
  register: (data: { email: string; password: string; name: string; companyName?: string; phone?: string }) => Promise<ApiResponse<null>>;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data on mount
    const currentUser = authApi.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setToken('local-token');
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<ApiResponse<{ token: string; user: User }>> => {
    try {
      const result = await authApi.login(credentials);

      if (result.success && result.data) {
        setToken(result.data.token);
        setUser(result.data.user);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: 'حدث خطأ أثناء تسجيل الدخول',
      };
    }
  };

  const register = async (registerData: { email: string; password: string; name: string; companyName?: string; phone?: string }): Promise<ApiResponse<null>> => {
    try {
      return await authApi.register(registerData);
    } catch (error) {
      return {
        success: false,
        error: 'حدث خطأ أثناء إنشاء الحساب',
      };
    }
  };

  const logout = () => {
    authApi.logout();
    setToken(null);
    setUser(null);
  };

  const refreshUser = () => {
    const currentUser = authApi.getCurrentUser();
    setUser(currentUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        login,
        logout,
        register,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
