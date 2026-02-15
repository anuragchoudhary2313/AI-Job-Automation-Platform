/**
 * Theme Toggle Tests
 * Tests for dark/light mode switching
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../test/utils'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from '../components/ui/ThemeToggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('renders theme toggle button', () => {
    render(<ThemeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    expect(button).toBeInTheDocument()
  })

  it('toggles to dark mode', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    await user.click(button)

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true)
    })
  })

  it('toggles back to light mode', async () => {
    const user = userEvent.setup()
    document.documentElement.classList.add('dark')

    render(<ThemeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    await user.click(button)

    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  it('persists theme preference to localStorage', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })
    await user.click(button)

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark')
    })
  })

  it('loads theme from localStorage on mount', () => {
    localStorage.getItem = vi.fn().mockReturnValue('dark')

    render(<ThemeToggle />)

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('respects system preference when no saved theme', () => {
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    render(<ThemeToggle />)

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('shows correct icon for current theme', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    // Light mode should show moon icon
    expect(screen.getByRole('img', { name: /moon/i })).toBeInTheDocument()

    const button = screen.getByRole('button', { name: /toggle theme/i })
    await user.click(button)

    // Dark mode should show sun icon
    await waitFor(() => {
      expect(screen.getByRole('img', { name: /sun/i })).toBeInTheDocument()
    })
  })

  it('has smooth transition animation', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    const button = screen.getByRole('button', { name: /toggle theme/i })

    expect(button).toHaveClass(/transition/)

    await user.click(button)

    // Button should maintain transition class
    expect(button).toHaveClass(/transition/)
  })
})
