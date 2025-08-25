'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Legend
} from 'recharts'
import {
  Clock,
  Target,
  TrendingUp,
  Award,
  Calendar,
  Timer,
  Flame,
  Trophy,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  AlertCircle
} from 'lucide-react'

interface DashboardData {
  timeStats: {
    today: { seconds: number; minutes: number; hours: number; sessions: number }
    week: { seconds: number; minutes: number; hours: number; sessions: number }
    month: { seconds: number; minutes: number; hours: number; sessions: number }
  }
  categoryStats: {
    today: Array<{ name: string; color: string; duration: number; count: number }>
    week: Array<{ name: string; color: string; duration: number; count: number }>
    month: Array<{ name: string; color: string; duration: number; count: number }>
    allTime: Array<{ name: string; color: string; duration: number; count: number }>
  }
  goalProgress: Array<{
    id: string
    categoryName: string
    categoryColor: string
    targetMinutes: number
    currentMinutes: number
    percentage: number
    isCompleted: boolean
  }>
  totalStats: {
    totalMinutes: number
    totalHours: number
    totalSessions: number
    totalPoints: number
    totalBadges: number
    currentStreak: number
  }
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('week')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.id) {
      fetchDashboardData()
    }
  }, [session])

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)
      
      const response = await fetch('/api/dashboard', {
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
      console.error('Dashboard fetch error:', error)
      setError(error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}s ${minutes}d`
    }
    return `${minutes}d`
  }

  const formatDetailedDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    
    if (hours > 0) {
      return `${hours}s ${minutes}d ${remainingSeconds}sn`
    }
    if (minutes > 0) {
      return `${minutes}d ${remainingSeconds}sn`
    }
    return `${remainingSeconds}sn`
  }

  const prepareBarChartData = () => {
    if (!data) return []
    
    const currentStats = data.categoryStats[selectedPeriod]
    return currentStats.map(stat => ({
      name: stat.name.length > 10 ? stat.name.substring(0, 10) + '...' : stat.name,
      fullName: stat.name,
      minutes: Math.floor(stat.duration / 60),
      hours: parseFloat((stat.duration / 3600).toFixed(1)),
      sessions: stat.count,
      color: stat.color
    }))
  }

  const preparePieChartData = () => {
    if (!data) return []
    
    const currentStats = data.categoryStats[selectedPeriod]
    return currentStats.map(stat => ({
      name: stat.name,
      value: Math.floor(stat.duration / 60),
      color: stat.color
    })).filter(item => item.value > 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="text-gray-600">Dashboard yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="text-lg font-semibold text-gray-800">Veri Yüklenemedi</h3>
            <p className="text-gray-600">{error || 'Dashboard verileri yüklenirken bir hata oluştu.'}</p>
            <Button 
              onClick={() => fetchDashboardData()}
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

  const completedGoals = data.goalProgress.filter(goal => goal.isCompleted).length
  const barChartData = prepareBarChartData()
  const pieChartData = preparePieChartData()
  const currentTimeStats = data.timeStats[selectedPeriod]

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center justify-center sm:justify-start gap-2">
              <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-emerald-600" />
              Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Çalışma istatistikleriniz ve ilerlemeniz
            </p>
          </div>
          
          <Button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card className="bg-gradient-to-r from-emerald-500 to-green-600 text-white">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-emerald-100 text-xs md:text-sm">Toplam Çalışma</p>
                  <p className="text-lg md:text-2xl font-bold truncate">
                    {data.totalStats.totalHours}s
                  </p>
                  <p className="text-emerald-100 text-xs">
                    {data.totalStats.totalSessions} seans
                  </p>
                </div>
                <Clock className="w-6 h-6 md:w-8 md:h-8 text-emerald-100 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-blue-100 text-xs md:text-sm">Toplam Puan</p>
                  <p className="text-lg md:text-2xl font-bold truncate">
                    {data.totalStats.totalPoints.toLocaleString()}
                  </p>
                  <p className="text-blue-100 text-xs">
                    {data.totalStats.totalBadges} rozet
                  </p>
                </div>
                <Trophy className="w-6 h-6 md:w-8 md:h-8 text-blue-100 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-purple-100 text-xs md:text-sm">Bugünkü Hedefler</p>
                  <p className="text-lg md:text-2xl font-bold">
                    {completedGoals}/{data.goalProgress.length}
                  </p>
                  <p className="text-purple-100 text-xs">tamamlandı</p>
                </div>
                <Target className="w-6 h-6 md:w-8 md:h-8 text-purple-100 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-orange-100 text-xs md:text-sm">Günlük Seri</p>
                  <p className="text-lg md:text-2xl font-bold">
                    {data.totalStats.currentStreak}
                  </p>
                  <p className="text-orange-100 text-xs">gün üst üste</p>
                </div>
                <Flame className="w-6 h-6 md:w-8 md:h-8 text-orange-100 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center">
          <div className="flex items-center space-x-1 bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-lg border">
            {[
              { key: 'today', label: 'Bugün' },
              { key: 'week', label: 'Bu Hafta' },
              { key: 'month', label: 'Bu Ay' }
            ].map((period) => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key as any)}
                className={`px-4 md:px-6 py-2 text-sm rounded-full transition-all duration-200 ${
                  selectedPeriod === period.key
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5" />
              {selectedPeriod === 'today' && 'Bugünkü Çalışma'}
              {selectedPeriod === 'week' && 'Bu Haftaki Çalışma'}
              {selectedPeriod === 'month' && 'Bu Ayki Çalışma'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <p className="text-sm text-gray-600">Toplam Süre</p>
                <p className="text-xl font-bold text-emerald-600">
                  {formatDuration(currentTimeStats.seconds)}
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Seans Sayısı</p>
                <p className="text-xl font-bold text-blue-600">
                  {currentTimeStats.sessions}
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Ortalama Seans</p>
                <p className="text-xl font-bold text-purple-600">
                  {currentTimeStats.sessions > 0 
                    ? formatDuration(Math.floor(currentTimeStats.seconds / currentTimeStats.sessions))
                    : '0d'
                  }
                </p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600">Detaylı Süre</p>
                <p className="text-sm font-bold text-orange-600">
                  {formatDetailedDuration(currentTimeStats.seconds)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Kategori Bazında Çalışma Süreleri
                </CardTitle>
              </CardHeader>
              <CardContent>
                {barChartData.length === 0 ? (
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Bu periyotta çalışma kaydı yok</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: any, name: string, props: any) => [
                          `${value} dakika`,
                          'Süre'
                        ]}
                        labelFormatter={(label: string, payload: any) => {
                          const item = payload?.[0]?.payload
                          return item?.fullName || label
                        }}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                        {barChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" />
                  Kategori Dağılımı
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pieChartData.length === 0 ? (
                  <div className="h-80 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <PieChartIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Bu periyotta çalışma kaydı yok</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        dataKey="value"
                        labelLine={false}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [`${value} dakika`, 'Süre']}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={50}
                        formatter={(value: string) => value.length > 15 ? value.substring(0, 15) + '...' : value}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}