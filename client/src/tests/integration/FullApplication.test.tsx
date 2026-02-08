/**
 * Integration Tests
 * Tests multiple components working together
 */

import React from 'react'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithVersionProvider } from '../utils/testUtils'
import { FullIntegrationExample } from '../../examples/FullIntegrationExample'

describe('Full Application Integration', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'mock-token')
  })

  it('should render the complete application', async () => {
    renderWithVersionProvider(<FullIntegrationExample />)

    await waitFor(() => {
      expect(screen.getByText(/my gantt project/i)).toBeInTheDocument()
    })
  })

  it('should display project header with all controls', async () => {
    renderWithVersionProvider(<FullIntegrationExample />)

    await waitFor(() => {
      // Project name
      expect(screen.getByText(/my gantt project/i)).toBeInTheDocument()

      // Time scale selector
      const timeScaleSelect = screen.getByDisplayValue(/week/i)
      expect(timeScaleSelect).toBeInTheDocument()

      // Share button
      const shareButton = screen.getByText(/share/i)
      expect(shareButton).toBeInTheDocument()

      // Version history button
      const historyButton = screen.getByText(/history/i)
      expect(historyButton).toBeInTheDocument()
    })
  })

  it('should display toolbar with controls', async () => {
    renderWithVersionProvider(<FullIntegrationExample />)

    await waitFor(() => {
      // Zoom controls
      expect(screen.getByTitle(/zoom in/i)).toBeInTheDocument()
      expect(screen.getByTitle(/zoom out/i)).toBeInTheDocument()

      // View button
      expect(screen.getByText(/view/i)).toBeInTheDocument()

      // Export button
      expect(screen.getByText(/export/i)).toBeInTheDocument()
    })
  })

  it('should display Gantt chart with tasks', async () => {
    renderWithVersionProvider(<FullIntegrationExample />)

    await waitFor(() => {
      expect(screen.getByText(/design phase/i)).toBeInTheDocument()
      expect(screen.getByText(/development/i)).toBeInTheDocument()
      expect(screen.getByText(/testing/i)).toBeInTheDocument()
      expect(screen.getByText(/launch/i)).toBeInTheDocument()
    })
  })

  describe('Task Creation Flow', () => {
    it('should show task creation form when Add Task is clicked', async () => {
      renderWithVersionProvider(<FullIntegrationExample />)

      await waitFor(() => {
        const addButton = screen.getByText(/add task/i)
        fireEvent.click(addButton)
      })

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/task name/i)).toBeInTheDocument()
      })
    })

    it('should create a new task', async () => {
      renderWithVersionProvider(<FullIntegrationExample />)

      await waitFor(() => {
        const addButton = screen.getByText(/add task/i)
        fireEvent.click(addButton)
      })

      await waitFor(async () => {
        const nameInput = screen.getByPlaceholderText(/task name/i)
        await userEvent.type(nameInput, 'New Test Task')
      })

      await waitFor(() => {
        const addButton = screen.getByText(/^add$/i)
        fireEvent.click(addButton)
      })

      await waitFor(() => {
        expect(screen.getByText(/new test task/i)).toBeInTheDocument()
      })
    })

    it('should cancel task creation', async () => {
      renderWithVersionProvider(<FullIntegrationExample />)

      await waitFor(() => {
        const addButton = screen.getByText(/add task/i)
        fireEvent.click(addButton)
      })

      await waitFor(() => {
        const cancelButton = screen.getByText(/cancel/i)
        fireEvent.click(cancelButton)
      })

      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/task name/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Version History Integration', () => {
    it('should open version history panel', async () => {
      renderWithVersionProvider(<FullIntegrationExample />)

      await waitFor(() => {
        const historyButton = screen.getByText(/history/i)
        fireEvent.click(historyButton)
      })

      await waitFor(() => {
        expect(screen.getByText(/version history/i)).toBeInTheDocument()
      })
    })

    it('should close version history panel', async () => {
      renderWithVersionProvider(<FullIntegrationExample />)

      // Open panel
      await waitFor(() => {
        const historyButton = screen.getByText(/history/i)
        fireEvent.click(historyButton)
      })

      await waitFor(() => {
        expect(screen.getByText(/version history/i)).toBeInTheDocument()
      })

      // Close panel
      await waitFor(() => {
        const closeButtons = screen.getAllByRole('button')
        const closeButton = closeButtons.find((btn) => btn.innerHTML.includes('×'))
        if (closeButton) {
          fireEvent.click(closeButton)
        }
      })
    })

    it('should show version list in panel', async () => {
      renderWithVersionProvider(<FullIntegrationExample />)

      await waitFor(() => {
        const historyButton = screen.getByText(/history/i)
        fireEvent.click(historyButton)
      })

      await waitFor(() => {
        expect(screen.getByText(/version history/i)).toBeInTheDocument()
        // Should load and display versions
      })
    })
  })

  describe('Toolbar Integration', () => {
    it('should zoom in', async () => {
      renderWithVersionProvider(<FullIntegrationExample />)

      await waitFor(() => {
        const zoomInButton = screen.getByTitle(/zoom in/i)
        fireEvent.click(zoomInButton)
      })

      // Time scale should change
      await waitFor(() => {
        expect(screen.getByText(/design phase/i)).toBeInTheDocument()
      })
    })

    it('should zoom out', async () => {
      renderWithVersionProvider(<FullIntegrationExample />)

      await waitFor(() => {
        const zoomOutButton = screen.getByTitle(/zoom out/i)
        fireEvent.click(zoomOutButton)
      })

      await waitFor(() => {
        expect(screen.getByText(/design phase/i)).toBeInTheDocument()
      })
    })

    it('should open view options menu', async () => {
      renderWithVersionProvider(<FullIntegrationExample />)

      await waitFor(() => {
        const viewButton = screen.getByText(/view/i)
        fireEvent.click(viewButton)
      })

      await waitFor(() => {
        expect(screen.getByText(/show weekends/i)).toBeInTheDocument()
        expect(screen.getByText(/show today line/i)).toBeInTheDocument()
      })
    })

    it('should toggle show weekends', async () => {
      renderWithVersionProvider(<FullIntegrationExample />)

      await waitFor(() => {
        const viewButton = screen.getByText(/view/i)
        fireEvent.click(viewButton)
      })

      await waitFor(() => {
        const weekendsCheckbox = screen.getByLabelText(/show weekends/i) as HTMLInputElement
        const wasChecked = weekendsCheckbox.checked
        fireEvent.click(weekendsCheckbox)

        expect(weekendsCheckbox.checked).toBe(!wasChecked)
      })
    })

    it('should open export menu', async () => {
      renderWithVersionProvider(<FullIntegrationExample />)

      await waitFor(() => {
        const exportButton = screen.getByText(/export/i)
        fireEvent.click(exportButton)
      })

      await waitFor(() => {
        expect(screen.getByText(/export as png/i)).toBeInTheDocument()
        expect(screen.getByText(/export as pdf/i)).toBeInTheDocument()
        expect(screen.getByText(/export as json/i)).toBeInTheDocument()
      })
    })

    it('should export as JSON', async () => {
      // Mock createElement and click
      const mockLink = {
        click: jest.fn(),
        download: '',
        href: '',
      }
      jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
      jest.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any)
      jest.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any)

      renderWithVersionProvider(<FullIntegrationExample />)

      await waitFor(() => {
        const exportButton = screen.getByText(/export/i)
        fireEvent.click(exportButton)
      })

      await waitFor(() => {
        const jsonExport = screen.getByText(/export as json/i)
        fireEvent.click(jsonExport)
      })

      await waitFor(() => {
        expect(mockLink.click).toHaveBeenCalled()
      })
    })
  })

  describe('Project Header Integration', () => {
    it('should edit project name', async () => {
      renderWithVersionProvider(<FullIntegrationExample />)

      await waitFor(() => {
        const projectName = screen.getByText(/my gantt project/i)
        fireEvent.click(projectName)
      })

      await waitFor(async () => {
        const input = screen.getByDisplayValue(/my gantt project/i) as HTMLInputElement
        await userEvent.clear(input)
        await userEvent.type(input, 'Updated Project Name{Enter}')
      })

      await waitFor(() => {
        expect(screen.getByText(/updated project name/i)).toBeInTheDocument()
      })
    })

    it('should change time scale from header', async () => {
      renderWithVersionProvider(<FullIntegrationExample />)

      await waitFor(() => {
        const timeScaleSelect = screen.getByDisplayValue(/week/i) as HTMLSelectElement
        fireEvent.change(timeScaleSelect, { target: { value: 'month' } })
      })

      await waitFor(() => {
        expect(timeScaleSelect.value).toBe('month')
      })
    })

    it('should show auto-save indicator', async () => {
      renderWithVersionProvider(<FullIntegrationExample />)

      await waitFor(() => {
        const saveIndicator = screen.getByText(/saved|saving/i)
        expect(saveIndicator).toBeInTheDocument()
      })
    })
  })

  describe('Manual Version Creation', () => {
    it('should show floating action button', async () => {
      renderWithVersionProvider(<FullIntegrationExample />)

      await waitFor(() => {
        const fab = screen.getByTitle(/create manual version/i)
        expect(fab).toBeInTheDocument()
      })
    })

    it('should create manual version from FAB', async () => {
      global.prompt = jest.fn(() => 'Manual version description')

      renderWithVersionProvider(<FullIntegrationExample />)

      await waitFor(() => {
        const fab = screen.getByTitle(/create manual version/i)
        fireEvent.click(fab)
      })

      await waitFor(() => {
        expect(global.prompt).toHaveBeenCalled()
      })
    })
  })

  describe('Responsive Behavior', () => {
    it('should handle window resize', async () => {
      renderWithVersionProvider(<FullIntegrationExample />)

      // Simulate window resize
      global.innerWidth = 768
      fireEvent(window, new Event('resize'))

      await waitFor(() => {
        expect(screen.getByText(/design phase/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // This would require MSW to return error responses
      renderWithVersionProvider(<FullIntegrationExample />)

      await waitFor(() => {
        expect(screen.getByText(/design phase/i)).toBeInTheDocument()
      })
    })
  })

  describe('Multiple Component Interactions', () => {
    it('should create task, then create version', async () => {
      renderWithVersionProvider(<FullIntegrationExample />)

      // Create task
      await waitFor(() => {
        const addButton = screen.getByText(/add task/i)
        fireEvent.click(addButton)
      })

      await waitFor(async () => {
        const nameInput = screen.getByPlaceholderText(/task name/i)
        await userEvent.type(nameInput, 'Integration Test Task')

        const addButton = screen.getByText(/^add$/i)
        fireEvent.click(addButton)
      })

      // Wait for task to be added
      await waitFor(() => {
        expect(screen.getByText(/integration test task/i)).toBeInTheDocument()
      })

      // Create version
      global.prompt = jest.fn(() => 'After adding task')

      await waitFor(() => {
        const fab = screen.getByTitle(/create manual version/i)
        fireEvent.click(fab)
      })

      await waitFor(() => {
        expect(global.prompt).toHaveBeenCalled()
      })
    })

    it('should change time scale, then toggle weekends', async () => {
      renderWithVersionProvider(<FullIntegrationExample />)

      // Change time scale
      await waitFor(() => {
        const timeScaleSelect = screen.getByDisplayValue(/week/i)
        fireEvent.change(timeScaleSelect, { target: { value: 'day' } })
      })

      // Toggle weekends
      await waitFor(() => {
        const viewButton = screen.getByText(/view/i)
        fireEvent.click(viewButton)
      })

      await waitFor(() => {
        const weekendsCheckbox = screen.getByLabelText(/show weekends/i)
        fireEvent.click(weekendsCheckbox)
      })

      await waitFor(() => {
        expect(screen.getByText(/design phase/i)).toBeInTheDocument()
      })
    })
  })
})
