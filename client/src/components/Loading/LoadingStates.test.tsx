/**
 * Loading States Components Tests
 */

import React from 'react'
import { render, screen } from '../../test-utils'
import {
  Spinner,
  ProjectListSkeleton,
  GanttChartSkeleton,
  TaskListSkeleton,
  ProgressiveLoader,
  LoadingOverlay,
  InlineSpinner,
  FullPageSpinner,
} from './LoadingStates'

describe('Spinner', () => {
  it('should render with default props', () => {
    render(<Spinner />)
    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveAttribute('aria-label', 'Loading')
  })

  it('should render with custom size', () => {
    render(<Spinner size="lg" />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('w-8', 'h-8')
  })

  it('should render with custom color', () => {
    render(<Spinner color="secondary" />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('border-gray-600')
  })

  it('should have sr-only text', () => {
    render(<Spinner />)
    expect(screen.getByText('Loading...')).toHaveClass('sr-only')
  })
})

describe('ProjectListSkeleton', () => {
  it('should render default number of skeletons', () => {
    render(<ProjectListSkeleton />)
    const status = screen.getByRole('status')
    expect(status).toBeInTheDocument()
    expect(status).toHaveAttribute('aria-label', 'Loading projects')
  })

  it('should render custom count of skeletons', () => {
    const { container } = render(<ProjectListSkeleton count={3} />)
    // Check for the number of skeleton cards
    const cards = container.querySelectorAll('.p-4.bg-white.border')
    expect(cards).toHaveLength(3)
  })

  it('should be accessible', () => {
    render(<ProjectListSkeleton />)
    expect(screen.getByRole('status')).toHaveAccessibleName('Loading projects')
  })
})

describe('GanttChartSkeleton', () => {
  it('should render', () => {
    render(<GanttChartSkeleton />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('should have accessible label', () => {
    render(<GanttChartSkeleton />)
    expect(screen.getByRole('status')).toHaveAccessibleName('Loading chart')
  })

  it('should render timeline header skeletons', () => {
    const { container } = render(<GanttChartSkeleton />)
    // Check for multiple skeleton elements
    const skeletons = container.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })
})

describe('TaskListSkeleton', () => {
  it('should render with default count', () => {
    render(<TaskListSkeleton />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('should render custom count', () => {
    const { container } = render(<TaskListSkeleton count={3} />)
    const items = container.querySelectorAll('.flex.items-center.gap-3')
    expect(items).toHaveLength(3)
  })

  it('should be accessible', () => {
    render(<TaskListSkeleton />)
    expect(screen.getByRole('status')).toHaveAccessibleName('Loading tasks')
  })
})

describe('ProgressiveLoader', () => {
  it('should show children when not loading', () => {
    render(
      <ProgressiveLoader isLoading={false} itemsLoaded={10} totalItems={10}>
        <div data-testid="content">Content</div>
      </ProgressiveLoader>
    )

    expect(screen.getByTestId('content')).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('should show loading state when loading', () => {
    render(
      <ProgressiveLoader isLoading={true} itemsLoaded={5} totalItems={10}>
        <div data-testid="content">Content</div>
      </ProgressiveLoader>
    )

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('should show correct progress', () => {
    render(
      <ProgressiveLoader isLoading={true} itemsLoaded={5} totalItems={10}>
        <div>Content</div>
      </ProgressiveLoader>
    )

    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuenow', '50')
  })

  it('should display item counts', () => {
    render(
      <ProgressiveLoader isLoading={true} itemsLoaded={7} totalItems={10}>
        <div>Content</div>
      </ProgressiveLoader>
    )

    expect(screen.getByText('7 / 10')).toBeInTheDocument()
  })

  it('should handle zero total items', () => {
    render(
      <ProgressiveLoader isLoading={true} itemsLoaded={0} totalItems={0}>
        <div>Content</div>
      </ProgressiveLoader>
    )

    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuenow', '0')
  })
})

describe('LoadingOverlay', () => {
  it('should show children without overlay when not loading', () => {
    render(
      <LoadingOverlay isLoading={false}>
        <div data-testid="content">Content</div>
      </LoadingOverlay>
    )

    expect(screen.getByTestId('content')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('should show overlay when loading', () => {
    render(
      <LoadingOverlay isLoading={true}>
        <div data-testid="content">Content</div>
      </LoadingOverlay>
    )

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('should display custom message', () => {
    render(
      <LoadingOverlay isLoading={true} message="Loading data...">
        <div>Content</div>
      </LoadingOverlay>
    )

    expect(screen.getByText('Loading data...')).toBeInTheDocument()
  })

  it('should apply blur when configured', () => {
    const { container } = render(
      <LoadingOverlay isLoading={true} blur={true}>
        <div>Content</div>
      </LoadingOverlay>
    )

    const blurredElement = container.querySelector('.filter.blur-sm')
    expect(blurredElement).toBeInTheDocument()
  })

  it('should not apply blur when disabled', () => {
    const { container } = render(
      <LoadingOverlay isLoading={true} blur={false}>
        <div>Content</div>
      </LoadingOverlay>
    )

    const blurredElement = container.querySelector('.filter.blur-sm')
    expect(blurredElement).not.toBeInTheDocument()
  })

  it('should be accessible', () => {
    render(
      <LoadingOverlay isLoading={true}>
        <div>Content</div>
      </LoadingOverlay>
    )

    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
  })
})

describe('InlineSpinner', () => {
  it('should render with default text', () => {
    render(<InlineSpinner />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should render with custom text', () => {
    render(<InlineSpinner text="Please wait..." />)
    expect(screen.getByText('Please wait...')).toBeInTheDocument()
  })

  it('should have status role', () => {
    render(<InlineSpinner />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('should be accessible', () => {
    render(<InlineSpinner />)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
  })
})

describe('FullPageSpinner', () => {
  it('should render centered spinner', () => {
    render(<FullPageSpinner />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('should display custom message', () => {
    render(<FullPageSpinner message="Loading application..." />)
    expect(screen.getByText('Loading application...')).toBeInTheDocument()
  })

  it('should be accessible', () => {
    render(<FullPageSpinner message="Loading..." />)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
  })

  it('should have full page styling', () => {
    const { container } = render(<FullPageSpinner />)
    const wrapper = container.firstChild
    expect(wrapper).toHaveClass('min-h-screen')
  })
})
