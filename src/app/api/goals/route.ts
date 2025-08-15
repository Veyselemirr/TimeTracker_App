// src/app/api/goals/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Kullanıcının hedeflerini getir
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Giriş yapmanız gerekiyor' },
        { status: 401 }
      )
    }

    // Kullanıcının tüm hedeflerini kategorilerle birlikte getir
    const goals = await prisma.goal.findMany({
      where: {
        userId: session.user.id,
        isActive: true
      },
      include: {
        category: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Bugünkü ilerlemeyi hesapla
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Bugünkü time entries
    const todayEntries = await prisma.timeEntry.findMany({
      where: {
        userId: session.user.id,
        startTime: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    // Kategori bazında bugünkü süreleri hesapla
    const progressMap = new Map<string, number>()
    todayEntries.forEach(entry => {
      const current = progressMap.get(entry.categoryId) || 0
      progressMap.set(entry.categoryId, current + (entry.duration || 0))
    })

    // Hedeflere ilerleme bilgisini ekle
    const goalsWithProgress = goals.map(goal => ({
      ...goal,
      currentMinutes: Math.floor((progressMap.get(goal.categoryId) || 0) / 60),
      percentage: Math.min(
        Math.round(((progressMap.get(goal.categoryId) || 0) / 60 / goal.targetMinutes) * 100),
        100
      )
    }))

    return NextResponse.json({
      goals: goalsWithProgress,
      summary: {
        totalGoals: goals.length,
        completedToday: goalsWithProgress.filter(g => g.percentage >= 100).length
      }
    })
  } catch (error) {
    console.error('Goals fetch error:', error)
    return NextResponse.json(
      { error: 'Hedefler yüklenemedi' },
      { status: 500 }
    )
  }
}

// POST - Yeni hedef oluştur veya güncelle
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
    const { categoryId, targetMinutes, period = 'daily' } = body

    // Validasyon
    if (!categoryId || !targetMinutes) {
      return NextResponse.json(
        { error: 'Kategori ve hedef süre gerekli' },
        { status: 400 }
      )
    }

    if (targetMinutes < 1 || targetMinutes > 1440) { // Max 24 saat
      return NextResponse.json(
        { error: 'Hedef süre 1-1440 dakika arasında olmalı' },
        { status: 400 }
      )
    }

    // Kategori kontrolü
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId: session.user.id
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Geçersiz kategori' },
        { status: 400 }
      )
    }

    // Upsert - varsa güncelle, yoksa oluştur
    const goal = await prisma.goal.upsert({
      where: {
        userId_categoryId_period: {
          userId: session.user.id,
          categoryId,
          period
        }
      },
      update: {
        targetMinutes,
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        userId: session.user.id,
        categoryId,
        targetMinutes,
        period,
        isActive: true
      },
      include: {
        category: true
      }
    })

    return NextResponse.json({
      success: true,
      goal,
      message: `${category.name} için ${targetMinutes} dakikalık hedef belirlendi`
    })
  } catch (error) {
    console.error('Goal create error:', error)
    return NextResponse.json(
      { error: 'Hedef oluşturulamadı' },
      { status: 500 }
    )
  }
}

// PUT - Hedefi güncelle
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
    const { goalId, targetMinutes, isActive } = body

    if (!goalId) {
      return NextResponse.json(
        { error: 'Hedef ID gerekli' },
        { status: 400 }
      )
    }

    // Hedefin sahibi mi kontrol et
    const existingGoal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        userId: session.user.id
      }
    })

    if (!existingGoal) {
      return NextResponse.json(
        { error: 'Hedef bulunamadı' },
        { status: 404 }
      )
    }

    // Güncelle
    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        targetMinutes: targetMinutes || existingGoal.targetMinutes,
        isActive: isActive !== undefined ? isActive : existingGoal.isActive,
        updatedAt: new Date()
      },
      include: {
        category: true
      }
    })

    return NextResponse.json({
      success: true,
      goal: updatedGoal,
      message: 'Hedef güncellendi'
    })
  } catch (error) {
    console.error('Goal update error:', error)
    return NextResponse.json(
      { error: 'Hedef güncellenemedi' },
      { status: 500 }
    )
  }
}

// DELETE - Hedefi sil
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
    const goalId = searchParams.get('id')

    if (!goalId) {
      return NextResponse.json(
        { error: 'Hedef ID gerekli' },
        { status: 400 }
      )
    }

    // Hedefin sahibi mi kontrol et
    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        userId: session.user.id
      }
    })

    if (!goal) {
      return NextResponse.json(
        { error: 'Hedef bulunamadı' },
        { status: 404 }
      )
    }

    // Soft delete - isActive'i false yap
    await prisma.goal.update({
      where: { id: goalId },
      data: { isActive: false }
    })

    return NextResponse.json({
      success: true,
      message: 'Hedef kaldırıldı'
    })
  } catch (error) {
    console.error('Goal delete error:', error)
    return NextResponse.json(
      { error: 'Hedef silinemedi' },
      { status: 500 }
    )
  }
}