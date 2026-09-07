import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient, { tokenManager } from '../lib/api-client';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  profile_image_url?: string | null;
  is_verified?: boolean;
  phone_number?: string;
  location_city?: string;
  location_country?: string;
  wallet_balance?: number | string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string } | any, explicitToken?: string) => Promise<void>;
  signup: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    locationCity?: string;
  }) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => tokenManager.getUser<User>());
  const [token, setToken] = useState<string | null>(() => tokenManager.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get('/users/me');
      if (res.data?.success && res.data?.data) {
        const fetchedUser = res.data.data;
        setUser(fetchedUser);
        tokenManager.setUser(fetchedUser);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        logout();
      }
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = tokenManager.getToken();
      if (storedToken) {
        setToken(storedToken);
        await fetchProfile();
      } else {
        tokenManager.removeToken();
        setUser(null);
        setToken(null);
      }
      setIsLoading(false);
    };

    initAuth();

    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('clickflicks:client-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('clickflicks:client-unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (credentials: any, explicitToken?: string) => {
    setIsLoading(true);
    try {
      if (explicitToken && credentials?.id) {
        setUser(credentials);
        setToken(explicitToken);
        tokenManager.setToken(explicitToken);
        tokenManager.setUser(credentials);
        fetchProfile().catch(() => {});
        return;
      }

      const res = await apiClient.post('/auth/login', {
        email: credentials.email.trim(),
        password: credentials.password,
      });

      if (res.data?.success && res.data?.data) {
        const { user: authUser, token: authToken } = res.data.data;
        
        if (authUser.user_type !== 'CLIENT') {
          throw new Error('This account is registered as a Photographer. Please use the ClickFlicks Photographer app.');
        }

        setUser(authUser);
        setToken(authToken);
        tokenManager.setToken(authToken);
        tokenManager.setUser(authUser);
        // Ensure all latest fields (phone, avatar, verified) are refreshed
        fetchProfile().catch(() => {});
      } else {
        throw new Error(res.data?.message || 'Invalid email or password');
      }
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        throw new Error('Cannot reach server. Please check your internet connection and try again.');
      }
      const message = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    locationCity?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/register', {
        email: userData.email.trim(),
        password: userData.password,
        first_name: userData.firstName.trim(),
        last_name: userData.lastName.trim(),
        phone_number: userData.phoneNumber,
        user_type: 'CLIENT',
        location_city: userData.locationCity || 'Accra',
        location_country: 'Ghana',
      });

      if (res.data?.success && res.data?.data) {
        const { user: authUser, token: authToken } = res.data.data;
        setUser(authUser);
        setToken(authToken);
        tokenManager.setToken(authToken);
        tokenManager.setUser(authUser);
        // Ensure all latest fields (phone, avatar, verified) are refreshed
        fetchProfile().catch(() => {});
      } else {
        throw new Error(res.data?.message || 'Registration failed');
      }
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        throw new Error('Cannot reach server. Please check your internet connection and try again.');
      }
      const message = err.response?.data?.message || err.message || 'Registration failed. Please check your details.';
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    tokenManager.removeToken();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        signup,
        logout,
        fetchProfile,
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
