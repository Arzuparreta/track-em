import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { compare, hash } from 'bcrypt'

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new password required' }, { status: 400 })
    }

    // Get current user with password hash
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { passwordHash: true }
    })

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'User not found or no password set' }, { status: 400 })
    }

    // Verify current password
    const isValid = await compare(currentPassword, user.passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    // Hash and update new password
    const passwordHash = await hash(newPassword, 12)
    
    await prisma.user.update({
      where: { id: (session.user as any).id },
      data: { passwordHash }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}