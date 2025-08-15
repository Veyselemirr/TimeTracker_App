// src/app/api/time-entries/cleanup/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Tamamlanmamış timer'ları temizle
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      )
    }

    // Kullanıcının tamamlanmamış (endTime null olan) tüm timer'larını bul
    const incompleteSessions = await prisma.timeEntry.findMany({
      where: {
        userId: session.user.id,
        endTime: null
      }
    })

    if (incompleteSessions.length === 0) {
      return NextResponse.json({
        message: 'Temizlenecek aktif timer bulunamadı',
        cleaned: 0
      })
    }

    // Tamamlanmamış timer'ları sil veya tamamla
    const now = new Date()
    const cleanupPromises = incompleteSessions.map(async (entry) => {
      const startTime = new Date(entry.startTime)
      const duration = Math.floor((now.getTime() - startTime.getTime()) / 1000)
      
      // Eğer 1 dakikadan kısa ise sil
      if (duration < 60) {
        return prisma.timeEntry.delete({
          where: { id: entry.id }
        })
      } else {
        // 1 dakikadan uzunsa tamamlanmış olarak kaydet
        const points = Math.floor(duration / 60)
        return prisma.timeEntry.update({
          where: { id: entry.id },
          data: {
            endTime: now,
            duration,
            points,
            description: entry.description + ' (Otomatik tamamlandı)'
          }
        })
      }
    })

    await Promise.all(cleanupPromises)

    return NextResponse.json({
      message: `${incompleteSessions.length} aktif timer temizlendi`,
      cleaned: incompleteSessions.length
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json(
      { error: 'Temizleme sırasında hata oluştu' },
      { status: 500 }
    )
  }
}

// GET - Aktif timer var mı kontrol et
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
      }
    })

    return NextResponse.json({
      hasActiveTimer: !!activeTimer,
      activeTimer
    })
  } catch (error) {
    console.error('Check active timer error:', error)
    return NextResponse.json(
      { error: 'Kontrol sırasında hata oluştu' },
      { status: 500 }
    )
  }
}