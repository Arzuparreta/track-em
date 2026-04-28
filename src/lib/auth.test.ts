import { describe, it, expect } from 'vitest'
import { authOptions } from './auth'

describe('Auth Configuration', () => {
  it('should have credentials provider configured', () => {
    expect(authOptions.providers).toHaveLength(1)
    expect(authOptions.providers[0].type).toBe('credentials')
  })

  it('should have a credentials provider with correct type', () => {
    const provider = authOptions.providers[0]
    expect(provider).toBeDefined()
    expect(provider.name).toBe('Credentials')
  })

  it('should have JWT session strategy', () => {
    expect(authOptions.session?.strategy).toBe('jwt')
  })

  it('should have sign-in page configured', () => {
    expect(authOptions.pages?.signIn).toBe('/auth/signin')
  })

  it('should have NEXTAUTH_SECRET configured', () => {
    expect(authOptions.secret).toBe(process.env.NEXTAUTH_SECRET || 'test-secret')
  })
})
