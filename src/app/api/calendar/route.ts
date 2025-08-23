// src/app/api/calendar/route.ts
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
    const { searchParams } = new URL(request.url)
    
    // Query parametreleri
    const view = searchParams.get('view') || 'month' // month, week, day, year, trend
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Tarih aralığını hesapla
    const dateRange = calculateDateRange(view, date, startDate, endDate)

    // Tüm time entries'leri al
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        userId,
        startTime: {
          gte: dateRange.start,
          lte: dateRange.end
        },
        endTime: { not: null },
        duration: { gt: 0 }
      },
      include: {
        category: true
      },
      orderBy: { startTime: 'asc' }
    })

    // Hedefleri al
    const goals = await prisma.goal.findMany({
      where: { userId, isActive: true },
      include: { category: true }
    })

    // Achievement'ları al (rozet kazanılan günler için)
    const userAchievements = await prisma.userAchievement.findMany({
      where: { 
        userId,
        achievedAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      },
      include: { achievement: true }
    })

    // Günlük verileri hesapla
    const dailyData = calculateDailyData(
      timeEntries, 
      goals, 
      userAchievements, 
      dateRange
    )

    // View'a göre ek istatistikler
    const statistics = calculateStatistics(dailyData, view, timeEntries)

    // Streak hesapla
    const streakData = await calculateStreakData(userId, dateRange.end)

    return NextResponse.json({
      success: true,
      data: {
        view,
        dateRange,
        dailyData,
        statistics,
        streakData,
        totalDays: dailyData.length,
        activeDays: dailyData.filter(day => day.totalMinutes > 0).length
      }
    })

  } catch (error) {
    console.error('Calendar API error:', error)
    return NextResponse.json(
      { error: 'Takvim verileri yüklenemedi' },
      { status: 500 }
    )
  }
}

function calculateDateRange(view: string, date: string, startDate?: string | null, endDate?: string | null) {
  const baseDate = new Date(date)
  let start: Date, end: Date

  if (startDate && endDate) {
    start = new Date(startDate)
    end = new Date(endDate)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }

  switch (view) {
    case 'week':
      // Hafta başı (Pazartesi)
      start = new Date(baseDate)
      const day = start.getDay()
      const diff = start.getDate() - day + (day === 0 ? -6 : 1)
      start.setDate(diff)
      start.setHours(0, 0, 0, 0)
      
      end = new Date(start)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
      break

    case 'day':
      start = new Date(baseDate)
      start.setHours(0, 0, 0, 0)
      end = new Date(baseDate)
      end.setHours(23, 59, 59, 999)
      break

    case 'year':
      start = new Date(baseDate.getFullYear(), 0, 1)
      start.setHours(0, 0, 0, 0)
      end = new Date(baseDate.getFullYear(), 11, 31)
      end.setHours(23, 59, 59, 999)
      break

    case 'trend':
      // Son 90 gün
      start = new Date(baseDate)
      start.setDate(start.getDate() - 90)
      start.setHours(0, 0, 0, 0)
      end = new Date(baseDate)
      end.setHours(23, 59, 59, 999)
      break

    default: // month
      start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)
      start.setHours(0, 0, 0, 0)
      end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0)
      end.setHours(23, 59, 59, 999)
      break
  }

  return { start, end }
}

function calculateDailyData(timeEntries: any[], goals: any[], achievements: any[], dateRange: any) {
  const dailyMap = new Map()
  
  // Tarih aralığındaki her gün için boş entry oluştur
  const currentDate = new Date(dateRange.start)
  while (currentDate <= dateRange.end) {
    const dateKey = currentDate.toISOString().split('T')[0]
    dailyMap.set(dateKey, {
      date: dateKey,
      totalMinutes: 0,
      totalSessions: 0,
      categories: new Map(),
      sessions: [],
      achievements: [],
      goalProgress: [],
      intensity: 0,
      hasData: false
    })
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Time entries'leri günlere dağıt
  timeEntries.forEach(entry => {
    const dateKey = entry.startTime.toISOString().split('T')[0]
    const dayData = dailyMap.get(dateKey)
    
    if (dayData) {
      const minutes = Math.floor((entry.duration || 0) / 60)
      dayData.totalMinutes += minutes
      dayData.totalSessions += 1
      dayData.hasData = true
      
      // Kategori bazında toplama
      const categoryName = entry.category?.name || 'Bilinmeyen'
      const categoryData = dayData.categories.get(categoryName) || {
        name: categoryName,
        color: entry.category?.color || '#6B7280',
        minutes: 0,
        sessions: 0
      }
      categoryData.minutes += minutes
      categoryData.sessions += 1
      dayData.categories.set(categoryName, categoryData)
      
      // Seans detayı ekle
      dayData.sessions.push({
        id: entry.id,
        startTime: entry.startTime,
        endTime: entry.endTime,
        duration: entry.duration,
        description: entry.description,
        category: entry.category,
        points: entry.points
      })
    }
  })

  // Achievement'ları günlere ekle
  achievements.forEach(ua => {
    const dateKey = ua.achievedAt.toISOString().split('T')[0]
    const dayData = dailyMap.get(dateKey)
    
    if (dayData) {
      dayData.achievements.push({
        id: ua.achievement.id,
        name: ua.achievement.name,
        icon: ua.achievement.icon,
        points: ua.achievement.points
      })
    }
  })

  // Hedef progress'i hesapla
  Array.from(dailyMap.values()).forEach(dayData => {
    dayData.goalProgress = goals.map(goal => {
      const categoryMinutes = dayData.categories.get(goal.category.name)?.minutes || 0
      const percentage = goal.targetMinutes > 0 
        ? Math.min((categoryMinutes / goal.targetMinutes) * 100, 100) 
        : 0
      
      return {
        goalId: goal.id,
        categoryName: goal.category.name,
        categoryColor: goal.category.color,
        targetMinutes: goal.targetMinutes,
        currentMinutes: categoryMinutes,
        percentage: Math.round(percentage),
        isCompleted: percentage >= 100
      }
    })

    // Intensity hesapla (0-100 arası)
    dayData.intensity = Math.min((dayData.totalMinutes / 480) * 100, 100) // 8 saat = %100

    // Kategorileri array'e çevir
    dayData.categories = Array.from(dayData.categories.values())
  })

  return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date))
}

function calculateStatistics(dailyData: any[], view: string, timeEntries: any[]) {
  const activeDays = dailyData.filter(day => day.hasData)
  const totalMinutes = dailyData.reduce((sum, day) => sum + day.totalMinutes, 0)
  const totalSessions = dailyData.reduce((sum, day) => sum + day.totalSessions, 0)

  // Kategori istatistikleri
  const categoryStats = new Map()
  dailyData.forEach(day => {
    day.categories.forEach((cat: any) => {
      const existing = categoryStats.get(cat.name) || { name: cat.name, color: cat.color, minutes: 0, sessions: 0 }
      existing.minutes += cat.minutes
      existing.sessions += cat.sessions
      categoryStats.set(cat.name, existing)
    })
  })

  // En iyi günler
  const bestDays = [...dailyData]
    .filter(day => day.hasData)
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
    .slice(0, 5)

  // Haftalık pattern (günler bazında ortalama)
  const weeklyPattern = Array(7).fill(0).map((_, index) => {
    const dayOfWeekData = dailyData.filter(day => {
      const date = new Date(day.date)
      return date.getDay() === (index + 1) % 7 // Pazartesi = 0
    })
    
    const avgMinutes = dayOfWeekData.length > 0 
      ? dayOfWeekData.reduce((sum, day) => sum + day.totalMinutes, 0) / dayOfWeekData.length
      : 0

    return {
      dayName: ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'][index],
      avgMinutes: Math.round(avgMinutes),
      dayCount: dayOfWeekData.length
    }
  })

  return {
    totalMinutes,
    totalHours: Math.floor(totalMinutes / 60),
    totalSessions,
    activeDays: activeDays.length,
    totalDays: dailyData.length,
    avgDailyMinutes: activeDays.length > 0 ? Math.round(totalMinutes / activeDays.length) : 0,
    avgSessionLength: totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0,
    categoryStats: Array.from(categoryStats.values()).sort((a, b) => b.minutes - a.minutes),
    bestDays,
    weeklyPattern,
    completionRate: Math.round((activeDays.length / dailyData.length) * 100)
  }
}

async function calculateStreakData(userId: string, endDate: Date) {
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0
  
  // Son 365 günü kontrol et
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(endDate)
    checkDate.setDate(checkDate.getDate() - i)
    
    const dayStart = new Date(checkDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(checkDate)
    dayEnd.setHours(23, 59, 59, 999)

    const hasActivity = await prisma.timeEntry.findFirst({
      where: {
        userId,
        startTime: { gte: dayStart, lte: dayEnd },
        endTime: { not: null },
        duration: { gt: 0 }
      }
    })

    if (hasActivity) {
      tempStreak++
      if (i === 0) currentStreak = tempStreak // Bugünden başlayan streak
      longestStreak = Math.max(longestStreak, tempStreak)
    } else {
      if (i === 0) currentStreak = 0 // Bugün aktivite yok
      tempStreak = 0
    }
  }

  return {
    currentStreak,
    longestStreak,
    isStreakActive: currentStreak > 0
  }
}