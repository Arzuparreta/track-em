"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, CheckCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { format, isPast, isToday, isTomorrow, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

interface FollowUp {
  id: string
  scheduledAt: string
  notes?: string
  completed: boolean
  contact: {
    id: string
    name: string
  }
  call?: {
    id: string
    reason?: string
  } | null
}

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFollowUps()
  }, [])

  const fetchFollowUps = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/follow-ups')
      if (!response.ok) throw new Error('Failed to fetch follow-ups')
      const data = await response.json()
      setFollowUps(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch follow-ups')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleComplete = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/follow-ups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !currentStatus }),
      })
      if (!response.ok) throw new Error('Failed to update follow-up')
      fetchFollowUps()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update follow-up')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this follow-up?')) return
    try {
      const response = await fetch(`/api/follow-ups/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete follow-up')
      fetchFollowUps()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete follow-up')
    }
  }

  const groupFollowUps = () => {
    const today = followUps.filter(fu => isToday(parseISO(fu.scheduledAt)) && !fu.completed)
    const tomorrow = followUps.filter(fu => isTomorrow(parseISO(fu.scheduledAt)) && !fu.completed)
    const overdue = followUps.filter(fu => isPast(parseISO(fu.scheduledAt)) && !fu.completed)
    const upcoming = followUps.filter(fu => !isPast(parseISO(fu.scheduledAt)) && !isToday(parseISO(fu.scheduledAt)) && !isTomorrow(parseISO(fu.scheduledAt)) && !fu.completed)
    const completed = followUps.filter(fu => fu.completed)

    return { today, tomorrow, overdue, upcoming, completed }
  }

  const groups = groupFollowUps()

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4">
          {error}
          <button
            onClick={fetchFollowUps}
            className="ml-4 text-blue-600 hover:text-blue-700 underline"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const FollowUpSection = ({ title, followUps, variant = 'default' as const }: { title: string, followUps: FollowUp[], variant?: 'default' | 'overdue' | 'today' }) => {
    if (followUps.length === 0) return null

    const variantStyles = {
      overdue: 'border-red-200 bg-red-50/50',
      today: 'border-amber-200 bg-amber-50/50',
      default: 'border-gray-200',
    }

    const badgeStyles = {
      overdue: 'bg-red-100 text-red-800',
      today: 'bg-amber-100 text-amber-800',
      default: 'bg-blue-100 text-blue-800',
    }

    return (
      <div className={cn('p-4 border rounded-lg', variantStyles[variant])}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">{title}</h3>
          <Badge className={badgeStyles[variant]}>{followUps.length}</Badge>
        </div>
        <div className="space-y-3">
          {followUps.map((fu) => (
            <div key={fu.id} className="bg-white p-3 rounded-lg border shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{fu.contact.name}</p>
                    {fu.call && (
                      <Badge variant="outline" className="text-xs">
                        Call
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {format(parseISO(fu.scheduledAt), 'EEEE, MMM d, h:mm a')}
                  </p>
                  {fu.notes && (
                    <p className="text-sm text-gray-500 mt-1">{fu.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleComplete(fu.id, fu.completed)}
                    className={fu.completed ? 'text-green-600' : ''}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(fu.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Follow-ups</h1>
          <p className="text-sm text-gray-500">
            Track and manage your follow-up tasks
          </p>
        </div>
        <Button asChild>
          <Link href="/follow-ups/new">
            <Plus className="h-4 w-4 mr-2" />
            New Follow-up
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : followUps.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500 mb-4">No follow-ups scheduled</p>
            <Button asChild>
              <Link href="/follow-ups/new">
                <Plus className="h-4 w-4 mr-2" />
                Create your first follow-up
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.overdue.length > 0 && (
            <FollowUpSection title="Overdue" followUps={groups.overdue} variant="overdue" />
          )}
          {groups.today.length > 0 && (
            <FollowUpSection title="Due Today" followUps={groups.today} variant="today" />
          )}
          {groups.tomorrow.length > 0 && (
            <FollowUpSection title="Due Tomorrow" followUps={groups.tomorrow} />
          )}
          {groups.upcoming.length > 0 && (
            <FollowUpSection title="Upcoming" followUps={groups.upcoming} />
          )}
          {groups.completed.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-gray-500">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {groups.completed.map((fu) => (
                    <div key={fu.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium text-gray-400 line-through">{fu.contact.name}</p>
                        <p className="text-sm text-gray-500">
                          {format(parseISO(fu.scheduledAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
