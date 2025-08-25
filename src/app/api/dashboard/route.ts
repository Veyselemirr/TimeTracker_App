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

    const now = new Date()
    
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999)

    const weekStart = new Date(now)
    const day = weekStart.getDay()
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
    weekStart.setDate(diff)
    weekStart.setHours(0, 0, 0, 0)
    
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const [
      todayEntries,
      weekEntries,
      monthEntries,
      allTimeEntries,
      categories,
      goals,
      userAchievements
    ] = await Promise.all([
      prisma.timeEntry.findMany({
        where: {
          userId,
          startTime: { gte: todayStart, lte: todayEnd },
          endTime: { not: null },
          duration: { gt: 0 }
        },
        include: { category: true }
      }),

      prisma.timeEntry.findMany({
        where: {
          userId,
          startTime: { gte: weekStart, lte: weekEnd },
          endTime: { not: null },
          duration: { gt: 0 }
        },
        include: { category: true }
      }),

      prisma.timeEntry.findMany({
        where: {
          userId,
          startTime: { gte: monthStart, lte: monthEnd },
          endTime: { not: null },
          duration: { gt: 0 }
        },
        include: { category: true }
      }),

      prisma.timeEntry.findMany({
        where: {
          userId,
          endTime: { not: null },
          duration: { gt: 0 }
        },
        include: { category: true }
      }),

      prisma.category.findMany({
        where: { userId }
      }),

      prisma.goal.findMany({
        where: { userId, isActive: true },
        include: { category: true }
      }),

      prisma.userAchievement.count({
        where: { userId }
      })
    ])

    const calculateDuration = (entries: any[]) => {
      return entries.reduce((total, entry) => total + (entry.duration || 0), 0)
    }

    const calculateCategoryStats = (entries: any[]) => {
      const stats = new Map()
      
      entries.forEach(entry => {
        const categoryName = entry.category?.name || 'Bilinmeyen'
        const categoryColor = entry.category?.color || '#6B7280'
        const current = stats.get(categoryName) || { 
          name: categoryName, 
          color: categoryColor, 
          duration: 0, 
          count: 0 
        }
        
        current.duration += entry.duration || 0
        current.count += 1
        stats.set(categoryName, current)
      })
      
      return Array.from(stats.values()).sort((a, b) => b.duration - a.duration)
    }

    const goalProgress = goals.map(goal => {
      const todayCategoryEntries = todayEntries.filter(entry => entry.categoryId === goal.categoryId)
      const todayMinutes = Math.floor(calculateDuration(todayCategoryEntries) / 60)
      const percentage = Math.min((todayMinutes / goal.targetMinutes) * 100, 100)
      
      return {
        id: goal.id,
        categoryName: goal.category.name,
        categoryColor: goal.category.color,
        targetMinutes: goal.targetMinutes,
        currentMinutes: todayMinutes,
        percentage: Math.round(percentage),
        isCompleted: percentage >= 100
      }
    })

    const calculateStreak = async () => {
      const last30Days = []
      for (let i = 0; i < 30; i++) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)
        last30Days.push(date)
      }

      let streak = 0
      for (const date of last30Days) {
        const dayStart = new Date(date)
        const dayEnd = new Date(date)
        dayEnd.setHours(23, 59, 59, 999)

        const dayEntries = await prisma.timeEntry.findFirst({
          where: {
            userId,
            startTime: { gte: dayStart, lte: dayEnd },
            endTime: { not: null },
            duration: { gt: 0 }
          }
        })

        if (dayEntries) {
          streak++
        } else {
          break
        }
      }

      return streak
    }

    const currentStreak = await calculateStreak()

    const totalStats = {
      totalMinutes: Math.floor(calculateDuration(allTimeEntries) / 60),
      totalHours: Math.floor(calculateDuration(allTimeEntries) / 3600),
      totalSessions: allTimeEntries.length,
      totalPoints: allTimeEntries.reduce((sum, entry) => sum + (entry.points || 0), 0),
      totalBadges: userAchievements,
      currentStreak
    }

    const timeStats = {
      today: {
        seconds: calculateDuration(todayEntries),
        minutes: Math.floor(calculateDuration(todayEntries) / 60),
        hours: Math.floor(calculateDuration(todayEntries) / 3600),
        sessions: todayEntries.length
      },
      week: {
        seconds: calculateDuration(weekEntries),
        minutes: Math.floor(calculateDuration(weekEntries) / 60),
        hours: Math.floor(calculateDuration(weekEntries) / 3600),
        sessions: weekEntries.length
      },
      month: {
        seconds: calculateDuration(monthEntries),
        minutes: Math.floor(calculateDuration(monthEntries) / 60),
        hours: Math.floor(calculateDuration(monthEntries) / 3600),
        sessions: monthEntries.length
      }
    }

    const categoryStats = {
      today: calculateCategoryStats(todayEntries),
      week: calculateCategoryStats(weekEntries),
      month: calculateCategoryStats(monthEntries),
      allTime: calculateCategoryStats(allTimeEntries)
    }

    return NextResponse.json({
      success: true,
      data: {
        timeStats,
        categoryStats,
        goalProgress,
        totalStats,
        dates: {
          todayStart,
          weekStart,
          monthStart
        }
      }
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Dashboard verileri yüklenemedi' },
      { status: 500 }
    )
  }
}