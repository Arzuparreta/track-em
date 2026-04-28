'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UsersTable } from './UsersTable'
import { UserForm } from './UserForm'
import { User } from '@prisma/client'

interface UsersClientProps {
  initialUsers: User[]
}

export default function UsersClient({ initialUsers }: UsersClientProps) {
  const [users, _setUsers] = useState(initialUsers)
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const handleCreate = () => {
    setEditingUser(null)
    setShowForm(true)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingUser(null)
  }

  const handleSuccess = () => {
    setShowForm(false)
    setEditingUser(null)
    window.location.reload()
  }

  return (
    <div>
      <div className="mb-4">
        <Button onClick={handleCreate}>Add User</Button>
      </div>
      
      <UsersTable users={users} onEdit={handleEdit} />
      
      {showForm && (
        <UserForm
          user={editingUser}
          onClose={handleCloseForm}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
