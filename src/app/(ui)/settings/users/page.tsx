import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import UsersClient from '@/components/settings/UsersClient'

export default async function SettingsUsersPage() {
  const session = await getServerSession(authOptions)

  if (!session || (session.user as any).role !== 'admin') {
    redirect('/')
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      passwordHash: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' }
  })

  return <UsersClient initialUsers={users} />
}
