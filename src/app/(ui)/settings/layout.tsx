'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  User,
  Users,
  Cloud,
  Contact,
  Bell,
  Shield,
  ArrowLeft,
} from 'lucide-react'

const tabs = [
  { href: '/settings', label: 'General', icon: User },
  { href: '/settings/profile', label: 'Profile', icon: User },
  { href: '/settings/users', label: 'Users', icon: Users },
  { href: '/settings/integrations', label: 'Integrations', icon: Cloud },
  { href: '/settings/contacts', label: 'Contacts', icon: Contact },
  { href: '/settings/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings/security', label: 'Security', icon: Shield },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and application preferences
        </p>
      </div>

      <div className="border-b mb-8">
        <nav className="flex gap-1 overflow-x-auto pb-px">
          {tabs.map((tab) => {
            const active = pathname === tab.href || (tab.href !== '/settings' && pathname?.startsWith(tab.href))
            const Icon = tab.icon
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'flex items-center gap-2 py-2.5 px-3 border-b-2 text-sm font-medium transition-colors whitespace-nowrap',
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            )
          })}
        </nav>
      </div>

      {children}
    </div>
  )
}
