"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Mail, Phone, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'

interface Contact {
  id: string
  name: string
  emails: string[]
  phones: string[]
  role?: string
  notes?: string
  calls: { id: string; startedAt: string }[]
  _count: {
    calls: number
    followUps: number
  }
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchContacts()
  }, [search])

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.append('search', search)

      const response = await fetch(`/api/contacts?${params}`)
      if (!response.ok) throw new Error('Failed to fetch contacts')

      const data = await response.json()
      setContacts(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contacts')
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => fetchContacts()}
            className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your music industry contacts</p>
        </div>
        <Button asChild>
          <Link href="/contacts/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Link>
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-1 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </div>
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No contacts found</p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/contacts/new">
                  Add your first contact
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {contacts.map((contact) => (
                <Link
                  key={contact.id}
                  href={`/contacts/${contact.id}`}
                  className="block hover:bg-muted/50 transition-colors"
                >
                  <div className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-xs font-medium">
                          {getInitials(contact.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold truncate">
                            {contact.name}
                          </h3>
                          {contact.role && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              {contact.role}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                          {contact.emails[0] && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {contact.emails[0]}
                            </span>
                          )}
                          {contact.phones[0] && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {contact.phones[0]}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {contact._count.calls} calls
                          </span>
                          {contact._count.followUps > 0 && (
                            <span className="text-amber-600">
                              {contact._count.followUps} follow-up{contact._count.followUps !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
