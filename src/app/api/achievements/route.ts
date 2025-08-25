import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ACHIEVEMENTS, AchievementChecker } from '@/lib/achievements'

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

    // Kullanıcının mevcut başarımlarını al
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true }
    })

    // Tüm achievement'ları achievement tablosuna kaydet (yoksa) - Batch işlem
    const existingAchievements = await prisma.achievement.findMany({
      select: { id: true }
    })
    
    const existingIds = existingAchievements.map(a => a.id)
    const achievementsToCreate = ACHIEVEMENTS.filter(a => !existingIds.includes(a.id))
    
    if (achievementsToCreate.length > 0) {
      await prisma.achievement.createMany({
        data: achievementsToCreate.map(achievement => ({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          points: achievement.points,
          condition: JSON.stringify(achievement.condition)
        })),
        skipDuplicates: true
      })
    }

    // Kullanıcının istatistiklerini hesapla
    const userStats = await calculateUserStats(userId)
    
    // Yeni kazanılacak achievement'ları kontrol et
    const newAchievements = await checkNewAchievements(userId, userStats, userAchievements)

    // Yeni achievement'ları kaydet
    for (const achievement of newAchievements) {
      await prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id
        }
      })
    }

    // Güncellenmiş kullanıcı achievement'larını al
    const updatedUserAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true }
    })

    // Achievement'ları kategorilere göre grupla
    const groupedAchievements = groupAchievementsByCategory(updatedUserAchievements)

    return NextResponse.json({
      success: true,
      data: {
        userStats,
        achievements: groupedAchievements,
        newAchievements: newAchievements.length > 0 ? newAchievements : null,
        totalPoints: updatedUserAchievements.reduce((sum, ua) => sum + ua.achievement.points, 0),
        totalBadges: updatedUserAchievements.length
      }
    })

  } catch (error) {
    console.error('Achievements API error:', error)
    return NextResponse.json(
      { error: 'Achievement verileri yüklenemedi' },
      { status: 500 }
    )
  }
}

async function calculateUserStats(userId: string) {
  const now = new Date()
  
  // Bugün
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  
  // Bu ay
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  
  // Tüm çalışmalar
  const allEntries = await prisma.timeEntry.findMany({
    where: {
      userId,
      endTime: { not: null },
      duration: { gt: 0 }
    },
    include: { category: true },
    orderBy: { startTime: 'asc' }
  })

  // Bugünkü çalışmalar
  const todayEntries = allEntries.filter(entry => 
    entry.startTime >= todayStart
  )

  // Bu ayki çalışmalar  
  const monthEntries = allEntries.filter(entry =>
    entry.startTime >= monthStart
  )

  // Toplam istatistikler
  const totalHours = allEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0) / 3600
  const totalSessions = allEntries.length

  // Günlük dakikalar (bugün)
  const dailyMinutes = todayEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0) / 60

  // Streak hesaplama
  const streak = await calculateStreak(userId)

  // Kategori bazında saatler
  const categoryHours = new Map()
  allEntries.forEach(entry => {
    const categoryName = entry.category?.name || 'Bilinmeyen'
    const hours = (entry.duration || 0) / 3600
    categoryHours.set(categoryName, (categoryHours.get(categoryName) || 0) + hours)
  })

  // Eşsiz kategori sayısı
  const uniqueCategories = categoryHours.size

  // Maximum kategori saati
  const maxCategoryHours = Math.max(...Array.from(categoryHours.values()), 0)

  // Hedef tamamlama sayısı (basit hesaplama)
  const goalsCompleted = await prisma.goal.count({
    where: { userId, isActive: true }
  })

  return {
    totalHours: Math.floor(totalHours),
    totalSessions,
    dailyMinutes: Math.floor(dailyMinutes),
    currentStreak: streak,
    uniqueCategories,
    maxCategoryHours: Math.floor(maxCategoryHours),
    goalsCompleted,
    monthlyGoalsCompleted: goalsCompleted // Basit hesaplama
  }
}

async function calculateStreak(userId: string) {
  const streakDays = []
  const today = new Date()
  
  for (let i = 0; i < 365; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    const dayEntry = await prisma.timeEntry.findFirst({
      where: {
        userId,
        startTime: { gte: dayStart, lte: dayEnd },
        endTime: { not: null },
        duration: { gt: 0 }
      }
    })

    if (dayEntry) {
      streakDays.push(date)
    } else {
      break
    }
  }

  return streakDays.length
}

async function checkNewAchievements(userId: string, userStats: any, existingAchievements: any[]) {
  const existingIds = existingAchievements.map(ua => ua.achievement.id)
  const newAchievements = []

  // Streak kontrolleri
  const streakAchievements = AchievementChecker.checkStreak(userStats.currentStreak)
  for (const achievement of streakAchievements) {
    if (!existingIds.includes(achievement.id)) {
      newAchievements.push(achievement)
    }
  }

  // Günlük süre kontrolleri
  const timeAchievements = AchievementChecker.checkDailyTime(userStats.dailyMinutes)
  for (const achievement of timeAchievements) {
    if (!existingIds.includes(achievement.id)) {
      newAchievements.push(achievement)
    }
  }

  // Hedef kontrolleri
  const goalAchievements = AchievementChecker.checkGoalsCompleted(userStats.goalsCompleted)
  for (const achievement of goalAchievements) {
    if (!existingIds.includes(achievement.id)) {
      newAchievements.push(achievement)
    }
  }

  // Toplam saat kontrolleri
  const totalAchievements = AchievementChecker.checkTotalHours(userStats.totalHours)
  for (const achievement of totalAchievements) {
    if (!existingIds.includes(achievement.id)) {
      newAchievements.push(achievement)
    }
  }

  // Kategori kontrolleri
  const categoryAchievements = AchievementChecker.checkCategoryHours(userStats.maxCategoryHours)
  for (const achievement of categoryAchievements) {
    if (!existingIds.includes(achievement.id)) {
      newAchievements.push(achievement)
    }
  }

  const uniqueCatAchievements = AchievementChecker.checkUniqueCategories(userStats.uniqueCategories)
  for (const achievement of uniqueCatAchievements) {
    if (!existingIds.includes(achievement.id)) {
      newAchievements.push(achievement)
    }
  }

  return newAchievements
}

function groupAchievementsByCategory(userAchievements: any[]) {
  const grouped: { [key: string]: any[] } = {
    streak: [],
    time: [],
    goal: [],
    performance: [],
    total: [],
    category: []
  }

  // Önce tüm achievement'ları al ve kategori belirle
  ACHIEVEMENTS.forEach(achievement => {
    const userAchievement = userAchievements.find(ua => ua.achievement.id === achievement.id)
    
    const achievementData = {
      ...achievement,
      isUnlocked: !!userAchievement,
      unlockedAt: userAchievement?.achievedAt || null
    }

    grouped[achievement.category].push(achievementData)
  })

  return grouped
}