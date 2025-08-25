'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Trophy, 
  Award, 
  Star, 
  Lock,
  RefreshCw,
  AlertCircle,
  Flame,
  Clock,
  Target,
  TrendingUp,
  BarChart3,
  Crown,
  Medal,
  Zap,
  Shield,
  Sword,
  Crosshair,
  Timer,
  Calendar,
  Sunrise,
  Moon,
  BookOpen,
  GraduationCap,
  Shuffle,
  Clock3,
  Clock4
} from 'lucide-react'
import { RARITY_COLORS, RARITY_NAMES, CATEGORY_NAMES } from '@/lib/achievements'

const ICON_MAP: { [key: string]: any } = {
  Trophy, Award, Star, Flame, Clock, Target, TrendingUp, Crown, Medal, Zap, 
  Shield, Sword, Crosshair, Timer, Calendar, Sunrise, Moon, BookOpen, 
  GraduationCap, Shuffle, Clock3, Clock4, Focus: Target
}

interface AchievementData {
  id: string
  name: string
  description: string
  icon: string
  category: string
  points: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  isUnlocked: boolean
  unlockedAt: string | null
}

interface UserStats {
  totalHours: number
  totalSessions: number
  dailyMinutes: number
  currentStreak: number
  uniqueCategories: number
  maxCategoryHours: number
  goalsCompleted: number
  monthlyGoalsCompleted: number
}

interface AchievementResponse {
  userStats: UserStats
  achievements: { [category: string]: AchievementData[] }
  newAchievements: AchievementData[] | null
  totalPoints: number
  totalBadges: number
}

export default function AchievementsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<AchievementResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showNewAchievements, setShowNewAchievements] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Auth kontrolü
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  // Achievement verilerini yükle
  useEffect(() => {
    if (session?.user?.id) {
      fetchAchievements()
    }
  }, [session])

  // Yeni achievement'lar varsa göster
  useEffect(() => {
    if (data?.newAchievements && data.newAchievements.length > 0) {
      setShowNewAchievements(true)
      // 5 saniye sonra otomatik kapat
      setTimeout(() => setShowNewAchievements(false), 5000)
    }
  }, [data?.newAchievements])

  const fetchAchievements = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)
      
      const response = await fetch('/api/achievements', {
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
      console.error('Achievements fetch error:', error)
      setError(error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getIcon = (iconName: string) => {
    const IconComponent = ICON_MAP[iconName] || Trophy
    return IconComponent
  }

  const getRarityBadge = (rarity: string) => {
    const color = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS]
    const name = RARITY_NAMES[rarity as keyof typeof RARITY_NAMES]
    
    return (
      <Badge 
        className="text-xs"
        style={{ 
          backgroundColor: color + '20', 
          color: color,
          border: `1px solid ${color}40`
        }}
      >
        {name}
      </Badge>
    )
  }

  const getFilteredAchievements = () => {
    if (!data) return []
    
    if (selectedCategory === 'all') {
      return Object.values(data.achievements).flat()
    }
    
    if (selectedCategory === 'unlocked') {
      return Object.values(data.achievements).flat().filter(a => a.isUnlocked)
    }
    
    if (selectedCategory === 'locked') {
      return Object.values(data.achievements).flat().filter(a => !a.isUnlocked)
    }
    
    return data.achievements[selectedCategory] || []
  }

  const getProgressStats = () => {
    if (!data) return { unlocked: 0, total: 0, percentage: 0 }
    
    const allAchievements = Object.values(data.achievements).flat()
    const unlocked = allAchievements.filter(a => a.isUnlocked).length
    const total = allAchievements.length
    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0
    
    return { unlocked, total, percentage }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="text-gray-600">Rozetler yükleniyor...</p>
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
            <h3 className="text-lg font-semibold text-gray-800">Rozetler Yüklenemedi</h3>
            <p className="text-gray-600">{error || 'Rozet verileri yüklenirken bir hata oluştu.'}</p>
            <Button 
              onClick={() => fetchAchievements()}
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

  const progressStats = getProgressStats()
  const filteredAchievements = getFilteredAchievements()

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center justify-center sm:justify-start gap-2">
              <Trophy className="w-6 h-6 md:w-8 md:h-8 text-emerald-600" />
              Rozetler & Başarımlar
            </h1>
            <p className="text-gray-600 mt-1">
              Başarılarınızı kazanın ve koleksiyonunuzu büyütün
            </p>
          </div>
          
          <Button
            onClick={() => fetchAchievements(true)}
            disabled={refreshing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
        </div>

        {/* Yeni Achievement Bildirimi */}
        {showNewAchievements && data.newAchievements && (
          <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Star className="w-8 h-8" />
                  <div>
                    <h3 className="font-bold">🎉 Yeni Rozet Kazandınız!</h3>
                    <p className="text-sm opacity-90">
                      {data.newAchievements.length} yeni başarım unlocked!
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowNewAchievements(false)}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  ✕
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-xs md:text-sm">Toplam Puan</p>
                  <p className="text-lg md:text-2xl font-bold">
                    {data.totalPoints.toLocaleString()}
                  </p>
                </div>
                <Star className="w-6 h-6 md:w-8 md:h-8 text-emerald-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-xs md:text-sm">Kazanılan Rozet</p>
                  <p className="text-lg md:text-2xl font-bold">{data.totalBadges}</p>
                </div>
                <Award className="w-6 h-6 md:w-8 md:h-8 text-orange-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-xs md:text-sm">Güncel Seri</p>
                  <p className="text-lg md:text-2xl font-bold">{data.userStats.currentStreak}</p>
                  <p className="text-green-100 text-xs">gün</p>
                </div>
                <Flame className="w-6 h-6 md:w-8 md:h-8 text-green-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs md:text-sm">Tamamlama</p>
                  <p className="text-lg md:text-2xl font-bold">{progressStats.percentage}%</p>
                  <p className="text-blue-100 text-xs">
                    {progressStats.unlocked}/{progressStats.total}
                  </p>
                </div>
                <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-blue-100" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* İlerleme Çubuğu */}
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Genel İlerleme</h3>
                <span className="text-sm text-gray-600">
                  {progressStats.unlocked} / {progressStats.total} Rozet
                </span>
              </div>
              <Progress value={progressStats.percentage} className="h-3" />
              <p className="text-sm text-gray-600 text-center">
                %{progressStats.percentage} tamamlandı - Devam edin! 🚀
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Kategori Filtreleri */}
        <div className="flex flex-wrap gap-2 justify-center">
          {[
            { key: 'all', label: 'Tümü', icon: Trophy },
            { key: 'unlocked', label: 'Kazanılan', icon: Award },
            { key: 'locked', label: 'Kilitli', icon: Lock },
            { key: 'streak', label: 'Seri', icon: Flame },
            { key: 'time', label: 'Süre', icon: Clock },
            { key: 'goal', label: 'Hedef', icon: Target },
            { key: 'performance', label: 'Performans', icon: TrendingUp },
            { key: 'total', label: 'Toplam', icon: BarChart3 },
            { key: 'category', label: 'Kategori', icon: Shuffle }
          ].map((filter) => {
            const IconComponent = filter.icon
            return (
              <button
                key={filter.key}
                onClick={() => setSelectedCategory(filter.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all duration-200 ${
                  selectedCategory === filter.key
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-white/80 text-gray-600 hover:bg-gray-50 border'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {filter.label}
              </button>
            )
          })}
        </div>

        {/* Achievement Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAchievements.map((achievement) => {
            const IconComponent = getIcon(achievement.icon)
            const isLocked = !achievement.isUnlocked
            
            return (
              <Card 
                key={achievement.id}
                className={`relative overflow-hidden transition-all duration-300 hover:scale-105 ${
                  isLocked 
                    ? 'bg-gray-100 border-gray-200' 
                    : 'bg-white border-2 shadow-lg'
                }`}
                style={{
                  borderColor: isLocked ? undefined : RARITY_COLORS[achievement.rarity]
                }}
              >
                <CardContent className="p-4 space-y-3">
                  
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-full ${
                      isLocked ? 'bg-gray-200' : 'bg-gradient-to-br from-emerald-100 to-green-100'
                    }`}>
                      {isLocked ? (
                        <Lock className="w-6 h-6 text-gray-400" />
                      ) : (
                        <IconComponent 
                          className="w-6 h-6" 
                          style={{ color: RARITY_COLORS[achievement.rarity] }}
                        />
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-1 items-end">
                      {getRarityBadge(achievement.rarity)}
                      <Badge variant="outline" className="text-xs">
                        {achievement.points} puan
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <h3 className={`font-bold ${isLocked ? 'text-gray-400' : 'text-gray-800'}`}>
                      {achievement.name}
                    </h3>
                    <p className={`text-sm ${isLocked ? 'text-gray-400' : 'text-gray-600'}`}>
                      {achievement.description}
                    </p>
                    
                    {achievement.isUnlocked && achievement.unlockedAt && (
                      <p className="text-xs text-green-600 font-medium">
                        ✓ {new Date(achievement.unlockedAt).toLocaleDateString('tr-TR')} tarihinde kazanıldı
                      </p>
                    )}
                  </div>

                  {/* Glow effect for unlocked achievements */}
                  {!isLocked && (
                    <div 
                      className="absolute inset-0 bg-gradient-to-r opacity-10 pointer-events-none"
                      style={{
                        background: `linear-gradient(45deg, ${RARITY_COLORS[achievement.rarity]}40, transparent)`
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Empty State */}
        {filteredAchievements.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Bu kategoride rozet bulunamadı
            </h3>
            <p className="text-gray-500">
              Farklı bir kategori seçerek rozetleri keşfedebilirsiniz.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}