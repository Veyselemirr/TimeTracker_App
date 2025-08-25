import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Giriş yapmanız gerekiyor' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Tüm aktif hedefleri al
    const goals = await prisma.goal.findMany({
      where: { 
        userId, 
        isActive: true 
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Kategorileri al (hedef oluştururken kullanmak için)
    const categories = await prisma.category.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        color: true
      },
      orderBy: { name: 'asc' }
    })

    // Bugünkü ilerlemeyi hesapla
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    // Bugünkü time entries'leri al
    const todayEntries = await prisma.timeEntry.findMany({
      where: {
        userId,
        startTime: { gte: today, lte: todayEnd },
        endTime: { not: null },
        duration: { gt: 0 }
      },
      include: { category: true }
    })

    // Her hedef için güncel progress'i hesapla
    const goalsWithProgress = goals.map(goal => {
      // Bu kategorideki bugünkü çalışmalar
      const todayCategoryEntries = todayEntries.filter(
        entry => entry.categoryId === goal.categoryId
      )
      
      const todayMinutes = todayCategoryEntries.reduce(
        (sum, entry) => sum + Math.floor((entry.duration || 0) / 60), 0
      )
      
      const percentage = goal.targetMinutes > 0 
        ? Math.min((todayMinutes / goal.targetMinutes) * 100, 100)
        : 0

      return {
        ...goal,
        currentMinutes: todayMinutes,
        percentage: Math.round(percentage),
        isCompleted: percentage >= 100,
        remainingMinutes: Math.max(goal.targetMinutes - todayMinutes, 0)
      }
    })

    // Genel istatistikler
    const totalTargetMinutes = goals.reduce((sum, goal) => sum + goal.targetMinutes, 0)
    const totalCurrentMinutes = goalsWithProgress.reduce((sum, goal) => sum + goal.currentMinutes, 0)
    const completedGoals = goalsWithProgress.filter(goal => goal.isCompleted).length
    const overallProgress = totalTargetMinutes > 0 ? (totalCurrentMinutes / totalTargetMinutes) * 100 : 0

    return NextResponse.json({
      goals: goalsWithProgress,  // Direkt goals array döndür
      categories,
      stats: {
        totalGoals: goals.length,
        completedGoals,
        totalTargetMinutes,
        totalCurrentMinutes,
        overallProgress: Math.round(overallProgress)
      }
    })

  } catch (error) {
    console.error('Goals API error:', error)
    return NextResponse.json(
      { error: 'Hedefler yüklenemedi' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Giriş yapmanız gerekiyor' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const body = await request.json()
    const { categoryId, targetMinutes, period = 'daily' } = body

    // Validation
    if (!categoryId || !targetMinutes || targetMinutes <= 0) {
      return NextResponse.json(
        { error: 'Geçerli kategori ve hedef süre giriniz' },
        { status: 400 }
      )
    }

    // Kategori kontrolü
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Kategori bulunamadı' },
        { status: 404 }
      )
    }

    // Aynı kategori için hedef var mı kontrol et
    const existingGoal = await prisma.goal.findFirst({
      where: { 
        userId, 
        categoryId, 
        period,
        isActive: true 
      }
    })

    if (existingGoal) {
      return NextResponse.json(
        { error: 'Bu kategori için zaten aktif bir hedef var' },
        { status: 400 }
      )
    }

    // Yeni hedef oluştur
    const newGoal = await prisma.goal.create({
      data: {
        userId,
        categoryId,
        targetMinutes,
        period
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: newGoal
    })

  } catch (error) {
    console.error('Goal creation error:', error)
    return NextResponse.json(
      { error: 'Hedef oluşturulamadı' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Giriş yapmanız gerekiyor' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const body = await request.json()
    const { goalId, targetMinutes, isActive } = body

    // Hedef kontrolü
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId }
    })

    if (!goal) {
      return NextResponse.json(
        { error: 'Hedef bulunamadı' },
        { status: 404 }
      )
    }

    // Güncelle
    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        ...(targetMinutes && { targetMinutes }),
        ...(typeof isActive === 'boolean' && { isActive })
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true,
            icon: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedGoal
    })

  } catch (error) {
    console.error('Goal update error:', error)
    return NextResponse.json(
      { error: 'Hedef güncellenemedi' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Giriş yapmanız gerekiyor' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const goalId = searchParams.get('id')

    if (!goalId) {
      return NextResponse.json(
        { error: 'Hedef ID gerekli' },
        { status: 400 }
      )
    }

    // Hedef kontrolü
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId }
    })

    if (!goal) {
      return NextResponse.json(
        { error: 'Hedef bulunamadı' },
        { status: 404 }
      )
    }

    // Soft delete (isActive = false)
    await prisma.goal.update({
      where: { id: goalId },
      data: { isActive: false }
    })

    return NextResponse.json({
      success: true,
      message: 'Hedef başarıyla silindi'
    })

  } catch (error) {
    console.error('Goal deletion error:', error)
    return NextResponse.json(
      { error: 'Hedef silinemedi' },
      { status: 500 }
    )
  }
}