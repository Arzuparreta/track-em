import React from 'react'
import { render, screen } from '@testing-library/react'
import HomePage from './(ui)/page'

describe('HomePage', () => {
  it('renders the page without crashing', async () => {
    render(<HomePage />)
    expect(await screen.findByText('Dashboard')).toBeInTheDocument()
  })

  it('renders stat cards', async () => {
    render(<HomePage />)
    expect(await screen.findByText('Total Contacts')).toBeInTheDocument()
    expect(screen.getByText("Today's Follow-ups")).toBeInTheDocument()
    expect(screen.getByText('Overdue')).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('renders quick actions section', async () => {
    render(<HomePage />)
    expect(await screen.findByText('Quick Actions')).toBeInTheDocument()
    expect(screen.getByText('New Contact')).toBeInTheDocument()
    expect(screen.getByText('Log Call')).toBeInTheDocument()
  })
})
