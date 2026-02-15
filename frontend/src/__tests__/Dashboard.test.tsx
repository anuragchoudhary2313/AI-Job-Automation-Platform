/**
 * Dashboard Tests
 * Tests for dashboard metrics rendering and data display
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../test/utils'
import { Dashboard } from '../pages/Dashboard'

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock successful API responses
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/stats')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            total_jobs: 1248,
            applied: 856,
            interviewing: 24,
            response_rate: 12.8
          })
        })
      }
      if (url.includes('/jobs')) {
        return Promise.resolve({
          ok: true,
          json: async () => []
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      })
    })
  })

  it('renders dashboard title', () => {
    render(<Dashboard />)
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument()
  })

  it('displays loading state initially', () => {
    render(<Dashboard />)
    expect(screen.getAllByRole('status')).toHaveLength(4) // Skeleton loaders
  })

  it('renders all metric cards', async () => {
    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText(/total jobs/i)).toBeInTheDocument()
      expect(screen.getByText(/applied/i)).toBeInTheDocument()
      expect(screen.getByText(/interviewing/i)).toBeInTheDocument()
      expect(screen.getByText(/response rate/i)).toBeInTheDocument()
    })
  })

  it('displays correct metric values', async () => {
    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('1,248')).toBeInTheDocument()
      expect(screen.getByText('856')).toBeInTheDocument()
      expect(screen.getByText('24')).toBeInTheDocument()
      expect(screen.getByText(/12\.8%/)).toBeInTheDocument()
    })
  })

  it('shows metric change percentages', async () => {
    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText(/12\.5%/)).toBeInTheDocument() // Total jobs change
      expect(screen.getByText(/8\.2%/)).toBeInTheDocument()  // Applied change
    })
  })

  it('renders charts section', async () => {
    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText(/application volume/i)).toBeInTheDocument()
      expect(screen.getByText(/pipeline status/i)).toBeInTheDocument()
    })
  })

  it('displays activity feed', async () => {
    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText(/recent activity/i)).toBeInTheDocument()
    })
  })

  it('shows quick actions', async () => {
    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText(/add job/i)).toBeInTheDocument()
      expect(screen.getByText(/upload resume/i)).toBeInTheDocument()
    })
  })

  it('handles API error gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('API Error'))

    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText(/error loading dashboard/i)).toBeInTheDocument()
    })
  })

  it('refreshes data on interval', async () => {
    vi.useFakeTimers()
    render(<Dashboard />)

    const initialCallCount = (global.fetch as any).mock.calls.length

    // Fast-forward 30 seconds
    vi.advanceTimersByTime(30000)

    await waitFor(() => {
      expect((global.fetch as any).mock.calls.length).toBeGreaterThan(initialCallCount)
    })

    vi.useRealTimers()
  })

  it('animates metric cards on mount', async () => {
    render(<Dashboard />)

    await waitFor(() => {
      const cards = screen.getAllByRole('article')
      expect(cards.length).toBeGreaterThan(0)
      // Cards should have animation classes
      cards.forEach(card => {
        expect(card).toHaveClass(/motion/)
      })
    })
  })
})
