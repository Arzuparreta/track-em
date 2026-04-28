"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ContactForm from '@/components/contacts/ContactForm'
import { getContact, updateContact } from '@/lib/api/contacts'
import { Skeleton } from '@/components/ui/skeleton'

interface ContactFormData {
  name: string
  emails: string[]
  phones: string[]
  role: string
  artistContext: string
  notes: string
}

export default function EditContactPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [initialData, setInitialData] = useState<ContactFormData | undefined>()
  const [loadingContact, setLoadingContact] = useState(true)

  useEffect(() => {
    const fetchContact = async () => {
      try {
        const contact = await getContact(params.id)
        setInitialData({
          name: contact.name,
          emails: contact.emails.length > 0 ? contact.emails : [''],
          phones: contact.phones.length > 0 ? contact.phones : [''],
          role: contact.role || '',
          artistContext: contact.artistContext || '',
          notes: contact.notes || '',
        })
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Failed to load contact')
        router.push('/contacts')
      } finally {
        setLoadingContact(false)
      }
    }
    fetchContact()
  }, [params.id, router])

  const handleSubmit = async (data: ContactFormData) => {
    setIsLoading(true)
    try {
      await updateContact(params.id, data)
      router.push(`/contacts/${params.id}`)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update contact')
    } finally {
      setIsLoading(false)
    }
  }

  if (loadingContact) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <ContactForm
      initialData={initialData}
      contactId={params.id}
      onSubmit={handleSubmit}
      isLoading={isLoading}
    />
  )
}
