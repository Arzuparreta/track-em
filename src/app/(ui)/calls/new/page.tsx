"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Clock, User, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

interface Contact {
  id: string
  name: string
  phones: string[]
}

export default function NewCallPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    contactId: '',
    direction: 'OUTBOUND' as 'INBOUND' | 'OUTBOUND',
    startedAt: new Date().toISOString().slice(0, 16),
    durationSeconds: '',
    reason: '',
    conclusion: '',
    createFollowUp: false,
    followUpDate: '',
    followUpNotes: '',
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
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load contacts',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const contactId = params.get('contactId')
    if (contactId && contacts.find(c => c.id === contactId)) {
      setFormData(prev => ({ ...prev, contactId }))
    }
  }, [contacts])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          durationSeconds: formData.durationSeconds ? parseInt(formData.durationSeconds) : undefined,
          startedAt: new Date(formData.startedAt).toISOString(),
          followUpDate: formData.createFollowUp ? formData.followUpDate : undefined,
          followUpNotes: formData.createFollowUp ? formData.followUpNotes : undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create call')
      }

      const data = await response.json()
      toast({
        title: 'Success',
        description: 'Call logged successfully',
      })

      router.push(`/contacts/${data.data.contact.id}`)
      router.refresh()
    } catch (err: unknown) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to log call',
        variant: 'destructive',
      })
    }
  }

  const selectedContact = contacts.find(c => c.id === formData.contactId)

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-8 w-32" />
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
          <a href="javascript:history.back()">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </a>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Log a Call</h1>
        <p className="text-sm text-muted-foreground mt-1">Record details about your conversation</p>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="direction">Direction *</Label>
                <Select
                  value={formData.direction}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, direction: value as 'INBOUND' | 'OUTBOUND' }))}
                >
                  <SelectTrigger id="direction">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INBOUND">Incoming</SelectItem>
                    <SelectItem value="OUTBOUND">Outgoing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="startedAt">Date & Time *</Label>
                <Input
                  id="startedAt"
                  type="datetime-local"
                  value={formData.startedAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, startedAt: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="durationSeconds">Duration (seconds)</Label>
              <Input
                id="durationSeconds"
                type="number"
                min="0"
                placeholder="e.g., 180"
                value={formData.durationSeconds}
                onChange={(e) => setFormData(prev => ({ ...prev, durationSeconds: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="reason">Reason / Topic</Label>
              <Input
                id="reason"
                placeholder="e.g., Contract negotiation, Follow-up on proposal"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="conclusion">Conclusion / Outcome</Label>
              <Textarea
                id="conclusion"
                placeholder="e.g., Agreed to review contract, Will send proposal by Friday"
                value={formData.conclusion}
                onChange={(e) => setFormData(prev => ({ ...prev, conclusion: e.target.value }))}
                rows={3}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="createFollowUp"
                  checked={formData.createFollowUp}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, createFollowUp: checked as boolean }))}
                />
                <Label htmlFor="createFollowUp" className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Schedule a follow-up
                </Label>
              </div>

              {formData.createFollowUp && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-6 border-l-2 border-border">
                  <div>
                    <Label htmlFor="followUpDate">Follow-up Date & Time *</Label>
                    <Input
                      id="followUpDate"
                      type="datetime-local"
                      value={formData.followUpDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, followUpDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="followUpNotes">Notes</Label>
                    <Input
                      id="followUpNotes"
                      placeholder="Reminder notes..."
                      value={formData.followUpNotes}
                      onChange={(e) => setFormData(prev => ({ ...prev, followUpNotes: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 sm:flex-none">
                Log Call
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {selectedContact && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Calling:</p>
            <p className="text-sm font-medium">{selectedContact.name}</p>
            {selectedContact.phones[0] && (
              <p className="text-xs text-muted-foreground mt-0.5">{selectedContact.phones[0]}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
