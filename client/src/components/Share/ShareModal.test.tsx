/**
 * ShareModal Tests
 * Unit tests for the ShareModal component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ShareModal } from './ShareModal'

// Mock the hooks
jest.mock('../../hooks', () => ({
  useShareLinks: jest.fn(),
  useCreateShareLink: jest.fn(),
  useRevokeShareLink: jest.fn(),
}))

import {
  useShareLinks,
  useCreateShareLink,
  useRevokeShareLink,
} from '../../hooks'

const mockUseShareLinks = useShareLinks as jest.MockedFunction<
  typeof useShareLinks
>
const mockUseCreateShareLink = useCreateShareLink as jest.MockedFunction<
  typeof useCreateShareLink
>
const mockUseRevokeShareLink = useRevokeShareLink as jest.MockedFunction<
  typeof useRevokeShareLink
>

// Test data
const mockShareLinks = [
  {
    id: 'link-1',
    projectId: 'project-123',
    token: 'abc123',
    accessType: 'readonly' as const,
    expiresAt: new Date('2025-12-31'),
    createdAt: new Date('2024-01-01'),
    createdBy: {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
    },
    accessCount: 5,
    lastAccessedAt: new Date('2024-06-15'),
  },
  {
    id: 'link-2',
    projectId: 'project-123',
    token: 'xyz789',
    accessType: 'editable' as const,
    expiresAt: null,
    createdAt: new Date('2024-02-01'),
    createdBy: {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
    },
    accessCount: 12,
    lastAccessedAt: new Date('2024-06-20'),
  },
]

// Helper to render with providers
const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  )
}

describe('ShareModal', () => {
  const defaultProps = {
    projectId: 'project-123',
    projectName: 'Test Project',
    isOpen: true,
    onClose: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementations
    mockUseShareLinks.mockReturnValue({
      data: {
        success: true,
        data: {
          shareLinks: mockShareLinks,
          total: mockShareLinks.length,
        },
      },
      isLoading: false,
      error: null,
    } as any)

    mockUseCreateShareLink.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
    } as any)

    mockUseRevokeShareLink.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    } as any)

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    })

    // Mock window.confirm
    global.confirm = jest.fn(() => true)
  })

  describe('Rendering', () => {
    it('does not render when closed', () => {
      renderWithProviders(<ShareModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByText('Share Project')).not.toBeInTheDocument()
    })

    it('renders when open', () => {
      renderWithProviders(<ShareModal {...defaultProps} />)
      expect(screen.getByText('Share Project')).toBeInTheDocument()
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })

    it('renders access type toggles', () => {
      renderWithProviders(<ShareModal {...defaultProps} />)
      expect(screen.getByText('View Only')).toBeInTheDocument()
      expect(screen.getByText('Can Edit')).toBeInTheDocument()
    })

    it('renders expiration options', () => {
      renderWithProviders(<ShareModal {...defaultProps} />)
      expect(screen.getByText('24 hours')).toBeInTheDocument()
      expect(screen.getByText('7 days')).toBeInTheDocument()
      expect(screen.getByText('30 days')).toBeInTheDocument()
      expect(screen.getByText('Never expires')).toBeInTheDocument()
    })
  })

  describe('Share Link Creation', () => {
    it('creates readonly link with default settings', () => {
      const mutateFn = jest.fn()
      mockUseCreateShareLink.mockReturnValue({
        mutate: mutateFn,
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any)

      renderWithProviders(<ShareModal {...defaultProps} />)

      const generateButton = screen.getByText('Generate Share Link')
      fireEvent.click(generateButton)

      expect(mutateFn).toHaveBeenCalledWith({
        projectId: 'project-123',
        accessType: 'readonly',
        expirationDays: 7,
      })
    })

    it('creates editable link when selected', () => {
      const mutateFn = jest.fn()
      mockUseCreateShareLink.mockReturnValue({
        mutate: mutateFn,
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any)

      renderWithProviders(<ShareModal {...defaultProps} />)

      // Click on "Can Edit" button
      const editableButton = screen.getByText('Can Edit')
      fireEvent.click(editableButton)

      const generateButton = screen.getByText('Generate Share Link')
      fireEvent.click(generateButton)

      expect(mutateFn).toHaveBeenCalledWith({
        projectId: 'project-123',
        accessType: 'editable',
        expirationDays: 7,
      })
    })

    it('creates never-expiring link when selected', () => {
      const mutateFn = jest.fn()
      mockUseCreateShareLink.mockReturnValue({
        mutate: mutateFn,
        isPending: false,
        isError: false,
        isSuccess: false,
      } as any)

      renderWithProviders(<ShareModal {...defaultProps} />)

      const neverExpiresButton = screen.getByText('Never expires')
      fireEvent.click(neverExpiresButton)

      const generateButton = screen.getByText('Generate Share Link')
      fireEvent.click(generateButton)

      expect(mutateFn).toHaveBeenCalledWith({
        projectId: 'project-123',
        accessType: 'readonly',
        expirationDays: undefined,
      })
    })

    it('shows loading state during creation', () => {
      mockUseCreateShareLink.mockReturnValue({
        mutate: jest.fn(),
        isPending: true,
        isError: false,
        isSuccess: false,
      } as any)

      renderWithProviders(<ShareModal {...defaultProps} />)

      expect(screen.getByText('Generating...')).toBeInTheDocument()
      expect(screen.getByText('Generating...')).toBeDisabled()
    })

    it('shows error message on creation failure', () => {
      mockUseCreateShareLink.mockReturnValue({
        mutate: jest.fn(),
        isPending: false,
        isError: true,
        isSuccess: false,
      } as any)

      renderWithProviders(<ShareModal {...defaultProps} />)

      expect(
        screen.getByText('Failed to create share link. Please try again.')
      ).toBeInTheDocument()
    })
  })

  describe('Existing Links Display', () => {
    it('displays existing share links', () => {
      renderWithProviders(<ShareModal {...defaultProps} />)

      expect(screen.getByText('Active Share Links')).toBeInTheDocument()
      // Check for both access type badges
      const viewOnlyBadges = screen.getAllByText('View Only')
      const canEditBadges = screen.getAllByText('Can Edit')
      expect(viewOnlyBadges.length).toBeGreaterThan(0)
      expect(canEditBadges.length).toBeGreaterThan(0)
    })

    it('shows loading state while fetching links', () => {
      mockUseShareLinks.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any)

      renderWithProviders(<ShareModal {...defaultProps} />)

      expect(screen.getByRole('status', { hidden: true })).toBeInTheDocument()
    })

    it('shows error message when fetch fails', () => {
      mockUseShareLinks.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: { error: { message: 'Network error' } },
      } as any)

      renderWithProviders(<ShareModal {...defaultProps} />)

      expect(screen.getByText('Failed to load share links')).toBeInTheDocument()
    })

    it('shows empty state when no links exist', () => {
      mockUseShareLinks.mockReturnValue({
        data: {
          success: true,
          data: { shareLinks: [], total: 0 },
        },
        isLoading: false,
        error: null,
      } as any)

      renderWithProviders(<ShareModal {...defaultProps} />)

      expect(
        screen.getByText('No share links created yet')
      ).toBeInTheDocument()
    })
  })

  describe('Copy Link Functionality', () => {
    it('copies link to clipboard', async () => {
      renderWithProviders(<ShareModal {...defaultProps} />)

      const copyButtons = screen.getAllByText('Copy')
      fireEvent.click(copyButtons[0])

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          `${window.location.origin}/share/abc123`
        )
      })
    })

    it('shows copied confirmation', async () => {
      renderWithProviders(<ShareModal {...defaultProps} />)

      const copyButtons = screen.getAllByText('Copy')
      fireEvent.click(copyButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument()
      })
    })

    it('resets copied state after timeout', async () => {
      jest.useFakeTimers()

      renderWithProviders(<ShareModal {...defaultProps} />)

      const copyButtons = screen.getAllByText('Copy')
      fireEvent.click(copyButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument()
      })

      // Fast-forward 2 seconds
      jest.advanceTimersByTime(2000)

      await waitFor(() => {
        expect(screen.queryByText('Copied!')).not.toBeInTheDocument()
      })

      jest.useRealTimers()
    })
  })

  describe('Revoke Link Functionality', () => {
    it('revokes link after confirmation', () => {
      const mutateFn = jest.fn()
      mockUseRevokeShareLink.mockReturnValue({
        mutate: mutateFn,
        isPending: false,
      } as any)

      renderWithProviders(<ShareModal {...defaultProps} />)

      const revokeButtons = screen.getAllByText('Revoke')
      fireEvent.click(revokeButtons[0])

      expect(global.confirm).toHaveBeenCalled()
      expect(mutateFn).toHaveBeenCalledWith({
        projectId: 'project-123',
        shareLinkId: 'link-1',
      })
    })

    it('does not revoke if user cancels confirmation', () => {
      global.confirm = jest.fn(() => false)
      const mutateFn = jest.fn()
      mockUseRevokeShareLink.mockReturnValue({
        mutate: mutateFn,
        isPending: false,
      } as any)

      renderWithProviders(<ShareModal {...defaultProps} />)

      const revokeButtons = screen.getAllByText('Revoke')
      fireEvent.click(revokeButtons[0])

      expect(global.confirm).toHaveBeenCalled()
      expect(mutateFn).not.toHaveBeenCalled()
    })
  })

  describe('Modal Close', () => {
    it('calls onClose when close button clicked', () => {
      const onClose = jest.fn()
      renderWithProviders(<ShareModal {...defaultProps} onClose={onClose} />)

      const closeButton = screen.getByRole('button', { name: /close/i })
      fireEvent.click(closeButton)

      expect(onClose).toHaveBeenCalled()
    })

    it('calls onClose when backdrop clicked', () => {
      const onClose = jest.fn()
      renderWithProviders(<ShareModal {...defaultProps} onClose={onClose} />)

      // Click on backdrop (first div with fixed class)
      const backdrop = document.querySelector('.fixed.inset-0.bg-black')
      if (backdrop) {
        fireEvent.click(backdrop)
        expect(onClose).toHaveBeenCalled()
      }
    })
  })
})
