'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

interface SidebarItemProps {
  href: string
  icon: ReactNode
  label: string
  active?: boolean
}

function SidebarItem({ href, icon, label, active }: SidebarItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
        active
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground'
      )}
    >
      {icon}
      {label}
    </Link>
  )
}

interface SidebarGroupProps {
  label: string
  children: ReactNode
}

function SidebarGroup({ label, children }: SidebarGroupProps) {
  return (
    <div className="mb-6">
      <h3 className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-muted-foreground">
        {label}
      </h3>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  )
}

export { SidebarItem, SidebarGroup }
