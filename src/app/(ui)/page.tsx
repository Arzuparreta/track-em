"use client"

import React from 'react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Clock, CheckCircle, AlertCircle, Phone, Mail, UserPlus, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { isToday, isPast, parseISO } from 'date-fns'
import { formatDistanceToNow } from 'date-fns'

export const dynamic = 'force-dynamic'

interface FollowUp {
  id: string
  scheduledAt: string
  notes?: string
  completed: boolean
  contact: {
    id: string
    name: string
  }
}

interface RecentCall {
  id: string
  direction: 'INBOUND' | 'OUTBOUND'
  startedAt: string
  reason?: string
  contact: {
    name: string
  }
}

export default function TodayPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [recentCalls, setRecentCalls] = useState<RecentCall[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    contacts: 0,
    pendingFollowUps: 0,
    overdue: 0,
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      const followUpsRes = await fetch('/api/follow-ups')
      const followUpsData = await followUpsRes.json()
      const allFollowUps = followUpsData.data || []

      const callsRes = await fetch('/api/calls?limit=5')
      const callsData = await callsRes.json()
      const allCalls = callsData.data || []

      const contactsRes = await fetch('/api/contacts')
      const contactsData = await contactsRes.json()
      const allContacts = contactsData.data || []

      setFollowUps(allFollowUps)
      setRecentCalls(allCalls.slice(0, 5))
      setStats({
        contacts: allContacts.length,
        pendingFollowUps: allFollowUps.filter((fu: any) => !fu.completed).length,
        overdue: allFollowUps.filter((fu: any) => !fu.completed && isPast(parseISO(fu.scheduledAt))).length,
      })
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async (id: string) => {
    try {
      const response = await fetch(`/api/follow-ups/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      })
      if (response.ok) {
        fetchData()
      }
    } catch (err) {
      console.error('Failed to complete follow-up:', err)
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-5 w-32 mb-4" />
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const todayFollowUps = followUps.filter(fu =>
    !fu.completed && isToday(parseISO(fu.scheduledAt))
  )
  const overdueFollowUps = followUps.filter(fu =>
    !fu.completed && isPast(parseISO(fu.scheduledAt)) && !isToday(parseISO(fu.scheduledAt))
  )

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Your overview for today</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{stats.contacts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Today&apos;s Follow-ups</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-amber-600">{todayFollowUps.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Overdue</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-red-600">{overdueFollowUps.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Pending</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-primary">{stats.pendingFollowUps}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button asChild variant="outline" className="h-20 flex flex-col gap-1.5">
                <Link href="/contacts/new">
                  <UserPlus className="h-5 w-5" />
                  <span className="text-xs">New Contact</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex flex-col gap-1.5">
                <Link href="/calls/new">
                  <Phone className="h-5 w-5" />
                  <span className="text-xs">Log Call</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex flex-col gap-1.5">
                <Link href="/follow-ups/new">
                  <Calendar className="h-5 w-5" />
                  <span className="text-xs">Schedule</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex flex-col gap-1.5">
                <Link href="/contacts">
                  <Mail className="h-5 w-5" />
                  <span className="text-xs">View All</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Calls</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCalls.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No calls yet</p>
            ) : (
              <div className="space-y-3">
                {recentCalls.map((call) => (
                  <div key={call.id} className="flex items-center gap-2 text-sm">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${call.direction === 'OUTBOUND' ? 'bg-blue-500' : 'bg-green-500'}`} />
                    <span className="font-medium truncate">{call.contact.name}</span>
                    <span className="text-muted-foreground ml-auto text-xs whitespace-nowrap">
                      {formatDistanceToNow(parseISO(call.startedAt), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {todayFollowUps.length === 0 && overdueFollowUps.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No tasks due today. Great work!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {overdueFollowUps.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <h3 className="font-semibold text-sm text-red-700">Overdue</h3>
                  </div>
                  <div className="space-y-2">
                    {overdueFollowUps.map((fu) => (
                      <div key={fu.id} className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50/50">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{fu.contact.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{fu.notes || 'Follow-up'}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleComplete(fu.id)}
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {todayFollowUps.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <h3 className="font-semibold text-sm text-amber-700">Due Today</h3>
                  </div>
                  <div className="space-y-2">
                    {todayFollowUps.map((fu) => (
                      <div key={fu.id} className="flex items-center justify-between p-3 rounded-lg border border-amber-200 bg-amber-50/50">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{fu.contact.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{fu.notes || 'Follow-up'}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleComplete(fu.id)}
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
