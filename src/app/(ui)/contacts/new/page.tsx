"use client"

import { useRouter } from 'next/navigation'
import ContactForm from '@/components/contacts/ContactForm'
import { createContact } from '@/lib/api/contacts'
import { useState } from 'react'

export default function NewContactPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: {
    name: string
    emails: string[]
    phones: string[]
    role: string
    artistContext: string
    notes: string
  }) => {
    setIsLoading(true)
    try {
      const contact = await createContact(data)
      router.push(`/contacts/${contact.id}`)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create contact')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ContactForm onSubmit={handleSubmit} isLoading={isLoading} />
  )
}
