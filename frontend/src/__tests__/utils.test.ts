/**
 * Utility Function Tests
 * Unit tests for helper functions
 */
import { describe, it, expect, vi } from 'vitest'
import {
  cn,
  formatDate,
  formatRelativeDate,
  formatCurrency,
  truncateText,
  debounce,
  validateEmail
} from '../lib/utils'

describe('Utility Functions', () => {
  describe('cn (className merger)', () => {
    it('merges class names', () => {
      const result = cn('class1', 'class2')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
    })

    it('handles conditional classes', () => {
      const result = cn('base', true && 'conditional', false && 'excluded')
      expect(result).toContain('base')
      expect(result).toContain('conditional')
      expect(result).not.toContain('excluded')
    })

    it('removes duplicate classes', () => {
      const result = cn('p-4', 'p-2')
      // Should keep only one padding class (Tailwind merge)
      expect(result.split(' ').filter(c => c.startsWith('p-')).length).toBe(1)
    })

    it('handles undefined and null', () => {
      const result = cn('class1', undefined, null, 'class2')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
    })
  })

  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      const formatted = formatDate(date)

      expect(formatted).toMatch(/Jan|January/)
      expect(formatted).toContain('15')
      expect(formatted).toContain('2024')
    })

    it('handles relative dates', () => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const result = formatRelativeDate(yesterday)
      expect(result).toMatch(/yesterday|1 day ago/i)
    })
  })

  describe('formatCurrency', () => {
    it('formats currency with symbol', () => {
      expect(formatCurrency(1000)).toBe('$1,000')
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
    })

    it('handles zero and negative values', () => {
      expect(formatCurrency(0)).toBe('$0')
      expect(formatCurrency(-100)).toBe('-$100')
    })
  })

  describe('truncateText', () => {
    it('truncates long text', () => {
      const longText = 'This is a very long text that should be truncated'

      const result = truncateText(longText, 20)
      expect(result.length).toBeLessThanOrEqual(23) // 20 + '...'
      expect(result).toContain('...')
    })

    it('does not truncate short text', () => {
      const shortText = 'Short text'

      const result = truncateText(shortText, 20)
      expect(result).toBe(shortText)
      expect(result).not.toContain('...')
    })
  })

  describe('debounce', () => {
    it('debounces function calls', async () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn()
      debouncedFn()
      debouncedFn()

      expect(mockFn).not.toHaveBeenCalled()

      await new Promise(resolve => setTimeout(resolve, 150))

      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('validateEmail', () => {
    it('validates correct email', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name+tag@example.co.uk')).toBe(true)
    })

    it('rejects invalid email', () => {
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('invalid@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
    })
  })
})
