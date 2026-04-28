'use client'

import { User } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface UsersTableProps {
  users: User[]
  onEdit: (user: User) => void
}

export function UsersTable({ users, onEdit }: UsersTableProps) {
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (res.ok) {
        window.location.reload()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete user')
      }
    } catch {
      alert('Failed to delete user')
    }
  }

  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No users yet.</p>
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Name
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Email
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Role
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Created
            </th>
            <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {users.map((user) => (
            <tr key={user.id} className="bg-card">
              <td className="px-4 py-3 text-sm font-medium">
                {user.name || '-'}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {user.email}
              </td>
              <td className="px-4 py-3">
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                  {user.role}
                </Badge>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 text-right text-sm font-medium space-x-2">
                <Button variant="ghost" size="sm" onClick={() => onEdit(user)}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(user.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
