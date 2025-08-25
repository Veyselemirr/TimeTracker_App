import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false, 
        error: 'Yetkilendirme hatası' 
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'weekly' // daily, weekly

    const now = new Date()
    let startDate: Date
    let endDate: Date = new Date(now)

    if (period === 'daily') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    } else {
      const day = now.getDay()
      const diff = now.getDate() - day + (day === 0 ? -6 : 1)
      startDate = new Date(now.getFullYear(), now.getMonth(), diff)
      startDate.setHours(0, 0, 0, 0)
      
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 7)
    }

    const leaderboardData = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        timeEntries: {
          where: {
            startTime: {
              gte: startDate,
              lt: endDate
            },
            endTime: {
              not: null
            }
          },
          select: {
            duration: true,
            points: true,
            category: {
              select: {
                name: true,
                color: true
              }
            }
          }
        },
        achievements: {
          where: {
            achievedAt: {
              gte: startDate,
              lt: endDate
            }
          },
          select: {
            achievement: {
              select: {
                name: true,
                points: true
              }
            }
          }
        }
      }
    })

    const leaderboard = leaderboardData.map(user => {
      const totalDuration = user.timeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
      const totalMinutes = Math.floor(totalDuration / 60)
      const totalHours = Math.floor(totalMinutes / 60)
      const sessionCount = user.timeEntries.length
      const totalPoints = user.timeEntries.reduce((sum, entry) => sum + (entry.points || 0), 0) +
                         user.achievements.reduce((sum, achievement) => sum + (achievement.achievement.points || 0), 0)
      
      const categoryStats: { [key: string]: { minutes: number; color: string; count: number } } = {}
      user.timeEntries.forEach(entry => {
        const categoryName = entry.category.name
        const minutes = Math.floor((entry.duration || 0) / 60)
        
        if (!categoryStats[categoryName]) {
          categoryStats[categoryName] = {
            minutes: 0,
            color: entry.category.color,
            count: 0
          }
        }
        
        categoryStats[categoryName].minutes += minutes
        categoryStats[categoryName].count += 1
      })

      const topCategory = Object.entries(categoryStats)
        .sort(([,a], [,b]) => b.minutes - a.minutes)[0]

      return {
        id: user.id,
        name: user.name || 'İsimsiz Kullanıcı',
        username: user.username,
        email: user.email,
        totalMinutes,
        totalHours,
        sessionCount,
        totalPoints,
        topCategory: topCategory ? {
          name: topCategory[0],
          minutes: topCategory[1].minutes,
          color: topCategory[1].color,
          count: topCategory[1].count
        } : null,
        categoryStats,
        achievementCount: user.achievements.length
      }
    })

    leaderboard.sort((a, b) => b.totalMinutes - a.totalMinutes)

    const rankedLeaderboard = leaderboard.map((user, index) => ({
      ...user,
      rank: index + 1,
      isCurrentUser: user.id === session.user.id
    }))

    const totalUsers = leaderboard.length
    const activeUsers = leaderboard.filter(u => u.totalMinutes > 0).length
    const totalMinutesAll = leaderboard.reduce((sum, u) => sum + u.totalMinutes, 0)
    const averageMinutes = activeUsers > 0 ? Math.floor(totalMinutesAll / activeUsers) : 0

    const currentUserRank = rankedLeaderboard.find(u => u.isCurrentUser)?.rank || null

    return NextResponse.json({
      success: true,
      data: {
        period,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        leaderboard: rankedLeaderboard,
        statistics: {
          totalUsers,
          activeUsers,
          totalMinutesAll,
          averageMinutes,
          currentUserRank
        }
      }
    })

  } catch (error) {
    console.error('Leaderboard API hatası:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Liderlik tablosu verileri yüklenemedi' 
    }, { status: 500 })
  }
}