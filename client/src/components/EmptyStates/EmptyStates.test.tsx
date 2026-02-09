/**
 * Empty State Components Tests
 */

import React from 'react'
import { render, screen } from '../../test-utils'
import { fireEvent } from '@testing-library/react'
import { testA11y } from '../../tests/utils/testA11y'
import {
  EmptyState,
  NoProjects,
  NoTasks,
  NoVersions,
  NoSearchResults,
  NoTeamMembers,
  ErrorState,
  OfflineState,
  CompactEmptyState,
  PermissionDenied,
} from './EmptyStates'

describe('EmptyState', () => {
  it('should render with title only', () => {
    render(<EmptyState title="Test Title" />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveAccessibleName('Test Title')
  })

  it('should render with description', () => {
    render(<EmptyState title="Title" description="Test description" />)
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('should render with icon', () => {
    render(
      <EmptyState
        title="Title"
        icon={<svg data-testid="test-icon" aria-hidden="true" />}
      />
    )
    expect(screen.getByTestId('test-icon')).toBeInTheDocument()
  })

  it('should render primary action button', () => {
    const handleClick = jest.fn()
    render(
      <EmptyState
        title="Title"
        action={{
          label: 'Primary Action',
          onClick: handleClick,
        }}
      />
    )

    const button = screen.getByRole('button', { name: 'Primary Action' })
    expect(button).toBeInTheDocument()

    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should render primary action with icon', () => {
    render(
      <EmptyState
        title="Title"
        action={{
          label: 'Action',
          onClick: jest.fn(),
          icon: <svg data-testid="action-icon" aria-hidden="true" />,
        }}
      />
    )

    expect(screen.getByTestId('action-icon')).toBeInTheDocument()
  })

  it('should render secondary action button', () => {
    const handleSecondary = jest.fn()
    render(
      <EmptyState
        title="Title"
        action={{
          label: 'Primary',
          onClick: jest.fn(),
        }}
        secondaryAction={{
          label: 'Secondary Action',
          onClick: handleSecondary,
        }}
      />
    )

    const button = screen.getByRole('button', { name: 'Secondary Action' })
    expect(button).toBeInTheDocument()

    fireEvent.click(button)
    expect(handleSecondary).toHaveBeenCalledTimes(1)
  })

  it('should not render secondary action if not provided', () => {
    render(
      <EmptyState
        title="Title"
        action={{
          label: 'Primary',
          onClick: jest.fn(),
        }}
      />
    )

    expect(screen.getAllByRole('button')).toHaveLength(1)
  })

  it('should apply custom className', () => {
    const { container } = render(
      <EmptyState title="Title" className="custom-class" />
    )

    const emptyState = container.querySelector('.custom-class')
    expect(emptyState).toBeInTheDocument()
  })

  it('should be accessible', () => {
    render(<EmptyState title="Accessible Title" description="Description" />)
    const status = screen.getByRole('status')
    expect(status).toBeInTheDocument()
    expect(status).toHaveAccessibleName('Accessible Title')
  })

  it('should have no accessibility violations', async () => {
    await testA11y(<EmptyState title="Test Title" description="Test description" />)
  })

  it('should have no accessibility violations with action buttons', async () => {
    await testA11y(
      <EmptyState
        title="Title"
        description="Description"
        action={{ label: 'Primary', onClick: jest.fn() }}
        secondaryAction={{ label: 'Secondary', onClick: jest.fn() }}
      />
    )
  })
})

describe('NoProjects', () => {
  it('should render with create action', () => {
    const handleCreate = jest.fn()
    render(<NoProjects onCreateProject={handleCreate} />)

    expect(screen.getByText('No projects yet')).toBeInTheDocument()
    expect(
      screen.getByText(/Get started by creating your first project/)
    ).toBeInTheDocument()

    const button = screen.getByRole('button', {
      name: 'Create Your First Project',
    })
    fireEvent.click(button)
    expect(handleCreate).toHaveBeenCalledTimes(1)
  })

  it('should render with import action', () => {
    const handleImport = jest.fn()
    render(
      <NoProjects onCreateProject={jest.fn()} onImport={handleImport} />
    )

    const importButton = screen.getByRole('button', { name: 'Import from file' })
    fireEvent.click(importButton)
    expect(handleImport).toHaveBeenCalledTimes(1)
  })

  it('should not render import button when not provided', () => {
    render(<NoProjects onCreateProject={jest.fn()} />)

    expect(
      screen.queryByRole('button', { name: 'Import from file' })
    ).not.toBeInTheDocument()
  })

  it('should be accessible', () => {
    render(<NoProjects onCreateProject={jest.fn()} />)
    expect(screen.getByRole('status')).toHaveAccessibleName('No projects yet')
  })

  it('should have no accessibility violations', async () => {
    await testA11y(<NoProjects onCreateProject={jest.fn()} />)
  })
})

describe('NoTasks', () => {
  it('should render with add task action', () => {
    const handleAdd = jest.fn()
    render(<NoTasks onAddTask={handleAdd} />)

    expect(screen.getByText('No tasks in this project')).toBeInTheDocument()
    expect(
      screen.getByText(/Start adding tasks to build your project timeline/)
    ).toBeInTheDocument()

    const button = screen.getByRole('button', { name: 'Add Your First Task' })
    fireEvent.click(button)
    expect(handleAdd).toHaveBeenCalledTimes(1)
  })

  it('should render with import action', () => {
    const handleImport = jest.fn()
    render(<NoTasks onAddTask={jest.fn()} onImport={handleImport} />)

    const importButton = screen.getByRole('button', { name: 'Import tasks' })
    fireEvent.click(importButton)
    expect(handleImport).toHaveBeenCalledTimes(1)
  })

  it('should not render import button when not provided', () => {
    render(<NoTasks onAddTask={jest.fn()} />)

    expect(
      screen.queryByRole('button', { name: 'Import tasks' })
    ).not.toBeInTheDocument()
  })

  it('should be accessible', () => {
    render(<NoTasks onAddTask={jest.fn()} />)
    expect(screen.getByRole('status')).toHaveAccessibleName(
      'No tasks in this project'
    )
  })

  it('should have no accessibility violations', async () => {
    await testA11y(<NoTasks onAddTask={jest.fn()} />)
  })
})

describe('NoVersions', () => {
  it('should render with create version action', () => {
    const handleCreate = jest.fn()
    render(<NoVersions onCreateVersion={handleCreate} />)

    expect(screen.getByText('No saved versions')).toBeInTheDocument()
    expect(
      screen.getByText(/Create snapshots of your project to track changes/)
    ).toBeInTheDocument()

    const button = screen.getByRole('button', { name: 'Save Current Version' })
    fireEvent.click(button)
    expect(handleCreate).toHaveBeenCalledTimes(1)
  })

  it('should be accessible', () => {
    render(<NoVersions onCreateVersion={jest.fn()} />)
    expect(screen.getByRole('status')).toHaveAccessibleName('No saved versions')
  })

  it('should have no accessibility violations', async () => {
    await testA11y(<NoVersions onCreateVersion={jest.fn()} />)
  })
})

describe('NoSearchResults', () => {
  it('should render with search query', () => {
    const handleClear = jest.fn()
    render(<NoSearchResults searchQuery="test query" onClear={handleClear} />)

    expect(screen.getByText('No results found')).toBeInTheDocument()
    expect(
      screen.getByText(/We couldn't find any results for "test query"/)
    ).toBeInTheDocument()
  })

  it('should call onClear when clear button is clicked', () => {
    const handleClear = jest.fn()
    render(<NoSearchResults searchQuery="test" onClear={handleClear} />)

    const button = screen.getByRole('button', { name: 'Clear Search' })
    fireEvent.click(button)
    expect(handleClear).toHaveBeenCalledTimes(1)
  })

  it('should display the search query in description', () => {
    render(<NoSearchResults searchQuery="my search" onClear={jest.fn()} />)
    expect(
      screen.getByText(/We couldn't find any results for "my search"/)
    ).toBeInTheDocument()
  })

  it('should be accessible', () => {
    render(<NoSearchResults searchQuery="test" onClear={jest.fn()} />)
    expect(screen.getByRole('status')).toHaveAccessibleName('No results found')
  })

  it('should have no accessibility violations', async () => {
    await testA11y(<NoSearchResults searchQuery="test" onClear={jest.fn()} />)
  })
})

describe('NoTeamMembers', () => {
  it('should render with invite action', () => {
    const handleInvite = jest.fn()
    render(<NoTeamMembers onInvite={handleInvite} />)

    expect(screen.getByText('No team members yet')).toBeInTheDocument()
    expect(
      screen.getByText(/Invite team members to collaborate on this project/)
    ).toBeInTheDocument()

    const button = screen.getByRole('button', { name: 'Invite Team Members' })
    fireEvent.click(button)
    expect(handleInvite).toHaveBeenCalledTimes(1)
  })

  it('should be accessible', () => {
    render(<NoTeamMembers onInvite={jest.fn()} />)
    expect(screen.getByRole('status')).toHaveAccessibleName(
      'No team members yet'
    )
  })

  it('should have no accessibility violations', async () => {
    await testA11y(<NoTeamMembers onInvite={jest.fn()} />)
  })
})

describe('ErrorState', () => {
  it('should render with default title and description', () => {
    render(<ErrorState />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(
      screen.getByText(/An error occurred while loading this content/)
    ).toBeInTheDocument()
  })

  it('should render with custom title and description', () => {
    render(
      <ErrorState
        title="Custom Error"
        description="Custom error description"
      />
    )

    expect(screen.getByText('Custom Error')).toBeInTheDocument()
    expect(screen.getByText('Custom error description')).toBeInTheDocument()
  })

  it('should render retry button when provided', () => {
    const handleRetry = jest.fn()
    render(<ErrorState onRetry={handleRetry} />)

    const button = screen.getByRole('button', { name: 'Try Again' })
    fireEvent.click(button)
    expect(handleRetry).toHaveBeenCalledTimes(1)
  })

  it('should render go back button when provided', () => {
    const handleGoBack = jest.fn()
    render(<ErrorState onRetry={jest.fn()} onGoBack={handleGoBack} />)

    const button = screen.getByRole('button', { name: 'Go Back' })
    fireEvent.click(button)
    expect(handleGoBack).toHaveBeenCalledTimes(1)
  })

  it('should not render action buttons when not provided', () => {
    render(<ErrorState />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('should be accessible', () => {
    render(<ErrorState />)
    expect(screen.getByRole('status')).toHaveAccessibleName(
      'Something went wrong'
    )
  })

  it('should have error icon with red color', () => {
    const { container } = render(<ErrorState />)
    const icon = container.querySelector('.text-red-400')
    expect(icon).toBeInTheDocument()
  })

  it('should have no accessibility violations', async () => {
    await testA11y(<ErrorState onRetry={jest.fn()} />)
  })
})

describe('OfflineState', () => {
  it('should render offline message', () => {
    render(<OfflineState />)

    expect(screen.getByText("You're offline")).toBeInTheDocument()
    expect(
      screen.getByText(/It looks like you've lost your internet connection/)
    ).toBeInTheDocument()
  })

  it('should render retry button when provided', () => {
    const handleRetry = jest.fn()
    render(<OfflineState onRetry={handleRetry} />)

    const button = screen.getByRole('button', { name: 'Try Again' })
    fireEvent.click(button)
    expect(handleRetry).toHaveBeenCalledTimes(1)
  })

  it('should not render retry button when not provided', () => {
    render(<OfflineState />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('should be accessible', () => {
    render(<OfflineState />)
    expect(screen.getByRole('status')).toHaveAccessibleName("You're offline")
  })

  it('should have offline icon with orange color', () => {
    const { container } = render(<OfflineState />)
    const icon = container.querySelector('.text-orange-400')
    expect(icon).toBeInTheDocument()
  })

  it('should have no accessibility violations', async () => {
    await testA11y(<OfflineState onRetry={jest.fn()} />)
  })
})

describe('CompactEmptyState', () => {
  it('should render with message only', () => {
    render(<CompactEmptyState message="Test message" />)
    expect(screen.getByText('Test message')).toBeInTheDocument()
  })

  it('should render with icon', () => {
    render(
      <CompactEmptyState
        message="Message"
        icon={<svg data-testid="compact-icon" aria-hidden="true" />}
      />
    )
    expect(screen.getByTestId('compact-icon')).toBeInTheDocument()
  })

  it('should render action button', () => {
    const handleClick = jest.fn()
    render(
      <CompactEmptyState
        message="Message"
        action={{
          label: 'Action Button',
          onClick: handleClick,
        }}
      />
    )

    const button = screen.getByRole('button', { name: 'Action Button' })
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should not render action button when not provided', () => {
    render(<CompactEmptyState message="Message" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('should have compact styling', () => {
    const { container } = render(<CompactEmptyState message="Message" />)
    const element = container.querySelector('.py-8.px-4')
    expect(element).toBeInTheDocument()
  })

  it('should have no accessibility violations', async () => {
    await testA11y(<CompactEmptyState message="Test message" />)
  })
})

describe('PermissionDenied', () => {
  it('should render permission denied message', () => {
    render(<PermissionDenied />)

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(
      screen.getByText(/You don't have permission to view this content/)
    ).toBeInTheDocument()
  })

  it('should render go back button when provided', () => {
    const handleGoBack = jest.fn()
    render(<PermissionDenied onGoBack={handleGoBack} />)

    const button = screen.getByRole('button', { name: 'Go Back' })
    fireEvent.click(button)
    expect(handleGoBack).toHaveBeenCalledTimes(1)
  })

  it('should not render go back button when not provided', () => {
    render(<PermissionDenied />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('should be accessible', () => {
    render(<PermissionDenied />)
    expect(screen.getByRole('status')).toHaveAccessibleName('Access Denied')
  })

  it('should have lock icon with yellow color', () => {
    const { container } = render(<PermissionDenied />)
    const icon = container.querySelector('.text-yellow-400')
    expect(icon).toBeInTheDocument()
  })

  it('should have no accessibility violations', async () => {
    await testA11y(<PermissionDenied onGoBack={jest.fn()} />)
  })
})
