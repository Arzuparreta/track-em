"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'

interface ContactFormData {
  name: string
  emails: string[]
  phones: string[]
  role: string
  artistContext: string
  notes: string
}

interface ContactFormProps {
  initialData?: ContactFormData
  contactId?: string
  onSubmit: (data: ContactFormData) => Promise<void>
  isLoading: boolean
}

const ROLE_OPTIONS = [
  { value: 'none', label: 'No role' },
  { value: 'booking_agent', label: 'Booking Agent' },
  { value: 'manager', label: 'Manager' },
  { value: 'promoter', label: 'Promoter' },
  { value: 'venue', label: 'Venue' },
  { value: 'press', label: 'Press' },
  { value: 'label', label: 'Label' },
  { value: 'artist', label: 'Artist' },
  { value: 'producer', label: 'Producer' },
  { value: 'other', label: 'Other' },
]

export default function ContactForm({
  initialData,
  contactId,
  onSubmit,
  isLoading,
}: ContactFormProps) {
  const router = useRouter()
    const [formData, setFormData] = useState<ContactFormData>(
      initialData || {
        name: '',
        emails: [''],
        phones: [''],
        role: 'none',
        artistContext: '',
        notes: '',
      }
    )

  const addEmail = () => {
    setFormData((prev) => ({
      ...prev,
      emails: [...prev.emails, ''],
    }))
  }

  const removeEmail = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      emails: prev.emails.filter((_, i) => i !== index),
    }))
  }

  const updateEmail = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      emails: prev.emails.map((email, i) => (i === index ? value : email)),
    }))
  }

  const addPhone = () => {
    setFormData((prev) => ({
      ...prev,
      phones: [...prev.phones, ''],
    }))
  }

  const removePhone = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      phones: prev.phones.filter((_, i) => i !== index),
    }))
  }

  const updatePhone = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      phones: prev.phones.map((phone, i) => (i === index ? value : phone)),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanedData = {
      ...formData,
      emails: formData.emails.filter((e) => e.trim() !== ''),
      phones: formData.phones.filter((p) => p.trim() !== ''),
    }

    if (!cleanedData.name.trim()) {
      alert('Name is required')
      return
    }

    await onSubmit(cleanedData)
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <Button variant="ghost" onClick={() => router.back()} size="sm" className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          {contactId ? 'Edit Contact' : 'Add Contact'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {contactId ? 'Update contact information' : 'Create a new contact'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Contact name"
                required
              />
            </div>

            <div>
              <Label>Emails</Label>
              <div className="space-y-2">
                {formData.emails.map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => updateEmail(index, e.target.value)}
                      placeholder="email@example.com"
                    />
                    {formData.emails.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeEmail(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addEmail}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Email
                </Button>
              </div>
            </div>

            <div>
              <Label>Phone Numbers</Label>
              <div className="space-y-2">
                {formData.phones.map((phone, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => updatePhone(index, e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                    {formData.phones.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removePhone(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPhone}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Phone
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="artistContext">Artist Context</Label>
                <Input
                  id="artistContext"
                  value={formData.artistContext}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      artistContext: e.target.value,
                    }))
                  }
                  placeholder="Related artist"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Add notes about this contact..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? 'Saving...'
              : contactId
                ? 'Update Contact'
                : 'Create Contact'}
          </Button>
        </div>
      </form>
    </div>
  )
}
