import { useCallback } from 'react';
import { useAuthStore } from '../stores/authStore.js';
import { authAPI } from '../services/api.js';
import { extractErrorMessage } from '../types/index.js';

export const useAuth = () => {
  const { user, token, isAuthenticated, setUser, setTokens, setLoading, setError, logout: storeLogout, restore } = useAuthStore();

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      try {
        setLoading(true);
        setError(null);

        const response = await authAPI.register({ name, email, password });
        const { accessToken, refreshToken, user } = response.data.data;

        setTokens(accessToken, refreshToken);
        setUser(user);

        // Set default Authorization header for subsequent requests
        const api = await import('../services/api.js');
        api.default.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

        return response.data;
      } catch (error: unknown) {
        const message = extractErrorMessage(error);
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setUser, setTokens]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setLoading(true);
        setError(null);

        const response = await authAPI.login({ email, password });
        const { accessToken, refreshToken, user } = response.data.data;

        setTokens(accessToken, refreshToken);
        setUser(user);

        // Set default Authorization header for subsequent requests
        const api = await import('../services/api.js');
        api.default.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

        return response.data;
      } catch (error: unknown) {
        const message = extractErrorMessage(error);
        setError(message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setUser, setTokens]
  );

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error: unknown) {
      // Silently handle logout errors - user should still be logged out
      const message = extractErrorMessage(error);
      // Log to user's error tracking service here if needed
    } finally {
      storeLogout();
    }
  }, [storeLogout]);

  return {
    user,
    token,
    isAuthenticated,
    register,
    login,
    logout,
    restore,
  };
};
