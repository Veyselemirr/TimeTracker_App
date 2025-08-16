// src/app/api/time-entries/active/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Aktif timer'ı getir
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      )
    }

    const activeTimer = await prisma.timeEntry.findFirst({
      where: {
        userId: session.user.id,
        endTime: null
      },
      include: {
        category: true
      },
      orderBy: {
        startTime: 'desc'
      }
    })

    return NextResponse.json({
      activeTimer: activeTimer || null
    })
  } catch (error) {
    console.error('Get active timer error:', error)
    return NextResponse.json(
      { error: 'Aktif timer alınamadı' },
      { status: 500 }
    )
  }
}


