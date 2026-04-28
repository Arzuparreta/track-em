"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { Suspense } from 'react'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

interface Contact {
  id: string
  name: string
}

function NewFollowUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    contactId: searchParams?.get('contactId') || '',
    callId: searchParams?.get('callId') || '',
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    notes: '',
  })

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/contacts')
      if (!response.ok) throw new Error('Failed to fetch contacts')
      const data = await response.json()
      setContacts(data.data || [])
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to load contacts', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/follow-ups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          scheduledAt: new Date(formData.scheduledAt).toISOString(),
          callId: formData.callId || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create follow-up')
      }

      toast({ title: 'Success', description: 'Follow-up scheduled' })
      router.push('/follow-ups')
      router.refresh()
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create follow-up',
        variant: 'destructive',
      })
    }
  }

  const selectedContact = contacts.find(c => c.id === formData.contactId)

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-8 w-40" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <Button variant="ghost" asChild size="sm" className="mb-2">
          <Link href="/follow-ups">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Schedule Follow-up</h1>
        <p className="text-sm text-muted-foreground mt-1">Set a reminder to follow up with a contact</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="contactId">Contact *</Label>
              <Select
                value={formData.contactId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, contactId: value }))}
              >
                <SelectTrigger id="contactId">
                  <SelectValue placeholder="Select a contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {contact.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="scheduledAt">Due Date & Time *</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="What needs to be discussed?"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            {selectedContact && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">Follow-up with:</p>
                <p className="text-sm font-medium">{selectedContact.name}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 sm:flex-none">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Schedule
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function NewFollowUpPage() {
  return (
    <Suspense fallback={<div className="p-6 lg:p-8">Loading...</div>}>
      <NewFollowUpForm />
    </Suspense>
  )
}
