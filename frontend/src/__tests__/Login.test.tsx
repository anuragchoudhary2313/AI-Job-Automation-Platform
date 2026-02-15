/**
 * Login Form Tests
 * Tests for form validation, submission, and error handling
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../test/utils'
import userEvent from '@testing-library/user-event'
import { Login } from '../pages/Auth/Login'

describe('Login Form', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form with all fields', () => {
    render(<Login />)

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup()
    render(<Login />)

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/username is required/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('shows error for invalid username format', async () => {
    const user = userEvent.setup()
    render(<Login />)

    const usernameInput = screen.getByLabelText(/username/i)
    await user.type(usernameInput, 'ab')
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument()
    })
  })

  it('shows error for short password', async () => {
    const user = userEvent.setup()
    render(<Login />)

    const passwordInput = screen.getByLabelText(/password/i)
    await user.type(passwordInput, '123')
    await user.tab()

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
    })
  })

  it('submits form with valid credentials', async () => {
    const user = userEvent.setup()
    const mockLogin = vi.fn()

    // Mock successful login
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ access_token: 'fake-token', token_type: 'bearer' })
    })

    render(<Login />)

    await user.type(screen.getByLabelText(/username/i), 'testuser')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST'
        })
      )
    })
  })

  it('shows error message on failed login', async () => {
    const user = userEvent.setup()

    // Mock failed login
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ detail: 'Incorrect username or password' })
    })

    render(<Login />)

    await user.type(screen.getByLabelText(/username/i), 'wronguser')
    await user.type(screen.getByLabelText(/password/i), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/incorrect username or password/i)).toBeInTheDocument()
    })
  })

  it('disables submit button while loading', async () => {
    const user = userEvent.setup()

    global.fetch = vi.fn().mockImplementation(() =>
      new Promise(resolve => setTimeout(resolve, 1000))
    )

    render(<Login />)

    await user.type(screen.getByLabelText(/username/i), 'testuser')
    await user.type(screen.getByLabelText(/password/i), 'password123')

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)

    expect(submitButton).toBeDisabled()
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    render(<Login />)

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement
    expect(passwordInput.type).toBe('password')

    const toggleButton = screen.getByRole('button', { name: /show password/i })
    await user.click(toggleButton)

    expect(passwordInput.type).toBe('text')
  })

  it('navigates to register page', async () => {
    const user = userEvent.setup()
    render(<Login />)

    const registerLink = screen.getByText(/create account/i)
    expect(registerLink).toHaveAttribute('href', '/register')
  })
})
