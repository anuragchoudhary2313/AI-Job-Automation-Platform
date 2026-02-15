import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'

// Mock providers wrapper
interface AllProvidersProps {
  children: React.ReactNode
}

const AllProviders = ({ children }: AllProvidersProps) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  )
}

// Custom render function
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Mock data generators
export const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  role: 'member',
  team_id: 1
}

export const mockJob = {
  id: 1,
  title: 'Software Engineer',
  company: 'Tech Corp',
  description: 'Great opportunity',
  status: 'pending',
  hr_email: 'hr@techcorp.com',
  match_score: 85.5,
  team_id: 1,
  created_at: '2024-01-01T00:00:00Z'
}

export const mockJobs = Array.from({ length: 10 }, (_, i) => ({
  ...mockJob,
  id: i + 1,
  title: `Job ${i + 1}`,
  company: `Company ${i + 1}`
}))

// Mock API responses
export const mockApiResponse = <T,>(data: T, delay = 0) => {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), delay)
  })
}

// Mock fetch helper
export const mockFetch = (data: any, ok = true) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    json: async () => data,
    text: async () => JSON.stringify(data),
    status: ok ? 200 : 400,
  })
}
