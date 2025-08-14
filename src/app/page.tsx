'use client'

import { useTimerStore } from '@/store/timer-store'
import { CircularTimer } from '@/components/timer/circular-timer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Target,
  Clock,
  TrendingUp,
  Plus
} from 'lucide-react'
import { useEffect, useState } from 'react'

// API'den gelecek kategori tipi
interface Category {
  id: string
  name: string
  description: string | null
  color: string
  icon: string | null
  isDefault: boolean
}

export default function TimerPage() {
  const { setSelectedCategory, selectedCategory } = useTimerStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [timeEntries, setTimeEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [entriesLoading, setEntriesLoading] = useState(true)
  
  // Kategorileri API'den çek
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories?userId=temp-user')
        const data = await response.json()
        setCategories(data.categories || [])
      } catch (error) {
        console.error('Categories fetch error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // Bugünkü zaman kayıtlarını çek
  useEffect(() => {
    const fetchTodayEntries = async () => {
      try {
        const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
        const response = await fetch(`/api/time-entries?userId=temp-user&date=${today}`)
        const data = await response.json()
        setTimeEntries(data.timeEntries || [])
      } catch (error) {
        console.error('Time entries fetch error:', error)
      } finally {
        setEntriesLoading(false)
      }
    }

    fetchTodayEntries()
    
    // Her 10 saniyede bir güncelle
    const interval = setInterval(fetchTodayEntries, 10000)
    return () => clearInterval(interval)
  }, [])

  // Kategori bazında toplam süreleri hesapla
  const getCategoryStats = () => {
    const stats: { [key: string]: number } = {}
    
    timeEntries.forEach(entry => {
      const categoryName = entry.category?.name || 'Bilinmeyen'
      stats[categoryName] = (stats[categoryName] || 0) + (entry.duration || 0)
    })
    
    return stats
  }

  // Bugünkü toplam çalışma süresi (saniye)
  const getTotalDuration = () => {
    return timeEntries.reduce((total, entry) => total + (entry.duration || 0), 0)
  }

  // Hedef ilerleme hesapla
  const calculateGoalProgress = (categoryName: string, targetMinutes: number) => {
    const categoryStats = getCategoryStats()
    const completedSeconds = categoryStats[categoryName] || 0
    const completedMinutes = Math.floor(completedSeconds / 60)
    
    return {
      completed: completedMinutes,
      target: targetMinutes,
      percentage: Math.min((completedMinutes / targetMinutes) * 100, 100)
    }
  }
  
  // Helper fonksiyonlar
  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}s ${mins}d`
    }
    return `${mins}d`
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}s ${minutes}d`
    }
    return `${minutes}d`
  }

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
  }

  // Dinamik hedefler - kategorilere göre
  const dailyGoals = categories.map(category => {
    const defaultTargets: { [key: string]: number } = {
      'Yazılım': 180,
      'Matematik': 120, 
      'Kitap Okuma': 60,
      'Egzersiz': 90,
      'Müzik': 60,
      'Tasarım': 120
    }
    
    const targetMinutes = defaultTargets[category.name] || 60
    const progress = calculateGoalProgress(category.name, targetMinutes)
    
    return {
      id: category.id,
      category: category.name,
      target: targetMinutes,
      completed: progress.completed,
      percentage: progress.percentage,
      color: category.color
    }
  })

  return (
    <div className="relative min-h-screen">
      {/* Full Screen Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50" />
      
      {/* Main Content */}
      <div className="relative z-10">
        <div className="space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2 pt-4">
            <h1 className="text-3xl font-bold text-gray-800">
              Timer
            </h1>
            <p className="text-gray-600 text-base max-w-2xl mx-auto">
              Zamanını takip et, hedeflerine odaklan ve her gün biraz daha ilerle.
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Sol Taraf - Timer */}
            <div className="lg:col-span-3">
              <div className="flex justify-start pl-8">
                <CircularTimer size={420} />
              </div>
            </div>

            {/* Sağ Taraf - Kategori Seçimi ve Hedefler */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Category Selection */}
              <Card className="bg-white/90 backdrop-blur-sm border-emerald-100 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-700">
                    <Target className="w-5 h-5" />
                    Çalışma Konusu Seç
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-4 text-gray-500">
                      Kategoriler yükleniyor...
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {categories.map((category) => (
                        <Button
                          key={category.id}
                          variant="ghost"
                          onClick={() => handleCategorySelect(category.id)}
                          className={`h-16 flex-col space-y-2 bg-white border transition-all duration-200 hover:scale-105 hover:shadow-sm group ${
                            selectedCategory === category.id 
                              ? 'border-2 shadow-md bg-gray-50' 
                              : 'border-gray-100 hover:bg-gray-50'
                          }`}
                        >
                          <div 
                            className={`w-8 h-8 rounded-full group-hover:scale-110 transition-transform shadow-md ${
                              selectedCategory === category.id ? 'scale-110 shadow-lg' : ''
                            }`}
                            style={{ backgroundColor: category.color }}
                          />
                          <span className={`text-xs font-medium ${
                            selectedCategory === category.id ? 'text-gray-800' : 'text-gray-600'
                          }`}>
                            {category.name}
                          </span>
                        </Button>
                      ))}
                      
                      <Button
                        variant="ghost"
                        className="h-16 flex-col space-y-2 bg-white hover:bg-gray-50 border border-dashed border-gray-300 rounded-lg transition-all duration-200 hover:scale-105"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <Plus className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="text-xs text-gray-500">Yeni</span>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Daily Goals */}
              <Card className="bg-white/90 backdrop-blur-sm border-emerald-100 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-700">
                    <Target className="w-5 h-5" />
                    Bugünkü Hedefler
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dailyGoals.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      Kategoriler yükleniyor...
                    </div>
                  ) : (
                    dailyGoals.map((goal) => (
                      <div key={goal.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: goal.color }}
                            />
                            <span className="font-medium text-gray-700">{goal.category}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatMinutes(goal.completed)} / {formatMinutes(goal.target)}
                          </span>
                        </div>
                        <Progress 
                          value={goal.percentage} 
                          className="h-2"
                        />
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>%{Math.round(goal.percentage)} tamamlandı</span>
                          <span>{formatMinutes(goal.target - goal.completed)} kaldı</span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Alt Kısım - Bugünkü Çalışmalar */}
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white/90 backdrop-blur-sm border-emerald-100 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-gray-700">
                  <Clock className="w-5 h-5" />
                  Bugünkü Çalışmalar
                </CardTitle>
              </CardHeader>
              <CardContent>
                {entriesLoading ? (
                  <div className="text-center py-4 text-gray-500">
                    Çalışmalar yükleniyor...
                  </div>
                ) : timeEntries.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">
                      Henüz çalışma kaydı yok.
                      <br />
                      Timer&apos;ı başlatarak ilk seansını oluştur!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {timeEntries.map((entry, index) => (
                      <div key={entry.id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: entry.category?.color || '#6b7280' }}
                          />
                          <div>
                            <span className="font-medium text-gray-700">
                              {entry.category?.name || 'Bilinmeyen Kategori'}
                            </span>
                            {entry.description && (
                              <div className="text-xs text-gray-500">
                                {entry.description}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(entry.startTime).toLocaleTimeString('tr-TR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                            {entry.endTime && ` - ${new Date(entry.endTime).toLocaleTimeString('tr-TR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                            {formatDuration(entry.duration || 0)}
                          </Badge>
                          {entry.points > 0 && (
                            <Badge variant="outline" className="text-xs">
                              +{entry.points} puan
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Toplam */}
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="flex items-center justify-between font-semibold text-gray-700 text-lg">
                        <span>Toplam Çalışma</span>
                        <div className="flex items-center gap-3">
                          <span className="text-emerald-600">
                            {formatDuration(getTotalDuration())}
                          </span>
                          <Badge className="bg-emerald-600">
                            +{Math.floor(getTotalDuration() / 60)} puan
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}