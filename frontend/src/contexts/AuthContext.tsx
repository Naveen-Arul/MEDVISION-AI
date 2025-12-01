import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/lib/api";
import { authService } from "@/lib/services";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: "patient" | "doctor") => Promise<void>;
  signup: (userData: any, role: "patient" | "doctor") => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = authService.getToken();
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Verify token with backend
      const response = await authService.verifyToken();
      
      if (response.success && response.data?.user) {
        setUser(response.data.user);
      } else {
        // Token invalid, remove it
        authService.setToken(null);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      authService.setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, role: "patient" | "doctor") => {
    try {
      setIsLoading(true);
      
      const response = await authService.login({ email, password });
      
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        
        // Role-based redirect
        if (response.data.user.role === "patient") {
          navigate("/patient/dashboard");
        } else {
          navigate("/doctor/dashboard");
        }
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: any, role: "patient" | "doctor") => {
    try {
      setIsLoading(true);
      
      const response = await authService.register({
        ...userData,
        role,
      });
      
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        
        // Role-based redirect
        if (response.data.user.role === "patient") {
          navigate("/patient/dashboard");
        } else {
          navigate("/doctor/dashboard");
        }
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      
      await authService.logout();
      setUser(null);
      navigate("/");
    } catch (error) {
      console.error('Logout error:', error);
      // Clear user anyway
      setUser(null);
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        isLoading,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
