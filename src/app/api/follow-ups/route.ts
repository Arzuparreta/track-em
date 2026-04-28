import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createFollowUpSchema = z.object({
  contactId: z.string().cuid(),
  callId: z.string().cuid().optional(),
  scheduledAt: z.string().datetime(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contactId')
    const completed = searchParams.get('completed')

    let where = {}
    if (contactId) {
      where = { ...where, contactId }
    }
    if (completed !== null) {
      where = { ...where, completed: completed === 'true' }
    }

    const followUps = await prisma.followUp.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: {
        contact: true,
        call: true,
      },
    })

    return NextResponse.json({ data: followUps })
  } catch (error) {
    console.error('Error fetching follow-ups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch follow-ups' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createFollowUpSchema.parse(body)

    const followUp = await prisma.followUp.create({
      data: {
        ...validatedData,
        scheduledAt: new Date(validatedData.scheduledAt),
      },
      include: {
        contact: true,
        call: true,
      },
    })

    return NextResponse.json({ data: followUp }, { status: 201 })
  } catch (error) {
    console.error('Error creating follow-up:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create follow-up' },
      { status: 500 }
    )
  }
}
