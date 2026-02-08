/**
 * Auth Context
 * Manages authentication state and provides auth-related functionality
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { api, tokenManager } from '../services/api'
import type { User, LoginRequest, RegisterRequest } from '../types/api'

// ==================== Types ====================

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface AuthContextValue extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
  refreshUser: () => Promise<void>
}

// ==================== Context ====================

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// ==================== Provider Props ====================

interface AuthProviderProps {
  children: ReactNode
}

// ==================== Provider ====================

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  })

  // ==================== Load User on Mount ====================

  useEffect(() => {
    const loadUser = async () => {
      const token = tokenManager.getToken()

      if (!token) {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        })
        return
      }

      try {
        const response = await api.getCurrentUser()
        setState({
          user: response.data,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        })
      } catch (error) {
        // Token is invalid, clear it
        tokenManager.clearAll()
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        })
      }
    }

    loadUser()
  }, [])

  // ==================== Listen for Logout Events ====================

  useEffect(() => {
    const handleLogout = () => {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
    }

    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [])

  // ==================== Login ====================

  const login = useCallback(async (credentials: LoginRequest) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await api.login(credentials)
      const { token, refreshToken, user } = response.data

      // Store tokens
      tokenManager.setToken(token)
      tokenManager.setRefreshToken(refreshToken)

      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
    } catch (error: any) {
      const errorMessage =
        error?.error?.message || 'Login failed. Please try again.'

      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      })

      throw error
    }
  }, [])

  // ==================== Register ====================

  const register = useCallback(async (data: RegisterRequest) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await api.register(data)
      const { token, refreshToken, user } = response.data

      // Store tokens
      tokenManager.setToken(token)
      tokenManager.setRefreshToken(refreshToken)

      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
    } catch (error: any) {
      const errorMessage =
        error?.error?.message || 'Registration failed. Please try again.'

      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      })

      throw error
    }
  }, [])

  // ==================== Logout ====================

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      await api.logout()
    } catch (error) {
      // Ignore logout errors, still clear local state
      console.error('Logout error:', error)
    } finally {
      tokenManager.clearAll()
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
    }
  }, [])

  // ==================== Clear Error ====================

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  // ==================== Refresh User ====================

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.getCurrentUser()
      setState((prev) => ({
        ...prev,
        user: response.data,
      }))
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }, [])

  // ==================== Context Value ====================

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
    clearError,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ==================== Hook ====================

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// ==================== Protected Route Wrapper ====================

interface ProtectedRouteProps {
  children: ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  redirectTo = '/login',
}) => {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        navigate(redirectTo, { replace: true })
      } else if (!requireAuth && isAuthenticated) {
        navigate('/projects', { replace: true })
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, navigate])

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show nothing while redirecting
  if (requireAuth && !isAuthenticated) {
    return null
  }

  if (!requireAuth && isAuthenticated) {
    return null
  }

  return <>{children}</>
}

export default AuthContext
