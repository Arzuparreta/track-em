"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Clock, CheckCircle, AlertCircle, Phone, Mail, UserPlus, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { format, isToday, isPast, parseISO } from 'date-fns'
import { formatDistanceToNow } from 'date-fns'

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

      // Fetch follow-ups
      const followUpsRes = await fetch('/api/follow-ups')
      const followUpsData = await followUpsRes.json()
      const allFollowUps = followUpsData.data || []

      // Fetch recent calls
      const callsRes = await fetch('/api/calls?limit=5')
      const callsData = await callsRes.json()
      const allCalls = callsData.data || []

      // Fetch contacts count
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
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-20 w-full" />
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
    <div className="p-6 space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-500">Total Contacts</div>
            <div className="mt-2 text-3xl font-bold">{stats.contacts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-500">Today's Follow-ups</div>
            <div className="mt-2 text-3xl font-bold text-amber-600">{todayFollowUps.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-500">Overdue</div>
            <div className="mt-2 text-3xl font-bold text-red-600">{overdueFollowUps.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm font-medium text-gray-500">Pending</div>
            <div className="mt-2 text-3xl font-bold text-blue-600">{stats.pendingFollowUps}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button asChild className="h-20 flex flex-col items-center gap-2">
                <Link href="/contacts/new">
                  <UserPlus className="h-6 w-6" />
                  New Contact
                </Link>
              </Button>
              <Button asChild className="h-20 flex flex-col items-center gap-2">
                <Link href="/calls/new">
                  <Phone className="h-6 w-6" />
                  Log Call
                </Link>
              </Button>
              <Button asChild className="h-20 flex flex-col items-center gap-2">
                <Link href="/follow-ups/new">
                  <Calendar className="h-6 w-6" />
                  Schedule
                </Link>
              </Button>
              <Button variant="outline" asChild className="h-20 flex flex-col items-center gap-2">
                <Link href="/contacts">
                  <Mail className="h-6 w-6" />
                  View All
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Calls</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCalls.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No calls yet</p>
            ) : (
              <div className="space-y-3">
                {recentCalls.map((call) => (
                  <div key={call.id} className="flex items-center gap-2 text-sm">
                    <span className={`w-2 h-2 rounded-full ${call.direction === 'OUTBOUND' ? 'bg-blue-500' : 'bg-green-500'}`} />
                    <span className="font-medium">{call.contact.name}</span>
                    <span className="text-gray-500">
                      {formatDistanceToNow(parseISO(call.startedAt), { addSuffix: true })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today's Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {todayFollowUps.length === 0 && overdueFollowUps.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-500">No tasks due today. Great work!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {overdueFollowUps.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <h3 className="font-semibold text-red-700">Overdue</h3>
                  </div>
                  <div className="space-y-2">
                    {overdueFollowUps.map((fu) => (
                      <div key={fu.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div>
                          <p className="font-medium">{fu.contact.name}</p>
                          <p className="text-sm text-gray-600">{fu.notes || 'Follow-up'}</p>
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
                    <Clock className="h-5 w-5 text-amber-500" />
                    <h3 className="font-semibold text-amber-700">Due Today</h3>
                  </div>
                  <div className="space-y-2">
                    {todayFollowUps.map((fu) => (
                      <div key={fu.id} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div>
                          <p className="font-medium">{fu.contact.name}</p>
                          <p className="text-sm text-gray-600">{fu.notes || 'Follow-up'}</p>
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
