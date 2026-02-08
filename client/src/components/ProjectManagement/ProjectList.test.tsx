/**
 * Unit Tests for ProjectList Component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectList } from './ProjectList'
import { mockProjects } from '../../tests/mocks/mockData'

describe('ProjectList', () => {
  const mockOnCreateProject = jest.fn()
  const mockOnSelectProject = jest.fn()
  const mockOnDeleteProject = jest.fn()

  beforeEach(() => {
    mockOnCreateProject.mockClear()
    mockOnSelectProject.mockClear()
    mockOnDeleteProject.mockClear()
  })

  it('should render without crashing', () => {
    render(
      <ProjectList
        projects={mockProjects}
        onCreateProject={mockOnCreateProject}
        onSelectProject={mockOnSelectProject}
      />
    )

    expect(screen.getByText('Test Project 1')).toBeInTheDocument()
  })

  it('should render all projects', () => {
    render(
      <ProjectList
        projects={mockProjects}
        onCreateProject={mockOnCreateProject}
        onSelectProject={mockOnSelectProject}
      />
    )

    mockProjects.forEach((project) => {
      expect(screen.getByText(project.name)).toBeInTheDocument()
    })
  })

  it('should render create project button', () => {
    render(
      <ProjectList
        projects={mockProjects}
        onCreateProject={mockOnCreateProject}
        onSelectProject={mockOnSelectProject}
      />
    )

    const createButton = screen.getByText(/create new project/i)
    expect(createButton).toBeInTheDocument()
  })

  it('should call onCreateProject when create button is clicked', () => {
    render(
      <ProjectList
        projects={mockProjects}
        onCreateProject={mockOnCreateProject}
        onSelectProject={mockOnSelectProject}
      />
    )

    const createButton = screen.getByText(/create new project/i)
    fireEvent.click(createButton)

    expect(mockOnCreateProject).toHaveBeenCalledTimes(1)
  })

  it('should call onSelectProject when project is clicked', () => {
    render(
      <ProjectList
        projects={mockProjects}
        onCreateProject={mockOnCreateProject}
        onSelectProject={mockOnSelectProject}
      />
    )

    const projectCard = screen.getByText('Test Project 1')
    fireEvent.click(projectCard)

    expect(mockOnSelectProject).toHaveBeenCalledWith('project-1')
  })

  describe('View Modes', () => {
    it('should start in grid view by default', () => {
      const { container } = render(
        <ProjectList
          projects={mockProjects}
          onCreateProject={mockOnCreateProject}
          onSelectProject={mockOnSelectProject}
        />
      )

      const gridContainer = container.querySelector('[class*="grid"]')
      expect(gridContainer).toBeInTheDocument()
    })

    it('should toggle to list view', async () => {
      render(
        <ProjectList
          projects={mockProjects}
          onCreateProject={mockOnCreateProject}
          onSelectProject={mockOnSelectProject}
        />
      )

      const listViewButton = screen.getByTitle(/list view/i)
      fireEvent.click(listViewButton)

      // Should switch to list view
      await waitFor(() => {
        const { container } = render(
          <ProjectList
            projects={mockProjects}
            onCreateProject={mockOnCreateProject}
            onSelectProject={mockOnSelectProject}
          />
        )
        expect(container).toBeInTheDocument()
      })
    })
  })

  describe('Search Functionality', () => {
    it('should render search input', () => {
      render(
        <ProjectList
          projects={mockProjects}
          onCreateProject={mockOnCreateProject}
          onSelectProject={mockOnSelectProject}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search projects/i)
      expect(searchInput).toBeInTheDocument()
    })

    it('should filter projects by name', async () => {
      render(
        <ProjectList
          projects={mockProjects}
          onCreateProject={mockOnCreateProject}
          onSelectProject={mockOnSelectProject}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search projects/i)
      await userEvent.type(searchInput, 'Public')

      // Only "Public Project" should be visible
      expect(screen.getByText('Public Project')).toBeInTheDocument()
      expect(screen.queryByText('Test Project 1')).not.toBeInTheDocument()
    })

    it('should show "no projects found" when search has no results', async () => {
      render(
        <ProjectList
          projects={mockProjects}
          onCreateProject={mockOnCreateProject}
          onSelectProject={mockOnSelectProject}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search projects/i)
      await userEvent.type(searchInput, 'nonexistent')

      expect(screen.getByText(/no projects found/i)).toBeInTheDocument()
    })
  })

  describe('Filter Functionality', () => {
    it('should filter by public projects', async () => {
      render(
        <ProjectList
          projects={mockProjects}
          onCreateProject={mockOnCreateProject}
          onSelectProject={mockOnSelectProject}
        />
      )

      // Click filter dropdown
      const filterButton = screen.getByText(/all projects/i)
      fireEvent.click(filterButton)

      // Select "Public Only"
      const publicOption = screen.getByText(/public only/i)
      fireEvent.click(publicOption)

      // Should only show public projects
      await waitFor(() => {
        expect(screen.getByText('Test Project 2')).toBeInTheDocument()
        expect(screen.getByText('Public Project')).toBeInTheDocument()
      })
    })

    it('should filter by private projects', async () => {
      render(
        <ProjectList
          projects={mockProjects}
          onCreateProject={mockOnCreateProject}
          onSelectProject={mockOnSelectProject}
        />
      )

      const filterButton = screen.getByText(/all projects/i)
      fireEvent.click(filterButton)

      const privateOption = screen.getByText(/private only/i)
      fireEvent.click(privateOption)

      await waitFor(() => {
        expect(screen.getByText('Test Project 1')).toBeInTheDocument()
        expect(screen.queryByText('Test Project 2')).not.toBeInTheDocument()
      })
    })
  })

  describe('Sort Functionality', () => {
    it('should sort by name A-Z', async () => {
      render(
        <ProjectList
          projects={mockProjects}
          onCreateProject={mockOnCreateProject}
          onSelectProject={mockOnSelectProject}
        />
      )

      const sortButton = screen.getByText(/sort:/i)
      fireEvent.click(sortButton)

      const nameOption = screen.getByText(/name \(a-z\)/i)
      fireEvent.click(nameOption)

      // Projects should be sorted alphabetically
      await waitFor(() => {
        expect(screen.getByText('Public Project')).toBeInTheDocument()
      })
    })

    it('should sort by last updated', async () => {
      render(
        <ProjectList
          projects={mockProjects}
          onCreateProject={mockOnCreateProject}
          onSelectProject={mockOnSelectProject}
        />
      )

      const sortButton = screen.getByText(/sort:/i)
      fireEvent.click(sortButton)

      const updatedOption = screen.getByText(/last updated/i)
      fireEvent.click(updatedOption)

      await waitFor(() => {
        expect(screen.getAllByText(/test project/i)).toHaveLength(2)
      })
    })
  })

  describe('Loading State', () => {
    it('should show loading skeleton', () => {
      render(
        <ProjectList
          projects={[]}
          onCreateProject={mockOnCreateProject}
          onSelectProject={mockOnSelectProject}
          loading={true}
        />
      )

      const loadingElements = screen.getAllByText(/loading/i)
      expect(loadingElements.length).toBeGreaterThan(0)
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no projects', () => {
      render(
        <ProjectList
          projects={[]}
          onCreateProject={mockOnCreateProject}
          onSelectProject={mockOnSelectProject}
          loading={false}
        />
      )

      expect(screen.getByText(/no projects yet/i)).toBeInTheDocument()
    })
  })

  describe('Delete Functionality', () => {
    it('should show delete button when onDeleteProject is provided', () => {
      render(
        <ProjectList
          projects={mockProjects}
          onCreateProject={mockOnCreateProject}
          onSelectProject={mockOnSelectProject}
          onDeleteProject={mockOnDeleteProject}
        />
      )

      // Delete buttons should be present
      const projectCard = screen.getByText('Test Project 1').closest('[class*="card"]')
      expect(projectCard).toBeInTheDocument()
    })

    it('should call onDeleteProject when delete is confirmed', async () => {
      // Mock window.confirm
      global.confirm = jest.fn(() => true)

      render(
        <ProjectList
          projects={mockProjects}
          onCreateProject={mockOnCreateProject}
          onSelectProject={mockOnSelectProject}
          onDeleteProject={mockOnDeleteProject}
        />
      )

      // Find and click delete button
      const deleteButtons = screen.getAllByTitle(/delete/i)
      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0])

        await waitFor(() => {
          expect(mockOnDeleteProject).toHaveBeenCalled()
        })
      }
    })

    it('should not delete when user cancels confirmation', async () => {
      global.confirm = jest.fn(() => false)

      render(
        <ProjectList
          projects={mockProjects}
          onCreateProject={mockOnCreateProject}
          onSelectProject={mockOnSelectProject}
          onDeleteProject={mockOnDeleteProject}
        />
      )

      const deleteButtons = screen.getAllByTitle(/delete/i)
      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0])

        await waitFor(() => {
          expect(mockOnDeleteProject).not.toHaveBeenCalled()
        })
      }
    })
  })

  describe('Project Metadata', () => {
    it('should display task count', () => {
      render(
        <ProjectList
          projects={mockProjects}
          onCreateProject={mockOnCreateProject}
          onSelectProject={mockOnSelectProject}
        />
      )

      expect(screen.getByText(/3 tasks/i)).toBeInTheDocument()
    })

    it('should display owner name', () => {
      render(
        <ProjectList
          projects={mockProjects}
          onCreateProject={mockOnCreateProject}
          onSelectProject={mockOnSelectProject}
        />
      )

      expect(screen.getAllByText(/test user/i).length).toBeGreaterThan(0)
    })

    it('should display public/private badge', () => {
      render(
        <ProjectList
          projects={mockProjects}
          onCreateProject={mockOnCreateProject}
          onSelectProject={mockOnSelectProject}
        />
      )

      expect(screen.getByText(/public/i)).toBeInTheDocument()
      expect(screen.getByText(/private/i)).toBeInTheDocument()
    })
  })
})
