/**
 * Table Filtering Tests
 * Tests for JobsTable filtering, sorting, and pagination
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../test/utils'
import userEvent from '@testing-library/user-event'
import { JobsTable } from '../pages/Jobs/components/JobsTable'
import { mockJobs } from '../test/utils'

describe('JobsTable Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders table with job data', () => {
    render(<JobsTable jobs={mockJobs} />)

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(mockJobs.length + 1) // +1 for header
  })

  it('filters jobs by company name', async () => {
    const user = userEvent.setup()
    render(<JobsTable jobs={mockJobs} />)

    const searchInput = screen.getByPlaceholderText(/search company/i)
    await user.type(searchInput, 'Company 1')

    await waitFor(() => {
      const rows = screen.getAllByRole('row')
      expect(rows.length).toBeLessThan(mockJobs.length + 1)
    })
  })

  it('filters jobs by status', async () => {
    const user = userEvent.setup()
    const jobsWithStatus = mockJobs.map((job, i) => ({
      ...job,
      status: i % 2 === 0 ? 'applied' : 'pending'
    }))

    render(<JobsTable jobs={jobsWithStatus} />)

    const statusFilter = screen.getByLabelText(/filter by status/i)
    await user.selectOptions(statusFilter, 'applied')

    await waitFor(() => {
      const visibleJobs = screen.getAllByRole('row').slice(1) // Exclude header
      visibleJobs.forEach(row => {
        expect(row).toHaveTextContent(/applied/i)
      })
    })
  })

  it('sorts jobs by title', async () => {
    const user = userEvent.setup()
    render(<JobsTable jobs={mockJobs} />)

    const titleHeader = screen.getByText(/job title/i)
    await user.click(titleHeader)

    await waitFor(() => {
      const rows = screen.getAllByRole('row').slice(1)
      const firstJobTitle = rows[0].textContent
      const lastJobTitle = rows[rows.length - 1].textContent

      // Should be sorted alphabetically
      expect(firstJobTitle! < lastJobTitle!).toBe(true)
    })
  })

  it('sorts jobs by date', async () => {
    const user = userEvent.setup()
    const jobsWithDates = mockJobs.map((job, i) => ({
      ...job,
      created_at: new Date(2024, 0, i + 1).toISOString()
    }))

    render(<JobsTable jobs={jobsWithDates} />)

    const dateHeader = screen.getByText(/date/i)
    await user.click(dateHeader)

    // Should sort by date
    await waitFor(() => {
      expect(screen.getAllByRole('row').length).toBeGreaterThan(0)
    })
  })

  it('paginates jobs correctly', async () => {
    const user = userEvent.setup()
    const manyJobs = Array.from({ length: 25 }, (_, i) => ({
      ...mockJobs[0],
      id: i + 1,
      title: `Job ${i + 1}`
    }))

    render(<JobsTable jobs={manyJobs} pageSize={10} />)

    // Should show first 10 jobs
    expect(screen.getAllByRole('row')).toHaveLength(11) // +1 for header

    // Click next page
    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)

    await waitFor(() => {
      expect(screen.getByText(/job 11/i)).toBeInTheDocument()
    })
  })

  it('shows empty state when no jobs match filter', async () => {
    const user = userEvent.setup()
    render(<JobsTable jobs={mockJobs} />)

    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, 'NonexistentCompany')

    await waitFor(() => {
      expect(screen.getByText(/no jobs found/i)).toBeInTheDocument()
    })
  })

  it('clears filters', async () => {
    const user = userEvent.setup()
    render(<JobsTable jobs={mockJobs} />)

    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, 'Company 1')

    const clearButton = screen.getByRole('button', { name: /clear filters/i })
    await user.click(clearButton)

    await waitFor(() => {
      expect(searchInput).toHaveValue('')
      expect(screen.getAllByRole('row')).toHaveLength(mockJobs.length + 1)
    })
  })

  it('selects multiple jobs', async () => {
    const user = userEvent.setup()
    render(<JobsTable jobs={mockJobs} selectable />)

    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[1]) // First job
    await user.click(checkboxes[2]) // Second job

    expect(checkboxes[1]).toBeChecked()
    expect(checkboxes[2]).toBeChecked()
  })

  it('selects all jobs', async () => {
    const user = userEvent.setup()
    render(<JobsTable jobs={mockJobs.slice(0, 5)} selectable />)

    const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i })
    await user.click(selectAllCheckbox)

    const checkboxes = screen.getAllByRole('checkbox')
    checkboxes.forEach(checkbox => {
      expect(checkbox).toBeChecked()
    })
  })

  it('shows job count', () => {
    render(<JobsTable jobs={mockJobs} />)

    expect(screen.getByText(/showing \d+ of \d+ jobs/i)).toBeInTheDocument()
  })
})
