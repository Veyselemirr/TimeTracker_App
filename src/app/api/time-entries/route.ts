import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Zaman kayıtlarını getir
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'temp-user'
    const date = searchParams.get('date') // YYYY-MM-DD formatında

    let whereClause: any = { userId }

    // Belirli bir tarihi filtrele
    if (date) {
      const startOfDay = new Date(date)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      whereClause.startTime = {
        gte: startOfDay,
        lte: endOfDay
      }
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where: whereClause,
      include: {
        category: true
      },
      orderBy: {
        startTime: 'desc'
      }
    })

    return NextResponse.json({ timeEntries })
  } catch (error) {
    console.error('Time entries fetch error:', error)
    return NextResponse.json(
      { error: 'Zaman kayıtları yüklenirken hata oluştu' },
      { status: 500 }
    )
  }
}

// POST - Yeni zaman kaydı oluştur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      startTime, 
      endTime, 
      duration, 
      categoryId, 
      description,
      userId = 'temp-user' 
    } = body

    // Puan hesapla (her dakika için 1 puan)
    const points = Math.floor((duration || 0) / 60)

    const timeEntry = await prisma.timeEntry.create({
      data: {
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        duration,
        description,
        points,
        userId,
        categoryId
      },
      include: {
        category: true
      }
    })

    return NextResponse.json({ timeEntry }, { status: 201 })
  } catch (error) {
    console.error('Time entry creation error:', error)
    return NextResponse.json(
      { error: 'Zaman kaydı oluşturulurken hata oluştu' },
      { status: 500 }
    )
  }
}

// PUT - Zaman kaydını güncelle (timer bitirme için)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, endTime, duration } = body

    const points = Math.floor((duration || 0) / 60)

    const timeEntry = await prisma.timeEntry.update({
      where: { id },
      data: {
        endTime: new Date(endTime),
        duration,
        points
      },
      include: {
        category: true
      }
    })

    return NextResponse.json({ timeEntry })
  } catch (error) {
    console.error('Time entry update error:', error)
    return NextResponse.json(
      { error: 'Zaman kaydı güncellenirken hata oluştu' },
      { status: 500 }
    )
  }
}