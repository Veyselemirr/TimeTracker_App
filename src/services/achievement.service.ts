// src/services/achievement.service.ts
import { prisma } from '@/lib/prisma'

export class AchievementService {
  /**
   * Kullanıcının başarımlarını kontrol et ve gerekirse yeni başarım ekle
   */
  static async checkAndAwardAchievements(userId: string, sessionData?: {
    duration?: number,
    categoryId?: string
  }) {
    const achievements: string[] = []

    try {
      // 1. İlk timer başarımı kontrolü
      const firstTimerAchievement = await this.checkFirstTimer(userId)
      if (firstTimerAchievement) achievements.push(firstTimerAchievement)

      // 2. Günlük hedef başarımları
      if (sessionData?.duration) {
        const dailyAchievements = await this.checkDailyGoals(userId)
        achievements.push(...dailyAchievements)
      }

      // 3. Kategori bazlı başarımlar
      if (sessionData?.categoryId) {
        const categoryAchievements = await this.checkCategoryMilestones(
          userId, 
          sessionData.categoryId
        )
        achievements.push(...categoryAchievements)
      }

      // 4. Streak (ardışık gün) başarımları
      const streakAchievements = await this.checkStreakAchievements(userId)
      achievements.push(...streakAchievements)

      return achievements
    } catch (error) {
      console.error('Achievement check error:', error)
      return []
    }
  }

  /**
   * İlk timer başarımı kontrolü
   */
  private static async checkFirstTimer(userId: string): Promise<string | null> {
    const entryCount = await prisma.timeEntry.count({
      where: { userId }
    })

    if (entryCount === 1) {
      const awarded = await this.awardAchievement(userId, 'İlk Adım')
      return awarded ? 'İlk Adım' : null
    }

    return null
  }

  /**
   * Günlük hedef başarımları kontrolü
   */
  private static async checkDailyGoals(userId: string): Promise<string[]> {
    const achievements: string[] = []
    
    // Bugünkü toplam süreyi hesapla
    const todayStats = await this.getTodayStats(userId)
    
    // Başarım eşikleri (saniye cinsinden)
    const milestones = [
      { hours: 2, name: 'Günlük Başlangıç', seconds: 7200 },
      { hours: 4, name: 'Yarı Gün Çalışkan', seconds: 14400 },
      { hours: 6, name: 'Üretken Gün', seconds: 21600 },
      { hours: 8, name: 'Günlük Kahraman', seconds: 28800 },
      { hours: 10, name: 'Çalışma Makinesi', seconds: 36000 }
    ]

    for (const milestone of milestones) {
      if (todayStats.totalDuration >= milestone.seconds) {
        const awarded = await this.awardAchievement(userId, milestone.name)
        if (awarded) achievements.push(milestone.name)
      }
    }

    return achievements
  }

  /**
   * Kategori bazlı milestone kontrolü
   */
  private static async checkCategoryMilestones(
    userId: string, 
    categoryId: string
  ): Promise<string[]> {
    const achievements: string[] = []
    
    // Kategorideki toplam süre
    const categoryStats = await prisma.timeEntry.aggregate({
      where: { userId, categoryId },
      _sum: { duration: true },
      _count: true
    })

    const totalHours = Math.floor((categoryStats._sum.duration || 0) / 3600)
    const sessionCount = categoryStats._count

    // Kategori ismi
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { name: true }
    })

    if (!category) return achievements

    // Kategori bazlı başarımlar
    const categoryMilestones = [
      { hours: 10, suffix: 'Acemi' },
      { hours: 50, suffix: 'Deneyimli' },
      { hours: 100, suffix: 'Uzman' },
      { hours: 500, suffix: 'Usta' },
      { hours: 1000, suffix: 'Efsane' }
    ]

    for (const milestone of categoryMilestones) {
      if (totalHours >= milestone.hours) {
        const achievementName = `${category.name} ${milestone.suffix}`
        const awarded = await this.awardAchievement(userId, achievementName, {
          dynamicAchievement: true,
          category: category.name,
          milestone: milestone.suffix
        })
        if (awarded) achievements.push(achievementName)
      }
    }

    // Seans sayısı başarımları
    if (sessionCount === 100) {
      const awarded = await this.awardAchievement(
        userId, 
        `${category.name} - 100 Seans`
      )
      if (awarded) achievements.push(`${category.name} - 100 Seans`)
    }

    return achievements
  }

  /**
   * Ardışık gün (streak) başarımları
   */
  private static async checkStreakAchievements(userId: string): Promise<string[]> {
    const achievements: string[] = []
    
    const streak = await this.calculateStreak(userId)
    
    const streakMilestones = [
      { days: 3, name: '3 Gün Serisi' },
      { days: 7, name: 'Haftalık Seri' },
      { days: 14, name: '2 Hafta Aralıksız' },
      { days: 30, name: 'Aylık Maraton' },
      { days: 100, name: '100 Gün Efsanesi' },
      { days: 365, name: 'Yıllık Şampiyon' }
    ]

    for (const milestone of streakMilestones) {
      if (streak >= milestone.days) {
        const awarded = await this.awardAchievement(userId, milestone.name)
        if (awarded) achievements.push(milestone.name)
      }
    }

    return achievements
  }

  /**
   * Başarım ver
   */
  private static async awardAchievement(
    userId: string, 
    achievementName: string,
    options?: {
      dynamicAchievement?: boolean,
      category?: string,
      milestone?: string
    }
  ): Promise<boolean> {
    try {
      // Başarım var mı kontrol et, yoksa oluştur
      let achievement = await prisma.achievement.findFirst({
        where: { name: achievementName }
      })

      if (!achievement && options?.dynamicAchievement) {
        // Dinamik başarım oluştur
        achievement = await prisma.achievement.create({
          data: {
            name: achievementName,
            description: `${options.category} kategorisinde ${options.milestone} seviyesine ulaştın!`,
            icon: 'Trophy',
            points: this.calculatePoints(options.milestone || ''),
            condition: JSON.stringify({
              type: 'category_milestone',
              category: options.category,
              milestone: options.milestone
            })
          }
        })
      }

      if (!achievement) return false

      // Kullanıcının bu başarımı var mı?
      const existingAward = await prisma.userAchievement.findFirst({
        where: {
          userId,
          achievementId: achievement.id
        }
      })

      if (existingAward) return false

      // Başarımı ver
      await prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id
        }
      })

      return true
    } catch (error) {
      console.error('Award achievement error:', error)
      return false
    }
  }

  /**
   * Bugünkü istatistikleri getir
   */
  private static async getTodayStats(userId: string) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const result = await prisma.timeEntry.aggregate({
      where: {
        userId,
        startTime: {
          gte: today,
          lt: tomorrow
        }
      },
      _sum: {
        duration: true,
        points: true
      },
      _count: true
    })

    return {
      totalDuration: result._sum.duration || 0,
      totalPoints: result._sum.points || 0,
      sessionCount: result._count
    }
  }

  /**
   * Streak (ardışık gün) hesapla
   */
  private static async calculateStreak(userId: string): Promise<number> {
    const entries = await prisma.timeEntry.findMany({
      where: { userId },
      select: { startTime: true },
      orderBy: { startTime: 'desc' },
      distinct: ['startTime']
    })

    if (entries.length === 0) return 0

    let streak = 1
    let currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)

    for (let i = 1; i <= entries.length; i++) {
      const prevDate = new Date(currentDate)
      prevDate.setDate(prevDate.getDate() - 1)

      const hasEntry = entries.some(entry => {
        const entryDate = new Date(entry.startTime)
        entryDate.setHours(0, 0, 0, 0)
        return entryDate.getTime() === prevDate.getTime()
      })

      if (hasEntry) {
        streak++
        currentDate = prevDate
      } else {
        break
      }
    }

    return streak
  }

  /**
   * Milestone'a göre puan hesapla
   */
  private static calculatePoints(milestone: string): number {
    const pointMap: { [key: string]: number } = {
      'Acemi': 10,
      'Deneyimli': 25,
      'Uzman': 50,
      'Usta': 100,
      'Efsane': 500
    }
    return pointMap[milestone] || 10
  }

  /**
   * Kullanıcının tüm başarımlarını getir
   */
  static async getUserAchievements(userId: string) {
    return await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true
      },
      orderBy: {
        achievedAt: 'desc'
      }
    })
  }

  /**
   * Kullanıcının istatistiklerini getir
   */
  static async getUserStats(userId: string) {
    const [totalStats, todayStats, achievements, streak] = await Promise.all([
      // Toplam istatistikler
      prisma.timeEntry.aggregate({
        where: { userId },
        _sum: { duration: true, points: true },
        _count: true
      }),
      
      // Bugünkü istatistikler
      this.getTodayStats(userId),
      
      // Başarım sayısı
      prisma.userAchievement.count({
        where: { userId }
      }),
      
      // Streak
      this.calculateStreak(userId)
    ])

    return {
      total: {
        duration: totalStats._sum.duration || 0,
        points: totalStats._sum.points || 0,
        sessions: totalStats._count
      },
      today: todayStats,
      achievementCount: achievements,
      currentStreak: streak
    }
  }
}