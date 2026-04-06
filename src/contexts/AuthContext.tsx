import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, LoginCredentials, ApiResponse } from '@/types';
import { authApi } from '@/services/api';

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
    const initAuth = async () => {
      const storedToken = localStorage.getItem('sira_token');
      const storedUser = localStorage.getItem('sira_user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Verify token with backend
        try {
          const result = await authApi.me();
          if (result.success && result.data) {
            setUser(result.data);
            localStorage.setItem('sira_user', JSON.stringify(result.data));
          } else {
            // Token invalid
            logout();
          }
        } catch (error) {
          console.error('Auth verification failed', error);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<ApiResponse<{ token: string; user: User }>> => {
    try {
      const result = await authApi.login(credentials);

      if (result.success && result.data) {
        const { token: newToken, user: newUser } = result.data;
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('sira_token', newToken);
        localStorage.setItem('sira_user', JSON.stringify(newUser));
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
    setToken(null);
    setUser(null);
    localStorage.removeItem('sira_token');
    localStorage.removeItem('sira_user');
  };

  const refreshUser = async () => {
    try {
      const result = await authApi.me();
      if (result.success && result.data) {
        setUser(result.data);
        localStorage.setItem('sira_user', JSON.stringify(result.data));
      }
    } catch (error) {
      console.error('Failed to refresh user', error);
    }
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
