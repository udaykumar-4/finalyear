import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/user';
import { AuthContextType, LoginPayload, RegisterPayload } from '../types/auth';
import { authService } from '../services/authService';
import { STORAGE_KEYS } from '../api/client';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // App Startup Persistent Login Check
  useEffect(() => {
    const bootstrapAuth = () => {
      try {
        const storedToken = localStorage.getItem(STORAGE_KEYS.userToken);
        const storedUserData = localStorage.getItem(STORAGE_KEYS.userData);

        if (storedToken && storedUserData) {
          setToken(storedToken);
          setUser(JSON.parse(storedUserData));
        }
      } catch (err) {
        console.warn('Failed to load persistent auth state:', err);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login(payload);
      const { token: userToken, ...userData } = response;

      setUser(userData as User);
      setToken(userToken);

      localStorage.setItem(STORAGE_KEYS.userToken, userToken);
      localStorage.setItem(STORAGE_KEYS.userData, JSON.stringify(userData));
    } catch (err: any) {
      const msg = err.message || 'Login failed. Please check your credentials.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.register(payload);
      const { token: userToken, ...userData } = response;

      setUser(userData as User);
      setToken(userToken);

      localStorage.setItem(STORAGE_KEYS.userToken, userToken);
      localStorage.setItem(STORAGE_KEYS.userData, JSON.stringify(userData));
    } catch (err: any) {
      const msg = err.message || 'Registration failed.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      setUser(null);
      setToken(null);
      setError(null);
      localStorage.removeItem(STORAGE_KEYS.userToken);
      localStorage.removeItem(STORAGE_KEYS.userData);
    } catch (err) {
      console.warn('Logout cleanup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  const updateUserInContext = (updatedFields: Partial<User>) => {
    if (user) {
      const newUser = { ...user, ...updatedFields };
      setUser(newUser);
      localStorage.setItem(STORAGE_KEYS.userData, JSON.stringify(newUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
        updateUserInContext,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
