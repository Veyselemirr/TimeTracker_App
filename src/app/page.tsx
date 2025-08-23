'use client'

import { useTimerStore } from '@/store/timer-store'
import CircularTimer from '@/components/timer/circular-timer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Target,
  Clock,
  TrendingUp,
  Plus,
  X,
  Save,
  Palette
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

// API'den gelecek kategori tipi
interface Category {
  id: string
  name: string
  description: string | null
  color: string
  icon: string | null
  isDefault: boolean
}

// Hedef tipi
interface Goal {
  id: string
  categoryId: string
  categoryName: string
  categoryColor: string
  targetMinutes: number
  currentMinutes: number
  percentage: number
}

// Çalışma seansı tipi
interface TimeEntry {
  id: string
  startTime: string
  endTime: string | null
  duration: number | null
  description: string | null
  points: number
  category: {
    name: string
    color: string
  }
}

export default function TimerPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { setSelectedCategory, selectedCategory } = useTimerStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [goalsLoading, setGoalsLoading] = useState(true)
  const [entriesLoading, setEntriesLoading] = useState(true)

  // Modal state'leri
  const [showModal, setShowModal] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')
  const [modalLoading, setModalLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Renk seçenekleri
  const colorOptions = [
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#8B5CF6', // Purple
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#EC4899', // Pink
    '#6366F1', // Indigo
    '#84CC16', // Lime
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#8B5A2B', // Brown
    '#6B7280'  // Gray
  ]

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  // Authentication kontrolü
  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
  }, [status, router])

  // Kategorileri API'den çek
  const fetchCategories = async () => {
    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Categories fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [session?.user?.id])

  // Hedefleri API'den çek
  useEffect(() => {
    if (!session?.user?.id) return

    const fetchGoals = async () => {
  try {
    const response = await fetch('/api/goals')
    const data = await response.json()
    console.log('Goals API response:', data) // Debug satırı
   if (data.data && data.data.goals) {
  setGoals(data.data.goals)
} else if (data.goals) {
  setGoals(data.goals) // Backward compatibility
}
  } catch (error) {
    console.error('Goals fetch error:', error)
  } finally {
    setGoalsLoading(false)
  }
}

    fetchGoals()
    
    // Her 30 saniyede bir hedefleri güncelle (timer çalışırken ilerleme görsün)
    const interval = setInterval(fetchGoals, 30000)
    return () => clearInterval(interval)
  }, [session?.user?.id])

  // Bugünkü zaman kayıtlarını çek
  useEffect(() => {
    if (!session?.user?.id) return

    const fetchTodayEntries = async () => {
      try {
        const today = new Date().toISOString().split('T')[0]
        const response = await fetch(`/api/time-entries?date=${today}`)
        const data = await response.json()
        
        if (data.timers) {
          // Sadece tamamlanmış seansları filtrele
          const completedEntries = data.timers.filter((timer: any) => 
            timer.endTime && timer.duration > 0
          )
          setTimeEntries(completedEntries)
        }
      } catch (error) {
        console.error('Time entries fetch error:', error)
      } finally {
        setEntriesLoading(false)
      }
    }

    fetchTodayEntries()
    
    // Her dakika güncelle (yeni tamamlanan seanslar için)
    const interval = setInterval(fetchTodayEntries, 60000)
    return () => clearInterval(interval)
  }, [session?.user?.id])

  // Yeni kategori kaydet
  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) {
      showMessage('error', 'Kategori adı gerekli')
      return
    }

    setModalLoading(true)
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim() || null,
          color: newCategoryColor
        })
      })

      const data = await response.json()

      if (response.ok) {
        showMessage('success', 'Kategori başarıyla eklendi!')
        setShowModal(false)
        setNewCategoryName('')
        setNewCategoryDescription('')
        setNewCategoryColor('#3B82F6')
        fetchCategories() // Listeyi yenile
      } else {
        showMessage('error', data.error || 'Kategori eklenirken hata oluştu')
      }
    } catch (error) {
      showMessage('error', 'Bağlantı hatası')
    } finally {
      setModalLoading(false)
    }
  }

  // Modal'ı kapat
  const closeModal = () => {
    setShowModal(false)
    setNewCategoryName('')
    setNewCategoryDescription('')
    setNewCategoryColor('#3B82F6')
  }

  // Bugünkü toplam çalışma süresi (saniye)
  const getTotalDuration = () => {
    return timeEntries.reduce((total, entry) => total + (entry.duration || 0), 0)
  }

  // Helper fonksiyonlar
  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes}dk`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}s ${mins}dk` : `${hours}s`
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}s ${minutes}dk`
    }
    return `${minutes}dk`
  }

  const formatTimeHHMM = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
  }

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

          {/* Message */}
          {message && (
            <div className="max-w-4xl mx-auto">
              <Alert className={message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                  {message.text}
                </AlertDescription>
              </Alert>
            </div>
          )}

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
                        onClick={() => setShowModal(true)}
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

              {/* Daily Goals - Gerçek API verilerinden */}
              <Card className="bg-white/90 backdrop-blur-sm border-emerald-100 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-700">
                    <Target className="w-5 h-5" />
                    Bugünkü Hedefler
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {goalsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded mb-2"></div>
                          <div className="h-2 bg-gray-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : goals.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <p>Henüz hedef belirlenmemiş</p>
                      <p className="text-sm mt-1">Kategorileriniz için günlük hedefler belirleyin</p>
                    </div>
                  ) : (
                    goals.map((goal) => (
                      <div key={goal.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: goal.categoryColor }}
                            />
                            <span className="font-medium text-gray-700">{goal.categoryName}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatMinutes(goal.currentMinutes)} / {formatMinutes(goal.targetMinutes)}
                          </span>
                        </div>
                        <Progress 
                          value={goal.percentage} 
                          className="h-2"
                        />
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>%{Math.round(goal.percentage)} tamamlandı</span>
                          <span>
                            {goal.percentage >= 100 
                              ? 'Hedef tamamlandı!' 
                              : `${formatMinutes(goal.targetMinutes - goal.currentMinutes)} kaldı`
                            }
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Alt Kısım - Bugünkü Çalışmalar - Gerçek API verilerinden */}
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white/90 backdrop-blur-sm border-emerald-100 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-700">
                    <Clock className="w-5 h-5" />
                    Bugünkü Çalışmalar
                  </CardTitle>
                  {timeEntries.length > 0 && (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                      {timeEntries.length} seans
                    </Badge>
                  )}
                </div>
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
                    {timeEntries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
                            {formatTimeHHMM(entry.startTime)}
                            {entry.endTime && ` - ${formatTimeHHMM(entry.endTime)}`}
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

      {/* Modal - Yeni Kategori Ekle */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Palette className="w-6 h-6" />
                Yeni Kategori Ekle
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeModal}
                className="rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              {/* Kategori Adı */}
              <div className="space-y-2">
                <label htmlFor="categoryName" className="text-md  font-medium text-gray-700">
                  Kategori Adı
                </label>
                <Input
                  id="categoryName"
                  placeholder="Örn: Yazılım, Spor, Müzik..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  maxLength={30}
                />
              </div>


              {/* Renk Seçimi */}
              <div className="space-y-3">
                <label className="text-lg  font-medium text-gray-700">Renk Seçin</label>
                <div className="grid grid-cols-6 mt-3 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCategoryColor(color)}
                      className={`w-10 h-10 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                        newCategoryColor === color 
                          ? 'border-gray-800 shadow-lg' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div 
                    className="w-4 h-4 rounded-full border" 
                    style={{ backgroundColor: newCategoryColor }}
                  />
                  <span>Seçilen renk: {newCategoryColor}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center gap-3 p-6 border-t bg-gray-50 rounded-b-2xl">
              <Button
                variant="outline"
                onClick={closeModal}
                className="flex-1"
              >
                İptal
              </Button>
              <Button
                onClick={handleSaveCategory}
                disabled={!newCategoryName.trim() || modalLoading}
                className="flex-1 flex items-center gap-2"
              >
                {modalLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {modalLoading ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}