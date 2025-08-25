'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Clock,
  Target,
  Flame,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Grid3X3,
  List,
  Activity
} from 'lucide-react'

// Types
interface DayData {
  date: string
  totalMinutes: number
  totalSessions: number
  categories: CategoryData[]
  sessions: SessionData[]
  achievements: AchievementData[]
  goalProgress: GoalProgressData[]
  intensity: number
  hasData: boolean
}

interface CategoryData {
  name: string
  color: string
  minutes: number
  sessions: number
}

interface SessionData {
  id: string
  startTime: string
  endTime: string
  duration: number
  description?: string
  category: any
  points: number
}

interface AchievementData {
  id: string
  name: string
  icon: string
  points: number
}

interface GoalProgressData {
  goalId: string
  categoryName: string
  categoryColor: string
  targetMinutes: number
  currentMinutes: number
  percentage: number
  isCompleted: boolean
}

interface CalendarData {
  view: string
  dateRange: { start: string; end: string }
  dailyData: DayData[]
  statistics: any
  streakData: any
  totalDays: number
  activeDays: number
}

type ViewType = 'month' | 'week' | 'day' | 'year' | 'trend'

export default function CalendarPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // State
  const [data, setData] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<ViewType>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null)
  const [showDayModal, setShowDayModal] = useState(false)

  // Auth kontrolü
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  // Data fetch
  useEffect(() => {
    if (session?.user?.id) {
      fetchCalendarData()
    }
  }, [session, currentView, currentDate])

  const fetchCalendarData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const dateStr = currentDate.toISOString().split('T')[0]
      const response = await fetch(
        `/api/calendar?view=${currentView}&date=${dateStr}`,
        { cache: 'no-cache' }
      )
      
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
      console.error('Calendar fetch error:', error)
      setError(error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  // Navigation functions
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    
    switch (currentView) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
        break
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
        break
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
        break
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1))
        break
      case 'trend':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 30 : -30))
        break
    }
    
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleDayClick = (dayData: DayData) => {
    setSelectedDay(dayData)
    setShowDayModal(true)
  }

  // Utility functions
  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return 'bg-gray-100'
    if (intensity < 25) return 'bg-green-200'
    if (intensity < 50) return 'bg-green-300'
    if (intensity < 75) return 'bg-green-400'
    return 'bg-green-500'
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}s ${mins}d`
    }
    return `${mins}d`
  }

  const getCurrentPeriodLabel = () => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long'
    }

    switch (currentView) {
      case 'month':
        return currentDate.toLocaleDateString('tr-TR', options)
      case 'week':
        const weekStart = new Date(currentDate)
        const day = weekStart.getDay()
        const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
        weekStart.setDate(diff)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        return `${weekStart.getDate()}-${weekEnd.getDate()} ${weekStart.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}`
      case 'day':
        return currentDate.toLocaleDateString('tr-TR', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      case 'year':
        return currentDate.getFullYear().toString()
      case 'trend':
        return 'Son 90 Gün Trendi'
      default:
        return ''
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="text-gray-600">Takvim yükleniyor...</p>
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
            <h3 className="text-lg font-semibold text-gray-800">Takvim Yüklenemedi</h3>
            <p className="text-gray-600">{error || 'Takvim verileri yüklenirken bir hata oluştu.'}</p>
            <Button 
              onClick={fetchCalendarData}
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
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 md:w-8 md:h-8 text-emerald-600" />
              Çalışma Takvimi
            </h1>
            <p className="text-gray-600 mt-1">
              Çalışma geçmişinizi ve ilerlemenizi takip edin
            </p>
          </div>
          
          {/* View Selector */}
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'month', label: 'Aylık', icon: Grid3X3 },
              { value: 'week', label: 'Haftalık', icon: List },
              { value: 'day', label: 'Günlük', icon: CalendarIcon },
              { value: 'year', label: 'Yıllık', icon: BarChart3 },
              { value: 'trend', label: 'Trend', icon: TrendingUp }
            ].map((view) => {
              const IconComponent = view.icon
              return (
                <Button
                  key={view.value}
                  onClick={() => setCurrentView(view.value as ViewType)}
                  variant={currentView === view.value ? 'default' : 'outline'}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <IconComponent className="w-4 h-4" />
                  {view.label}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-xs md:text-sm">Toplam Süre</p>
                  <p className="text-lg md:text-2xl font-bold">
                    {formatDuration(data.statistics.totalMinutes)}
                  </p>
                  <p className="text-emerald-100 text-xs">
                    {data.statistics.totalSessions} seans
                  </p>
                </div>
                <Clock className="w-6 h-6 md:w-8 md:h-8 text-emerald-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-xs md:text-sm">Aktif Günler</p>
                  <p className="text-lg md:text-2xl font-bold">
                    {data.activeDays}/{data.totalDays}
                  </p>
                  <p className="text-green-100 text-xs">
                    %{data.statistics.completionRate} oran
                  </p>
                </div>
                <Activity className="w-6 h-6 md:w-8 md:h-8 text-green-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-xs md:text-sm">Güncel Seri</p>
                  <p className="text-lg md:text-2xl font-bold">
                    {data.streakData.currentStreak}
                  </p>
                  <p className="text-orange-100 text-xs">gün üst üste</p>
                </div>
                <Flame className="w-6 h-6 md:w-8 md:h-8 text-orange-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-teal-500 to-teal-600 text-white">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-100 text-xs md:text-sm">Günlük Ortalama</p>
                  <p className="text-lg md:text-2xl font-bold">
                    {formatDuration(data.statistics.avgDailyMinutes)}
                  </p>
                  <p className="text-teal-100 text-xs">aktif günlerde</p>
                </div>
                <Target className="w-6 h-6 md:w-8 md:h-8 text-teal-100" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigateDate('prev')}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <h2 className="text-lg font-semibold text-gray-800 min-w-0">
              {getCurrentPeriodLabel()}
            </h2>
            
            <Button
              onClick={() => navigateDate('next')}
              variant="outline"
              size="sm"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Button
            onClick={goToToday}
            variant="outline"
            size="sm"
          >
            Bugün
          </Button>
        </div>

        {/* Calendar View Content */}
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            {currentView === 'month' && (
              <MonthView 
                data={data} 
                onDayClick={handleDayClick}
                getIntensityColor={getIntensityColor}
                formatDuration={formatDuration}
              />
            )}
            
            {currentView === 'week' && (
              <div className="text-center py-8">
                <List className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">Haftalık Görünüm</h3>
                <p className="text-gray-500">Haftalık görünüm yakında eklenecek</p>
              </div>
            )}
            
            {currentView === 'day' && (
              <div className="text-center py-8">
                <CalendarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">Günlük Görünüm</h3>
                <p className="text-gray-500">Günlük detay görünümü yakında eklenecek</p>
              </div>
            )}
            
            {currentView === 'year' && (
              <div className="text-center py-8">
                <BarChart3 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">Yıllık Görünüm</h3>
                <p className="text-gray-500">GitHub-style heatmap yakında eklenecek</p>
              </div>
            )}
            
            {currentView === 'trend' && (
              <div className="text-center py-8">
                <TrendingUp className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">Trend Görünümü</h3>
                <p className="text-gray-500">Trend analizi yakında eklenecek</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Day Detail Modal */}
        {showDayModal && selectedDay && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {new Date(selectedDay.date).toLocaleDateString('tr-TR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </CardTitle>
                  <Button onClick={() => setShowDayModal(false)} variant="ghost" size="sm">
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatDuration(selectedDay.totalMinutes)}
                    </div>
                    <div className="text-sm text-gray-600">Toplam Çalışma Süresi</div>
                  </div>
                  
                  {selectedDay.sessions.length > 0 ? (
                    <div>
                      <h4 className="font-semibold mb-2">Çalışma Seansları</h4>
                      <div className="space-y-2">
                        {selectedDay.sessions.map((session) => (
                          <div key={session.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: session.category?.color || '#6B7280' }}
                              />
                              <span className="text-sm">{session.category?.name}</span>
                            </div>
                            <span className="text-sm text-gray-600">
                              {formatDuration(Math.floor(session.duration / 60))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      Bu günde çalışma kaydı yok
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  )
}

// Month View Component
function MonthView({ data, onDayClick, getIntensityColor, formatDuration }: any) {
  // Ay başlangıcından itibaren 42 günlük grid oluştur (6 hafta x 7 gün)
  const firstDay = new Date(data.dateRange.start)
  const startOfCalendar = new Date(firstDay)
  
  // Ayın ilk gününün haftanın hangi günü olduğunu bul
  const firstDayOfWeek = firstDay.getDay()
  // Pazartesi başlangıçlı takvim için ayarlama (0=Pazar, 1=Pazartesi)
  const mondayStart = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
  startOfCalendar.setDate(firstDay.getDate() - mondayStart)
  
  const calendarDays = []
  for (let i = 0; i < 42; i++) {
    const date = new Date(startOfCalendar)
    date.setDate(startOfCalendar.getDate() + i)
    
    const dateStr = date.toISOString().split('T')[0]
    const dayData = data.dailyData.find((d: DayData) => d.date === dateStr)
    const isCurrentMonth = date.getMonth() === firstDay.getMonth()
    const isToday = dateStr === new Date().toISOString().split('T')[0]
    
    calendarDays.push({
      date: dateStr,
      dayNumber: date.getDate(),
      isCurrentMonth,
      isToday,
      dayData: dayData || null
    })
  }

  const weekdays = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

  return (
    <div className="space-y-6">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-2">
        {weekdays.map(day => (
          <div key={day} className="p-3 text-center text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            onClick={() => day.dayData && onDayClick(day.dayData)}
            className={`
              relative min-h-[120px] p-3 border-2 rounded-xl transition-all duration-200 hover:shadow-lg
              ${day.isCurrentMonth 
                ? 'bg-white border-gray-200 hover:border-blue-300' 
                : 'bg-gray-50 border-gray-100 opacity-50'
              }
              ${day.isToday ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
              ${day.dayData?.hasData ? 'cursor-pointer hover:bg-blue-50' : 'cursor-default'}
            `}
          >
            {/* Day Number */}
            <div className={`text-lg font-bold mb-2 ${
              day.isToday 
                ? 'text-blue-600' 
                : day.isCurrentMonth 
                  ? 'text-gray-900' 
                  : 'text-gray-400'
            }`}>
              {day.dayNumber}
            </div>

            {/* Data Visualization */}
            {day.dayData?.hasData && (
              <div className="space-y-2">
                {/* Intensity Indicator & Achievements */}
                <div className="flex items-center gap-2">
                  <div className={`h-2 flex-1 rounded-full ${getIntensityColor(day.dayData.intensity)}`} />
                  {day.dayData.achievements.length > 0 && (
                    <div className="w-3 h-3 bg-yellow-400 rounded-full flex-shrink-0" title="Rozet kazanıldı" />
                  )}
                </div>
                
                {/* Duration */}
                <div className="text-sm font-semibold text-blue-600 text-center">
                  {formatDuration(day.dayData.totalMinutes)}
                </div>

                {/* Top Categories (max 2 for better fit) */}
                <div className="space-y-1">
                  {day.dayData.categories.slice(0, 2).map((cat: CategoryData, i: number) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div 
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs text-gray-700 font-medium truncate flex-1">
                        {cat.name.length > 8 ? cat.name.substring(0, 8) + '...' : cat.name}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        {cat.minutes >= 60 ? `${Math.floor(cat.minutes / 60)}s` : `${cat.minutes}d`}
                      </span>
                    </div>
                  ))}
                  
                  {/* Show indicator if more categories exist */}
                  {day.dayData.categories.length > 2 && (
                    <div className="text-xs text-gray-500 text-center font-medium">
                      +{day.dayData.categories.length - 2} kategori
                    </div>
                  )}
                </div>

                {/* Session Count */}
                <div className="text-xs text-gray-500 text-center bg-gray-50 py-1 rounded">
                  {day.dayData.totalSessions} seans
                </div>
              </div>
            )}

            {/* Empty State for days with no data */}
            {!day.dayData?.hasData && day.isCurrentMonth && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-300">
                  <div className="text-xs">Çalışma yok</div>
                </div>
              </div>
            )}

            {/* Goal completion indicators - Bottom */}
            {day.dayData?.goalProgress && day.dayData.goalProgress.length > 0 && (
              <div className="absolute bottom-2 left-2 right-2">
                <div className="flex gap-1">
                  {day.dayData.goalProgress.slice(0, 3).map((goal: GoalProgressData, i: number) => (
                    <div 
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${
                        goal.isCompleted ? 'bg-green-400' : 'bg-gray-200'
                      }`}
                      title={`${goal.categoryName}: %${goal.percentage}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
        <div className="text-center">
          <div className="text-xl font-bold text-blue-600">
            {formatDuration(data.statistics.totalMinutes)}
          </div>
          <div className="text-sm text-gray-600 font-medium">Toplam Süre</div>
        </div>
        
        <div className="text-center">
          <div className="text-xl font-bold text-green-600">
            {data.activeDays}
          </div>
          <div className="text-sm text-gray-600 font-medium">Aktif Günler</div>
        </div>
        
        <div className="text-center">
          <div className="text-xl font-bold text-purple-600">
            {formatDuration(data.statistics.avgDailyMinutes)}
          </div>
          <div className="text-sm text-gray-600 font-medium">Günlük Ortalama</div>
        </div>
        
        <div className="text-center">
          <div className="text-xl font-bold text-orange-600">
            {data.streakData.currentStreak}
          </div>
          <div className="text-sm text-gray-600 font-medium">Güncel Seri</div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 p-4 bg-white border rounded-xl">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-100 rounded-full"></div>
          <span>Çalışma yok</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-200 rounded-full"></div>
          <span>Az (%0-25)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-300 rounded-full"></div>
          <span>Orta (%25-50)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          <span>İyi (%50-75)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Mükemmel (%75+)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
          <span>Rozet kazanıldı</span>
        </div>
      </div>
    </div>
  )
}