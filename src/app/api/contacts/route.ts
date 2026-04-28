import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const createContactSchema = z.object({
  name: z.string().min(1),
  emails: z.array(z.string().email()).optional(),
  phones: z.array(z.string()).optional(),
  role: z.string().optional(),
  artistContext: z.string().optional(),
  notes: z.string().optional(),
})


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    let where = {}
    if (search) {
      where = {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { emails: { hasSome: [search] } },
          { phones: { hasSome: [search] } },
          { notes: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    }

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        calls: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            calls: true,
            followUps: true,
          },
        },
      },
    })

    return NextResponse.json({ data: contacts })
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createContactSchema.parse(body)

    const contact = await prisma.contact.create({
      data: {
        ...validatedData,
        emails: validatedData.emails || [],
        phones: validatedData.phones || [],
      },
    })

    return NextResponse.json({ data: contact }, { status: 201 })
  } catch (error) {
    console.error('Error creating contact:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    )
  }
}