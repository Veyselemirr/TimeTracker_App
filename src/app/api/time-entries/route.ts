// src/app/api/time-entries/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { TimerService } from '@/services/timer.service'

// POST - Timer başlat
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Giriş yapmanız gerekiyor' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { categoryId, description, forceClose } = body

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Kategori seçimi zorunludur' },
        { status: 400 }
      )
    }

    try {
      const timer = await TimerService.startTimer(
        session.user.id,
        categoryId,
        description,
        forceClose || false
      )

      return NextResponse.json({
        success: true,
        timer,
        message: 'Timer başarıyla başlatıldı'
      })
    } catch (error: any) {
      // Aktif timer varsa özel response
      if (error.message.includes('Aktif bir timer var')) {
        return NextResponse.json(
          { 
            error: error.message,
            requiresConfirmation: true // Frontend'e onay gerektiğini bildir
          },
          { status: 409 } // Conflict
        )
      }

      throw error
    }
  } catch (error: any) {
    console.error('Timer start error:', error)
    return NextResponse.json(
      { error: error.message || 'Timer başlatılamadı' },
      { status: 400 }
    )
  }
}

// PUT - Timer durdur
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Giriş yapmanız gerekiyor' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { timerId } = body

    const timer = await TimerService.stopTimer(
      session.user.id,
      timerId
    )

    const durationMinutes = Math.floor((timer.duration || 0) / 60)

    return NextResponse.json({
      success: true,
      timer,
      message: `${durationMinutes} dakika çalıştınız, ${timer.points} puan kazandınız!`
    })
  } catch (error: any) {
    console.error('Timer stop error:', error)
    return NextResponse.json(
      { error: error.message || 'Timer durdurulamadı' },
      { status: 400 }
    )
  }
}

// GET - Timer geçmişi ve istatistikler
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Giriş yapmanız gerekiyor' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // Belirtilen günün timer'ları
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const timers = await prisma.timeEntry.findMany({
      where: {
        userId: session.user.id,
        startTime: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        category: true
      },
      orderBy: {
        startTime: 'desc'
      }
    })

    // Aktif timer
    const activeTimer = await TimerService.checkActiveTimer(session.user.id)

    return NextResponse.json({
      timers,
      activeTimer,
      stats: {
        totalDuration: timers.reduce((sum, t) => sum + (t.duration || 0), 0),
        totalPoints: timers.reduce((sum, t) => sum + (t.points || 0), 0),
        sessionCount: timers.length
      }
    })
  } catch (error: any) {
    console.error('Timer fetch error:', error)
    return NextResponse.json(
      { error: 'Timer verileri alınamadı' },
      { status: 500 }
    )
  }
}

// DELETE - Timer iptal/sil
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Giriş yapmanız gerekiyor' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const timerId = searchParams.get('id')
    const forceCloseAll = searchParams.get('forceCloseAll') === 'true'

    if (forceCloseAll) {
      // Tüm aktif timer'ları kapat
      const closed = await TimerService.forceCloseAllTimers(session.user.id)
      return NextResponse.json({
        success: true,
        message: `${closed.length} timer kapatıldı`,
        closedTimers: closed
      })
    }

    if (!timerId) {
      return NextResponse.json(
        { error: 'Timer ID gerekli' },
        { status: 400 }
      )
    }

    // Belirli bir timer'ı sil (sadece aktif olanlar)
    await prisma.timeEntry.delete({
      where: {
        id: timerId,
        userId: session.user.id,
        endTime: null // Sadece aktif timer'lar silinebilir
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Timer iptal edildi'
    })
  } catch (error: any) {
    console.error('Timer delete error:', error)
    return NextResponse.json(
      { error: 'Timer silinemedi' },
      { status: 400 }
    )
  }
}

// ============================================
// IMPORT: prisma'yı import etmeyi unutmayın
import { prisma } from '@/lib/prisma'