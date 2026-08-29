import { useState } from 'react';
import { useAuth } from './useAuth.js';
import { useNavigate } from 'react-router-dom';

interface DeleteAccountResponse {
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export const useAccountDeletion = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const deleteAccount = async (password: string): Promise<void> => {
    if (!user?._id) {
      throw new Error('User not found. Please log in again.');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'}/users/${user._id}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ password }),
        }
      );

      // Handle 204 No Content (success)
      if (response.status === 204) {
        // Clear authentication
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        // Log out user
        await logout();

        // Redirect to home/login
        navigate('/login', {
          replace: true,
          state: { message: 'Your account has been deleted successfully.' }
        });
        return;
      }

      // Handle error responses
      const data: DeleteAccountResponse = await response.json();

      if (!response.ok) {
        const errorMessage = data.error?.message || 'Failed to delete account';
        throw new Error(errorMessage);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    deleteAccount,
    isLoading,
    error,
  };
};
