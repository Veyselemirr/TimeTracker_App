'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Users,
  Trophy,
  Medal,
  Award,
  Crown,
  Star,
  Clock,
  Target,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Calendar,
  BarChart3,
  Flame,
  Zap
} from 'lucide-react'

// Types
interface LeaderboardUser {
  id: string
  name: string
  username: string
  email: string
  totalMinutes: number
  totalHours: number
  sessionCount: number
  totalPoints: number
  rank: number
  isCurrentUser: boolean
  topCategory: {
    name: string
    minutes: number
    color: string
    count: number
  } | null
  categoryStats: { [key: string]: { minutes: number; color: string; count: number } }
  achievementCount: number
}

interface LeaderboardData {
  period: string
  dateRange: { start: string; end: string }
  leaderboard: LeaderboardUser[]
  statistics: {
    totalUsers: number
    activeUsers: number
    totalMinutesAll: number
    averageMinutes: number
    currentUserRank: number | null
  }
}

type PeriodType = 'daily' | 'weekly'

export default function LeaderboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // State
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('weekly')
  const [refreshing, setRefreshing] = useState(false)

  // Auth kontrolü
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  // Data fetch
  useEffect(() => {
    if (session?.user?.id) {
      fetchLeaderboardData()
    }
  }, [session, selectedPeriod])

  const fetchLeaderboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)
      
      const response = await fetch(`/api/leaderboard?period=${selectedPeriod}`, {
        cache: 'no-cache'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        setData(result.data)
      } else {
        throw new Error(result.error || 'Veri yüklenemedi')
      }
    } catch (error) {
      console.error('Leaderboard fetch error:', error)
      setError(error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Helper functions
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}s ${mins}d`
    }
    return `${mins}d`
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-600">#{rank}</span>
    }
  }

  const getUserInitials = (name: string, username: string) => {
    if (name && name !== 'İsimsiz Kullanıcı') {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return username.slice(0, 2).toUpperCase()
  }

  const getPeriodLabel = () => {
    if (!data) return ''
    
    const startDate = new Date(data.dateRange.start)
    const endDate = new Date(data.dateRange.end)
    
    if (selectedPeriod === 'daily') {
      return startDate.toLocaleDateString('tr-TR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } else {
      const weekStart = startDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
      const weekEnd = new Date(endDate.getTime() - 1).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
      return `${weekStart} - ${weekEnd}`
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="text-gray-600">Liderlik tablosu yükleniyor...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-800">Liderlik Tablosu Yüklenemedi</h3>
            <p className="text-gray-600">{error || 'Liderlik tablosu verileri yüklenirken bir hata oluştu.'}</p>
            <Button 
              onClick={() => fetchLeaderboardData()}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tekrar Dene
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center justify-center sm:justify-start gap-2">
              <Users className="w-6 h-6 md:w-8 md:h-8 text-emerald-600" />
              Liderlik Tablosu
            </h1>
            <p className="text-gray-600 mt-1">
              En çok çalışanları keşfedin ve kendinizi motive edin
            </p>
          </div>
          
          <Button
            onClick={() => fetchLeaderboardData(true)}
            disabled={refreshing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
        </div>

        {/* Period Selector */}
        <div className="flex justify-center">
          <div className="flex items-center space-x-1 bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-lg border">
            {[
              { key: 'daily', label: 'Günlük', icon: Calendar },
              { key: 'weekly', label: 'Haftalık', icon: BarChart3 }
            ].map((period) => {
              const IconComponent = period.icon
              return (
                <button
                  key={period.key}
                  onClick={() => setSelectedPeriod(period.key as PeriodType)}
                  className={`flex items-center gap-2 px-4 md:px-6 py-2 text-sm rounded-full transition-all duration-200 ${
                    selectedPeriod === period.key
                      ? 'bg-emerald-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {period.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Period Info */}
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-700">
            {getPeriodLabel()}
          </h2>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-xs md:text-sm">Toplam Kullanıcı</p>
                  <p className="text-lg md:text-2xl font-bold">{data.statistics.totalUsers}</p>
                </div>
                <Users className="w-6 h-6 md:w-8 md:h-8 text-emerald-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs md:text-sm">Aktif Kullanıcı</p>
                  <p className="text-lg md:text-2xl font-bold">{data.statistics.activeUsers}</p>
                  <p className="text-blue-100 text-xs">
                    %{data.statistics.totalUsers > 0 ? Math.round((data.statistics.activeUsers / data.statistics.totalUsers) * 100) : 0} oran
                  </p>
                </div>
                <Zap className="w-6 h-6 md:w-8 md:h-8 text-blue-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-xs md:text-sm">Ortalama Süre</p>
                  <p className="text-lg md:text-2xl font-bold">
                    {formatDuration(data.statistics.averageMinutes)}
                  </p>
                  <p className="text-purple-100 text-xs">aktif kullanıcılar</p>
                </div>
                <Clock className="w-6 h-6 md:w-8 md:h-8 text-purple-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-xs md:text-sm">Sıralamanız</p>
                  <p className="text-lg md:text-2xl font-bold">
                    {data.statistics.currentUserRank ? `#${data.statistics.currentUserRank}` : '-'}
                  </p>
                  <p className="text-orange-100 text-xs">
                    {data.statistics.totalUsers} kişi arasında
                  </p>
                </div>
                <Trophy className="w-6 h-6 md:w-8 md:h-8 text-orange-100" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top 3 Podium */}
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Top 3 - Podyum
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-end space-x-8">
              {/* İlk 3 kullanıcıyı görsel düzende göster: 2., 1., 3. */}
              {[1, 0, 2].map((rankIndex, visualIndex) => {
                const user = data.leaderboard[rankIndex] // Gerçek sıralamadaki kullanıcı
                const heights = ['h-24', 'h-32', 'h-20'] // 2., 1., 3. için yükseklikler
                const bgColors = ['bg-gray-200', 'bg-yellow-200', 'bg-amber-200'] // 2., 1., 3. için renkler
                
                if (!user) return null

                return (
                  <div key={user.id} className="flex flex-col items-center space-y-3">
                    {/* Avatar */}
                    <Avatar className={`w-16 h-16 ${user.isCurrentUser ? 'ring-4 ring-emerald-400' : ''}`}>
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">
                        {getUserInitials(user.name, user.username)}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* User Info */}
                    <div className="text-center">
                      <div className="font-semibold text-sm">
                        {user.name}
                        {user.isCurrentUser && (
                          <Badge className="ml-1 text-xs bg-emerald-100 text-emerald-700">Siz</Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-600">@{user.username}</div>
                    </div>

                    {/* Podium */}
                    <div className={`${heights[visualIndex]} ${bgColors[visualIndex]} w-20 rounded-t-lg flex flex-col items-center justify-center border-2 border-gray-300`}>
                      {getRankIcon(user.rank)}
                      <div className="text-sm font-bold mt-1">{formatDuration(user.totalMinutes)}</div>
                      <div className="text-xs text-gray-600">{user.sessionCount} seans</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Full Leaderboard */}
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Tam Liderlik Tablosu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.leaderboard.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:shadow-md ${
                    user.isCurrentUser 
                      ? 'bg-emerald-50 border-2 border-emerald-200 shadow-sm' 
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {/* Left Side - Rank & User */}
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 flex items-center justify-center">
                      {getRankIcon(user.rank)}
                    </div>
                    
                    <Avatar className={`w-10 h-10 ${user.isCurrentUser ? 'ring-2 ring-emerald-400' : ''}`}>
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold text-sm">
                        {getUserInitials(user.name, user.username)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {user.name}
                        </h3>
                        {user.isCurrentUser && (
                          <Badge className="text-xs bg-emerald-100 text-emerald-700">Siz</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">@{user.username}</p>
                      
                      {user.topCategory && (
                        <div className="flex items-center gap-2 mt-1">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: user.topCategory.color }}
                          />
                          <span className="text-xs text-gray-500">
                            {user.topCategory.name} ({formatDuration(user.topCategory.minutes)})
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Right Side - Stats */}
                  <div className="text-right space-y-1">
                    <div className="font-bold text-lg text-emerald-600">
                      {formatDuration(user.totalMinutes)}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {user.sessionCount} seans
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {user.totalPoints} puan
                      </div>
                      {user.achievementCount > 0 && (
                        <div className="flex items-center gap-1">
                          <Trophy className="w-3 h-3" />
                          {user.achievementCount} rozet
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {data.leaderboard.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Henüz veri yok
                </h3>
                <p className="text-gray-500">
                  Bu periyotta hiçbir kullanıcı çalışma kaydı oluşturmamış.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}