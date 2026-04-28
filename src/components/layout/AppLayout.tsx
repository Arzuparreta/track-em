'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Phone,
  Calendar,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { Toaster } from '@/components/ui/toaster'
import { useState } from 'react'

interface AppLayoutProps {
  children: React.ReactNode
  user?: { name?: string; email?: string; role?: string }
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/follow-ups', label: 'Follow-ups', icon: Calendar },
  { href: '/calls/new', label: 'Log Call', icon: Phone },
]

export function AppLayout({ children, user }: AppLayoutProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isSettings = pathname?.startsWith('/settings')

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden sm:flex flex-col w-60 min-h-screen bg-sidebar border-r border-sidebar-border shrink-0">
        <div className="p-5 border-b border-sidebar-border">
          <Link href="/" className="text-lg font-bold text-sidebar-foreground tracking-tight">
            Music CRM
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/' && pathname?.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}

          <div className="pt-4 mt-4 border-t border-sidebar-border">
            <Link
              href={isSettings ? '/settings' : '/settings'}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isSettings
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <SettingsIcon className="h-4 w-4" />
              Settings
            </Link>
          </div>
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name || user?.email}</p>
            {user?.role && (
              <p className="text-xs text-sidebar-muted-foreground capitalize">{user.role}</p>
            )}
          </div>
          <Link
            href="/auth/signin"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="sm:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 h-14">
        <button onClick={() => setMobileOpen(true)} className="p-1">
          <Menu className="h-5 w-5 text-sidebar-foreground" />
        </button>
        <span className="text-base font-bold text-sidebar-foreground">Music CRM</span>
        <div className="w-5" />
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="sm:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setMobileOpen(false)}>
          <div className="w-64 h-full bg-sidebar border-r border-sidebar-border p-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <span className="text-lg font-bold text-sidebar-foreground">Music CRM</span>
              <button onClick={() => setMobileOpen(false)} className="p-1">
                <X className="h-5 w-5 text-sidebar-foreground" />
              </button>
            </div>
            <nav className="space-y-1">
              {navItems.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/' && pathname?.startsWith(href))
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                      active
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                )
              })}
              <div className="pt-4 mt-4 border-t border-sidebar-border">
                <Link
                  href="/settings"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isSettings
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  )}
                >
                  <SettingsIcon className="h-4 w-4" />
                  Settings
                </Link>
              </div>
            </nav>
            <div className="mt-6 pt-4 border-t border-sidebar-border">
              <Link href="/auth/signin" className="flex items-center gap-3 px-3 py-2 text-sm text-sidebar-muted-foreground">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <div className="sm:pt-0 pt-14">
          {children}
        </div>
      </main>

      <Toaster />
    </div>
  )
}
