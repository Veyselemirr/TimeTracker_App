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

// ============================================

// src/app/api/time-entries/force-cleanup/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Tüm aktif timer'ları zorla temizle
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      )
    }

    // Kullanıcının TÜM tamamlanmamış timer'larını sil
    const deleted = await prisma.timeEntry.deleteMany({
      where: {
        userId: session.user.id,
        endTime: null
      }
    })

    console.log(`🧹 ${deleted.count} aktif timer temizlendi`)

    return NextResponse.json({
      success: true,
      message: `${deleted.count} aktif timer temizlendi`,
      deletedCount: deleted.count
    })
  } catch (error) {
    console.error('Force cleanup error:', error)
    return NextResponse.json(
      { error: 'Temizleme başarısız' },
      { status: 500 }
    )
  }
}