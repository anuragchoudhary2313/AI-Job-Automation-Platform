/**
 * Navigation Tests
 * Tests for sidebar navigation and routing
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../test/utils'
import userEvent from '@testing-library/user-event'
import { Sidebar } from '../components/layout/Sidebar'

const featureFlags = vi.hoisted(() => ({ adminPanelEnabled: false }))

vi.mock('../contexts/FeatureContext', () => ({
  useFeatures: () => ({
    isEnabled: (feature: string) => feature === 'admin_panel' ? featureFlags.adminPanelEnabled : false,
  }),
}))

describe('Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    featureFlags.adminPanelEnabled = false
  })

  it('renders all navigation items', () => {
    render(<Sidebar />)

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
    expect(screen.getByText(/jobs/i)).toBeInTheDocument()
    expect(screen.getByText(/resumes/i)).toBeInTheDocument()
    expect(screen.getByText(/settings/i)).toBeInTheDocument()
  })

  it('highlights active navigation item', () => {
    render(<Sidebar />)

    const dashboardLink = screen.getByText(/dashboard/i).closest('a')
    expect(dashboardLink).toHaveClass(/active|bg-blue/)
  })

  it('navigates to jobs page', async () => {
    const user = userEvent.setup()
    render(<Sidebar />)

    const jobsLink = screen.getByText(/jobs/i)
    await user.click(jobsLink)

    await waitFor(() => {
      expect(window.location.pathname).toBe('/jobs')
    })
  })

  it('collapses sidebar', async () => {
    const user = userEvent.setup()
    render(<Sidebar />)

    const collapseButton = screen.getByRole('button', { name: /collapse/i })
    await user.click(collapseButton)

    await waitFor(() => {
      expect(screen.getByRole('navigation')).toHaveClass(/w-20|collapsed/)
    })
  })

  it('expands sidebar', async () => {
    const user = userEvent.setup()
    localStorage.setItem('sidebar-collapsed', 'true')

    render(<Sidebar />)

    const expandButton = screen.getByRole('button', { name: /expand/i })
    await user.click(expandButton)

    await waitFor(() => {
      expect(screen.getByRole('navigation')).not.toHaveClass(/w-20|collapsed/)
    })
  })

  it('shows tooltips in collapsed mode', async () => {
    const user = userEvent.setup()
    localStorage.setItem('sidebar-collapsed', 'true')

    render(<Sidebar />)

    const jobsIcon = screen.getByRole('link', { name: /jobs/i })
    await user.hover(jobsIcon)

    await waitFor(() => {
      expect(screen.getByRole('tooltip', { name: /jobs/i })).toBeInTheDocument()
    })
  })

  it('persists sidebar state', async () => {
    const user = userEvent.setup()
    render(<Sidebar />)

    const collapseButton = screen.getByRole('button', { name: /collapse/i })
    await user.click(collapseButton)

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('sidebar-collapsed', 'true')
    })
  })

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<Sidebar />)

    const dashboardLink = screen.getByText(/dashboard/i)
    dashboardLink.focus()

    await user.keyboard('{Tab}')

    const jobsLink = screen.getByText(/jobs/i)
    expect(jobsLink).toHaveFocus()
  })

  it('shows admin menu for admin users', () => {
    featureFlags.adminPanelEnabled = true

    render(<Sidebar />)

    expect(screen.getByText(/admin/i)).toBeInTheDocument()
  })

  it('hides admin menu for regular users', () => {
    featureFlags.adminPanelEnabled = false

    render(<Sidebar />)

    expect(screen.queryByText(/admin/i)).not.toBeInTheDocument()
  })

  it('toggles with keyboard shortcut Ctrl+B', async () => {
    const user = userEvent.setup()
    render(<Sidebar />)

    await user.keyboard('{Control>}b{/Control}')

    await waitFor(() => {
      expect(screen.getByRole('navigation')).toHaveClass(/collapsed/)
    })
  })
})
