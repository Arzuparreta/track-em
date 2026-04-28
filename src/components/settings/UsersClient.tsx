'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { UsersTable } from './UsersTable'
import { UserForm } from './UserForm'
import { User } from '@prisma/client'
import { Plus } from 'lucide-react'

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
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">User Management</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage user accounts and permissions</p>
        </div>
        <Button onClick={handleCreate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
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
