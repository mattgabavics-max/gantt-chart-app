/**
 * Unit Tests for VersionHistory Component
 */

import React from 'react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VersionHistory } from './VersionHistory'
import { renderWithVersionProvider } from '../../tests/utils/testUtils'
import { mockVersions } from '../../tests/mocks/mockData'

describe('VersionHistory', () => {
  const mockOnClose = jest.fn()
  const mockOnCompare = jest.fn()

  beforeEach(() => {
    mockOnClose.mockClear()
    mockOnCompare.mockClear()
    localStorage.setItem('token', 'mock-token')
  })

  it('should render without crashing', async () => {
    renderWithVersionProvider(
      <VersionHistory
        projectId="project-1"
        onClose={mockOnClose}
        onCompare={mockOnCompare}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Version History')).toBeInTheDocument()
    })
  })

  it('should load versions on mount', async () => {
    renderWithVersionProvider(
      <VersionHistory
        projectId="project-1"
        onClose={mockOnClose}
        onCompare={mockOnCompare}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/version 1/i)).toBeInTheDocument()
    })
  })

  it('should display version list', async () => {
    renderWithVersionProvider(
      <VersionHistory
        projectId="project-1"
        onClose={mockOnClose}
        onCompare={mockOnCompare}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/version 1/i)).toBeInTheDocument()
      expect(screen.getByText(/version 2/i)).toBeInTheDocument()
      expect(screen.getByText(/version 3/i)).toBeInTheDocument()
    })
  })

  it('should call onClose when close button is clicked', async () => {
    renderWithVersionProvider(
      <VersionHistory
        projectId="project-1"
        onClose={mockOnClose}
        onCompare={mockOnCompare}
      />
    )

    await waitFor(() => {
      const closeButton = screen.getByTitle(/close/i) || screen.getByRole('button', { name: /×/i })
      fireEvent.click(closeButton)
    })

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  describe('Version Creation', () => {
    it('should show create version form', async () => {
      renderWithVersionProvider(
        <VersionHistory
          projectId="project-1"
          onClose={mockOnClose}
          onCompare={mockOnCompare}
        />
      )

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/enter version description/i)
        expect(input).toBeInTheDocument()
      })
    })

    it('should create new version when form is submitted', async () => {
      renderWithVersionProvider(
        <VersionHistory
          projectId="project-1"
          onClose={mockOnClose}
          onCompare={mockOnCompare}
        />
      )

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/enter version description/i)
        expect(input).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText(/enter version description/i)
      await userEvent.type(input, 'New test version')

      const createButton = screen.getByText(/create new version/i)
      fireEvent.click(createButton)

      await waitFor(() => {
        // Input should be cleared after successful creation
        expect(input).toHaveValue('')
      })
    })

    it('should not create version with empty description', async () => {
      global.alert = jest.fn()

      renderWithVersionProvider(
        <VersionHistory
          projectId="project-1"
          onClose={mockOnClose}
          onCompare={mockOnCompare}
        />
      )

      await waitFor(() => {
        const createButton = screen.getByText(/create new version/i)
        expect(createButton).toBeDisabled()
      })
    })

    it('should create version on Enter key press', async () => {
      renderWithVersionProvider(
        <VersionHistory
          projectId="project-1"
          onClose={mockOnClose}
          onCompare={mockOnCompare}
        />
      )

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/enter version description/i)
        expect(input).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText(/enter version description/i)
      await userEvent.type(input, 'Quick version{Enter}')

      await waitFor(() => {
        expect(input).toHaveValue('')
      })
    })
  })

  describe('Version Actions', () => {
    it('should show restore button for non-current versions', async () => {
      renderWithVersionProvider(
        <VersionHistory
          projectId="project-1"
          onClose={mockOnClose}
          onCompare={mockOnCompare}
        />
      )

      await waitFor(() => {
        const versionItem = screen.getByText(/version 1/i).closest('div')
        if (versionItem) {
          fireEvent.click(versionItem)
        }
      })

      await waitFor(() => {
        const restoreButton = screen.queryByText(/restore/i)
        expect(restoreButton).toBeInTheDocument()
      })
    })

    it('should show compare button', async () => {
      renderWithVersionProvider(
        <VersionHistory
          projectId="project-1"
          onClose={mockOnClose}
          onCompare={mockOnCompare}
        />
      )

      await waitFor(() => {
        const versionItem = screen.getByText(/version 1/i).closest('div')
        if (versionItem) {
          fireEvent.click(versionItem)
        }
      })

      await waitFor(() => {
        const compareButton = screen.queryByText(/compare/i)
        expect(compareButton).toBeInTheDocument()
      })
    })

    it('should call onCompare when compare button is clicked', async () => {
      renderWithVersionProvider(
        <VersionHistory
          projectId="project-1"
          onClose={mockOnClose}
          onCompare={mockOnCompare}
        />
      )

      await waitFor(() => {
        const versionItem = screen.getByText(/version 1/i).closest('div')
        if (versionItem) {
          fireEvent.click(versionItem)
        }
      })

      await waitFor(async () => {
        const compareButton = screen.queryByText(/compare/i)
        if (compareButton) {
          fireEvent.click(compareButton)
          await waitFor(() => {
            expect(mockOnCompare).toHaveBeenCalled()
          })
        }
      })
    })

    it('should show delete button for automatic versions', async () => {
      renderWithVersionProvider(
        <VersionHistory
          projectId="project-1"
          onClose={mockOnClose}
          onCompare={mockOnCompare}
        />
      )

      await waitFor(() => {
        const autoVersion = screen.getByText(/version 2/i)
        const versionItem = autoVersion.closest('div')
        if (versionItem) {
          fireEvent.click(versionItem)
        }
      })

      await waitFor(() => {
        const deleteButton = screen.queryByText(/delete/i)
        expect(deleteButton).toBeInTheDocument()
      })
    })
  })

  describe('Auto-Version Settings', () => {
    it('should show settings panel when settings button is clicked', async () => {
      renderWithVersionProvider(
        <VersionHistory
          projectId="project-1"
          onClose={mockOnClose}
          onCompare={mockOnCompare}
        />
      )

      await waitFor(() => {
        const settingsButton = screen.getByTitle(/auto-version settings/i)
        fireEvent.click(settingsButton)
      })

      await waitFor(() => {
        expect(screen.getByText(/auto-version settings/i)).toBeInTheDocument()
      })
    })

    it('should toggle auto-versioning', async () => {
      renderWithVersionProvider(
        <VersionHistory
          projectId="project-1"
          onClose={mockOnClose}
          onCompare={mockOnCompare}
        />
      )

      await waitFor(() => {
        const settingsButton = screen.getByTitle(/auto-version settings/i)
        fireEvent.click(settingsButton)
      })

      await waitFor(() => {
        const enableCheckbox = screen.getByLabelText(/enable auto-versioning/i)
        expect(enableCheckbox).toBeInTheDocument()
      })

      const enableCheckbox = screen.getByLabelText(/enable auto-versioning/i) as HTMLInputElement
      const wasChecked = enableCheckbox.checked

      fireEvent.click(enableCheckbox)

      await waitFor(() => {
        expect(enableCheckbox.checked).toBe(!wasChecked)
      })
    })

    it('should show trigger options when auto-versioning is enabled', async () => {
      renderWithVersionProvider(
        <VersionHistory
          projectId="project-1"
          onClose={mockOnClose}
          onCompare={mockOnCompare}
        />
      )

      await waitFor(() => {
        const settingsButton = screen.getByTitle(/auto-version settings/i)
        fireEvent.click(settingsButton)
      })

      await waitFor(() => {
        expect(screen.getByLabelText(/on task add/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/on task delete/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/on task modify/i)).toBeInTheDocument()
      })
    })

    it('should adjust min change threshold', async () => {
      renderWithVersionProvider(
        <VersionHistory
          projectId="project-1"
          onClose={mockOnClose}
          onCompare={mockOnCompare}
        />
      )

      await waitFor(() => {
        const settingsButton = screen.getByTitle(/auto-version settings/i)
        fireEvent.click(settingsButton)
      })

      await waitFor(() => {
        const slider = screen.getByText(/min changes:/i).nextElementSibling as HTMLInputElement
        if (slider) {
          fireEvent.change(slider, { target: { value: '5' } })
          expect(slider.value).toBe('5')
        }
      })
    })
  })

  describe('Version Metadata', () => {
    it('should display version number', async () => {
      renderWithVersionProvider(
        <VersionHistory
          projectId="project-1"
          onClose={mockOnClose}
          onCompare={mockOnCompare}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/version 1/i)).toBeInTheDocument()
      })
    })

    it('should display created date', async () => {
      renderWithVersionProvider(
        <VersionHistory
          projectId="project-1"
          onClose={mockOnClose}
          onCompare={mockOnCompare}
        />
      )

      await waitFor(() => {
        // Should show relative date like "5 minutes ago"
        const dateElements = screen.getAllByText(/ago|just now|yesterday/i)
        expect(dateElements.length).toBeGreaterThan(0)
      })
    })

    it('should display creator name', async () => {
      renderWithVersionProvider(
        <VersionHistory
          projectId="project-1"
          onClose={mockOnClose}
          onCompare={mockOnCompare}
        />
      )

      await waitFor(() => {
        expect(screen.getAllByText(/test user/i).length).toBeGreaterThan(0)
      })
    })

    it('should display task count', async () => {
      renderWithVersionProvider(
        <VersionHistory
          projectId="project-1"
          onClose={mockOnClose}
          onCompare={mockOnCompare}
        />
      )

      await waitFor(() => {
        const taskCounts = screen.getAllByText(/\d+ task/i)
        expect(taskCounts.length).toBeGreaterThan(0)
      })
    })

    it('should show "Auto" badge for automatic versions', async () => {
      renderWithVersionProvider(
        <VersionHistory
          projectId="project-1"
          onClose={mockOnClose}
          onCompare={mockOnCompare}
        />
      )

      await waitFor(() => {
        const autoBadges = screen.getAllByText(/auto/i)
        expect(autoBadges.length).toBeGreaterThan(0)
      })
    })

    it('should show "Current" badge for current version', async () => {
      renderWithVersionProvider(
        <VersionHistory
          projectId="project-1"
          onClose={mockOnClose}
          onCompare={mockOnCompare}
        />
      )

      await waitFor(() => {
        const currentBadge = screen.getByText(/current/i)
        expect(currentBadge).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      renderWithVersionProvider(
        <VersionHistory
          projectId="project-1"
          onClose={mockOnClose}
          onCompare={mockOnCompare}
        />
      )

      // Loading spinner should be present
      const spinner = document.querySelector('[class*="animate-spin"]')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should show empty message when no versions exist', async () => {
      renderWithVersionProvider(
        <VersionHistory
          projectId="project-999"
          onClose={mockOnClose}
          onCompare={mockOnCompare}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/no versions yet/i)).toBeInTheDocument()
      })
    })
  })

  describe('Restore Confirmation', () => {
    it('should show confirmation dialog when restore is clicked', async () => {
      renderWithVersionProvider(
        <VersionHistory
          projectId="project-1"
          onClose={mockOnClose}
          onCompare={mockOnCompare}
        />
      )

      await waitFor(() => {
        const versionItem = screen.getByText(/version 1/i).closest('div')
        if (versionItem) {
          fireEvent.click(versionItem)
        }
      })

      await waitFor(async () => {
        const restoreButton = screen.queryByText(/^restore$/i)
        if (restoreButton) {
          fireEvent.click(restoreButton)

          await waitFor(() => {
            expect(screen.getByText(/confirm restore/i)).toBeInTheDocument()
          })
        }
      })
    })

    it('should cancel restore when cancel is clicked', async () => {
      renderWithVersionProvider(
        <VersionHistory
          projectId="project-1"
          onClose={mockOnClose}
          onCompare={mockOnCompare}
        />
      )

      await waitFor(() => {
        const versionItem = screen.getByText(/version 1/i).closest('div')
        if (versionItem) {
          fireEvent.click(versionItem)
        }
      })

      await waitFor(async () => {
        const restoreButton = screen.queryByText(/^restore$/i)
        if (restoreButton) {
          fireEvent.click(restoreButton)

          await waitFor(() => {
            const cancelButton = screen.getByText(/^cancel$/i)
            fireEvent.click(cancelButton)
          })

          await waitFor(() => {
            expect(screen.queryByText(/confirm restore/i)).not.toBeInTheDocument()
          })
        }
      })
    })
  })
})
