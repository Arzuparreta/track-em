"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Mail, Phone, Calendar, Clock, CheckCircle, Plus, Edit, Trash2, MessageCircle, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { format, formatDistanceToNow } from 'date-fns'

interface Contact {
  id: string
  name: string
  emails: string[]
  phones: string[]
  role?: string
  artistContext?: string
  notes?: string
  source?: 'MANUAL' | 'GOOGLE' | 'ICLOUD' | 'OUTLOOK'
  lastSyncedAt?: string
  calls: {
    id: string
    direction: 'INBOUND' | 'OUTBOUND'
    startedAt: string
    durationSeconds?: number
    reason?: string
    conclusion?: string
    sentiment?: string
  }[]
  mailThreads: {
    id: string
    subject: string
    snippet?: string
    lastMessageAt: string
    messageCount: number
    needsReply: boolean
  }[]
  followUps: {
    id: string
    scheduledAt: string
    notes?: string
    callId?: string
  }[]
}

export default function ContactDetailPage({ params }: { params: { id: string } }) {
  const [contact, setContact] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (params.id) {
      fetchContact()
    }
  }, [params.id])

  const fetchContact = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/contacts/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch contact')
      const data = await response.json()
      setContact(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contact')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this contact?')) return

    try {
      const response = await fetch(`/api/contacts/${params.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete contact')
      router.push('/contacts')
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete contact')
    }
  }

  const handleLogCall = () => {
    router.push(`/calls/new?contactId=${contact?.id}`)
  }

  const handleFollowUp = () => {
    router.push(`/follow-ups/new?contactId=${contact?.id}`)
  }

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getDirectionBadge = (direction: string) => {
    const colors = {
      INBOUND: 'bg-green-100 text-green-800',
      OUTBOUND: 'bg-blue-100 text-blue-800',
    }
    return colors[direction as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-32" />
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !contact) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4">
          {error || 'Contact not found'}
          <button
            onClick={() => router.push('/contacts')}
            className="ml-4 text-blue-600 hover:text-blue-700 underline"
          >
            Back to contacts
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/contacts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contacts
          </Link>
        </Button>
      </div>

      {/* Contact Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-2xl">
                  {getInitials(contact.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{contact.name}</h1>
                {contact.role && (
                  <Badge variant="secondary" className="mt-2">
                    {contact.role}
                  </Badge>
                )}
                {contact.artistContext && (
                  <p className="text-gray-600 mt-1">
                    {contact.artistContext}
                  </p>
                )}
                <div className="flex flex-wrap gap-3 mt-3">
                  {contact.emails.map((email, i) => (
                    <span
                      key={i}
                      className="flex items-center text-sm text-gray-600"
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      {email}
                    </span>
                  ))}
                  {contact.phones.map((phone, i) => (
                    <span
                      key={i}
                      className="flex items-center text-sm text-gray-600"
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      {phone}
                    </span>
                  ))}
                </div>
                {contact.source && contact.source !== 'MANUAL' && (
                  <p className="text-xs text-gray-400 mt-2">
                    Source: {contact.source}
                    {contact.lastSyncedAt && (
                      <> • Last synced {formatDistanceToNow(new Date(contact.lastSyncedAt))} ago</>
                    )}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleLogCall}>
                <Clock className="h-4 w-4 mr-2" />
                Log Call
              </Button>
              <Button variant="outline" onClick={handleFollowUp}>
                <Plus className="h-4 w-4 mr-2" />
                Follow-up
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/contacts/${contact.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {contact.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{contact.notes}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Calls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Calls</CardTitle>
          </CardHeader>
          <CardContent>
            {contact.calls.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No calls logged</p>
            ) : (
              <div className="space-y-4">
                {contact.calls.map((call) => (
                  <div key={call.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getDirectionBadge(call.direction)}>
                        {call.direction}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {format(new Date(call.startedAt), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    {call.reason && (
                      <p className="font-medium mb-1">{call.reason}</p>
                    )}
                    {call.conclusion && (
                      <p className="text-sm text-gray-600">{call.conclusion}</p>
                    )}
                    {call.sentiment && (
                      <Badge variant="outline" className="mt-2">
                        {call.sentiment}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
            <Button variant="ghost" asChild className="w-full mt-4">
              <Link href={`/contacts/${contact.id}/calls`}>
                View All Calls
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Email Threads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Email Threads</CardTitle>
          </CardHeader>
          <CardContent>
            {contact.mailThreads.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No email threads</p>
            ) : (
              <div className="space-y-4">
                {contact.mailThreads.map((thread) => (
                  <div key={thread.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{thread.subject}</h4>
                        {thread.snippet && (
                          <p className="text-sm text-gray-600 mt-1">
                            {thread.snippet}
                          </p>
                        )}
                      </div>
                      {thread.needsReply && (
                        <Badge variant="destructive">Needs Reply</Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                      <span>{thread.messageCount} messages</span>
                      <span>
                        {format(new Date(thread.lastMessageAt), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button variant="ghost" asChild className="w-full mt-4">
              <Link href={`/contacts/${contact.id}/emails`}>
                View All Emails
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Follow-ups */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Follow-ups</CardTitle>
            <Button variant="outline" size="sm" onClick={handleFollowUp}>
              <Plus className="h-4 w-4 mr-2" />
              Add Follow-up
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {contact.followUps.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No follow-ups scheduled</p>
          ) : (
            <div className="space-y-3">
              {contact.followUps.map((followUp) => (
                <div
                  key={followUp.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {format(new Date(followUp.scheduledAt), 'EEEE, MMM d, yyyy h:mm a')}
                    </p>
                    {followUp.notes && (
                      <p className="text-sm text-gray-600 mt-1">{followUp.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {followUp.callId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <Link href={`/calls/${followUp.callId}`}>
                          <MessageCircle className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-600 hover:text-green-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
