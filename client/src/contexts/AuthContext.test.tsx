/**
 * AuthContext Tests
 * Comprehensive test suite for authentication state management
 */

import React from 'react'
import { render, renderHook, act, waitFor } from '@testing-library/react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth, ProtectedRoute } from './AuthContext'
import { api, tokenManager } from '../services/api'
import type { User } from '../types/api'

// Mock dependencies
jest.mock('../services/api')
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}))

const mockApi = api as jest.Mocked<typeof api>
const mockTokenManager = tokenManager as jest.Mocked<typeof tokenManager>
const mockNavigate = useNavigate as jest.Mock

// Test data
const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  createdAt: '2024-01-01T00:00:00Z',
}

const mockLoginResponse = {
  success: true as const,
  data: {
    user: mockUser,
    token: 'mock-token',
    refreshToken: 'mock-refresh-token',
  },
}

// Wrapper component with router
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <AuthProvider>{children}</AuthProvider>
  </MemoryRouter>
)

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockNavigate.mockReturnValue(jest.fn())
  })

  describe('Initial Loading', () => {
    it('should initialize with loading state', () => {
      mockTokenManager.getToken.mockReturnValue(null)

      const { result } = renderHook(() => useAuth(), { wrapper })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
    })

    it('should load user when token exists', async () => {
      mockTokenManager.getToken.mockReturnValue('existing-token')
      mockApi.getCurrentUser.mockResolvedValue({
        success: true,
        data: mockUser,
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual(mockUser)
      expect(mockApi.getCurrentUser).toHaveBeenCalledTimes(1)
    })

    it('should clear invalid token and set unauthenticated state', async () => {
      mockTokenManager.getToken.mockReturnValue('invalid-token')
      mockApi.getCurrentUser.mockRejectedValue(new Error('Invalid token'))

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
      expect(mockTokenManager.clearAll).toHaveBeenCalled()
    })

    it('should set unauthenticated state when no token exists', async () => {
      mockTokenManager.getToken.mockReturnValue(null)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
      expect(mockApi.getCurrentUser).not.toHaveBeenCalled()
    })
  })

  describe('Login', () => {
    beforeEach(() => {
      mockTokenManager.getToken.mockReturnValue(null)
    })

    it('should login successfully and update state', async () => {
      mockApi.login.mockResolvedValue(mockLoginResponse)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        })
      })

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()

      expect(mockTokenManager.setToken).toHaveBeenCalledWith('mock-token')
      expect(mockTokenManager.setRefreshToken).toHaveBeenCalledWith(
        'mock-refresh-token'
      )
    })

    it('should set loading state during login', async () => {
      mockApi.login.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockLoginResponse), 100)
          })
      )

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const loginPromise = act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        })
      })

      // Should be loading immediately after calling login
      expect(result.current.isLoading).toBe(true)

      await loginPromise
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle login failure with error message', async () => {
      const errorResponse = {
        error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' },
      }
      mockApi.login.mockRejectedValue(errorResponse)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.login({
            email: 'wrong@example.com',
            password: 'wrongpass',
          })
        })
      ).rejects.toEqual(errorResponse)

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.error).toBe('Invalid credentials')
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle login failure with generic error', async () => {
      mockApi.login.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.login({
            email: 'test@example.com',
            password: 'password123',
          })
        })
      ).rejects.toThrow()

      expect(result.current.error).toBe('Login failed. Please try again.')
    })
  })

  describe('Register', () => {
    beforeEach(() => {
      mockTokenManager.getToken.mockReturnValue(null)
    })

    it('should register successfully and update state', async () => {
      const mockRegisterResponse = {
        success: true as const,
        data: {
          user: mockUser,
          token: 'new-token',
          refreshToken: 'new-refresh-token',
        },
      }
      mockApi.register.mockResolvedValue(mockRegisterResponse)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.register({
          email: 'newuser@example.com',
          password: 'SecurePass123!',
        })
      })

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.error).toBeNull()

      expect(mockTokenManager.setToken).toHaveBeenCalledWith('new-token')
      expect(mockTokenManager.setRefreshToken).toHaveBeenCalledWith(
        'new-refresh-token'
      )
    })

    it('should handle registration failure', async () => {
      const errorResponse = {
        error: { message: 'Email already exists', code: 'EMAIL_EXISTS' },
      }
      mockApi.register.mockRejectedValue(errorResponse)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.register({
            email: 'existing@example.com',
            password: 'password123',
          })
        })
      ).rejects.toEqual(errorResponse)

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.error).toBe('Email already exists')
    })

    it('should handle registration failure with generic error', async () => {
      mockApi.register.mockRejectedValue(new Error('Server error'))

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.register({
            email: 'newuser@example.com',
            password: 'password123',
          })
        })
      ).rejects.toThrow()

      expect(result.current.error).toBe('Registration failed. Please try again.')
    })
  })

  describe('Logout', () => {
    it('should logout successfully and clear state', async () => {
      mockTokenManager.getToken.mockReturnValue('existing-token')
      mockApi.getCurrentUser.mockResolvedValue({
        success: true,
        data: mockUser,
      })
      mockApi.logout.mockResolvedValue({ success: true })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.error).toBeNull()
      expect(result.current.isLoading).toBe(false)

      expect(mockTokenManager.clearAll).toHaveBeenCalled()
      expect(mockApi.logout).toHaveBeenCalled()
    })

    it('should clear state even if API logout fails', async () => {
      mockTokenManager.getToken.mockReturnValue('existing-token')
      mockApi.getCurrentUser.mockResolvedValue({
        success: true,
        data: mockUser,
      })
      mockApi.logout.mockRejectedValue(new Error('Logout API error'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
      expect(mockTokenManager.clearAll).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        'Logout error:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Clear Error', () => {
    it('should clear error message', async () => {
      const errorResponse = {
        error: { message: 'Login failed', code: 'LOGIN_FAILED' },
      }
      mockApi.login.mockRejectedValue(errorResponse)
      mockTokenManager.getToken.mockReturnValue(null)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Trigger error
      await expect(
        act(async () => {
          await result.current.login({
            email: 'test@example.com',
            password: 'wrong',
          })
        })
      ).rejects.toEqual(errorResponse)

      expect(result.current.error).toBe('Login failed')

      // Clear error
      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })
  })

  describe('Refresh User', () => {
    it('should refresh user data', async () => {
      mockTokenManager.getToken.mockReturnValue('existing-token')
      mockApi.getCurrentUser
        .mockResolvedValueOnce({
          success: true,
          data: mockUser,
        })
        .mockResolvedValueOnce({
          success: true,
          data: { ...mockUser, email: 'updated@example.com' },
        })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.user?.email).toBe('test@example.com')
      })

      await act(async () => {
        await result.current.refreshUser()
      })

      expect(result.current.user?.email).toBe('updated@example.com')
      expect(mockApi.getCurrentUser).toHaveBeenCalledTimes(2)
    })

    it('should handle refresh user failure gracefully', async () => {
      mockTokenManager.getToken.mockReturnValue('existing-token')
      mockApi.getCurrentUser
        .mockResolvedValueOnce({
          success: true,
          data: mockUser,
        })
        .mockRejectedValueOnce(new Error('Refresh failed'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      await act(async () => {
        await result.current.refreshUser()
      })

      // Should maintain previous user state on error
      expect(result.current.user).toEqual(mockUser)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to refresh user:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Auth Event Listener', () => {
    it('should listen to logout events and update state', async () => {
      mockTokenManager.getToken.mockReturnValue('existing-token')
      mockApi.getCurrentUser.mockResolvedValue({
        success: true,
        data: mockUser,
      })

      const { result } = renderHook(() => useAuth(), { wrapper })

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })

      // Trigger logout event
      act(() => {
        window.dispatchEvent(new Event('auth:logout'))
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
    })

    it('should cleanup event listener on unmount', async () => {
      mockTokenManager.getToken.mockReturnValue(null)

      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

      const { unmount } = renderHook(() => useAuth(), { wrapper })

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'auth:logout',
        expect.any(Function)
      )

      removeEventListenerSpy.mockRestore()
    })
  })

  describe('useAuth Hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      expect(() => {
        renderHook(() => useAuth())
      }).toThrow('useAuth must be used within an AuthProvider')

      consoleSpy.mockRestore()
    })
  })

  describe('ProtectedRoute', () => {
    it('should show loading spinner while loading', () => {
      mockTokenManager.getToken.mockReturnValue('token')
      mockApi.getCurrentUser.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () => resolve({ success: true, data: mockUser }),
              100
            )
          })
      )

      const { container } = render(
        <MemoryRouter>
          <AuthProvider>
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          </AuthProvider>
        </MemoryRouter>
      )

      expect(container.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('should redirect unauthenticated user to login', async () => {
      mockTokenManager.getToken.mockReturnValue(null)
      const mockNav = jest.fn()
      mockNavigate.mockReturnValue(mockNav)

      render(
        <MemoryRouter>
          <AuthProvider>
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          </AuthProvider>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(mockNav).toHaveBeenCalledWith('/login', { replace: true })
      })
    })

    it('should show protected content for authenticated user', async () => {
      mockTokenManager.getToken.mockReturnValue('token')
      mockApi.getCurrentUser.mockResolvedValue({
        success: true,
        data: mockUser,
      })

      const { getByText } = render(
        <MemoryRouter>
          <AuthProvider>
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          </AuthProvider>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(getByText('Protected Content')).toBeInTheDocument()
      })
    })

    it('should redirect authenticated user away from public routes', async () => {
      mockTokenManager.getToken.mockReturnValue('token')
      mockApi.getCurrentUser.mockResolvedValue({
        success: true,
        data: mockUser,
      })
      const mockNav = jest.fn()
      mockNavigate.mockReturnValue(mockNav)

      render(
        <MemoryRouter>
          <AuthProvider>
            <ProtectedRoute requireAuth={false}>
              <div>Login Page</div>
            </ProtectedRoute>
          </AuthProvider>
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(mockNav).toHaveBeenCalledWith('/projects', { replace: true })
      })
    })
  })
})
