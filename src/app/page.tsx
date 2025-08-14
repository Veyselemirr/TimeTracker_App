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

// Mock data - gerçek verilerle değişecek
const todaysSessions = [
  { id: 1, category: 'Yazılım', duration: 0, color: 'emerald' },
  { id: 2, category: 'Matematik', duration: 0, color: 'blue' },
  { id: 3, category: 'Kitap', duration: 0, color: 'purple' },
]

const categories = [
  { id: 'software', name: 'Yazılım', colorClass: 'bg-emerald-500', ringClass: 'ring-emerald-200', hoverClass: 'hover:bg-emerald-50' },
  { id: 'math', name: 'Matematik', colorClass: 'bg-blue-500', ringClass: 'ring-blue-200', hoverClass: 'hover:bg-blue-50' },
  { id: 'reading', name: 'Kitap', colorClass: 'bg-purple-500', ringClass: 'ring-purple-200', hoverClass: 'hover:bg-purple-50' },
  { id: 'exercise', name: 'Egzersiz', colorClass: 'bg-orange-500', ringClass: 'ring-orange-200', hoverClass: 'hover:bg-orange-50' },
  { id: 'music', name: 'Müzik', colorClass: 'bg-pink-500', ringClass: 'ring-pink-200', hoverClass: 'hover:bg-pink-50' },
  { id: 'design', name: 'Tasarım', colorClass: 'bg-indigo-500', ringClass: 'ring-indigo-200', hoverClass: 'hover:bg-indigo-50' },
]

const dailyGoals = [
  { category: 'Yazılım', target: 180, completed: 0, color: 'emerald' },
  { category: 'Matematik', target: 120, completed: 0, color: 'blue' },
  { category: 'Kitap', target: 60, completed: 0, color: 'purple' },
]

export default function TimerPage() {
  const { setSelectedCategory, selectedCategory } = useTimerStore()
  
  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}s ${mins}d`
    }
    return `${mins}d`
  }

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId)
  }

  return (
    <div className="relative min-h-screen">
      {/* Full Screen Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50" />
      
      {/* Main Content with Sidebar Margin */}
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

          {/* Main Content Grid - Timer Sol, Kategoriler ve Hedefler Sağ */}
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
                  <div className="grid grid-cols-2 gap-3">
                    {categories.map((category) => (
                      <Button
                        key={category.id}
                        variant="ghost"
                        onClick={() => handleCategorySelect(category.id)}
                        className={`h-16 flex-col space-y-2 bg-white border transition-all duration-200 hover:scale-105 hover:shadow-sm group ${
                          selectedCategory === category.id 
                            ? `${category.hoverClass} border-2 shadow-md` 
                            : `${category.hoverClass} border-gray-100`
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full ${category.colorClass} ring-4 ${category.ringClass} group-hover:scale-110 transition-transform ${
                          selectedCategory === category.id ? 'scale-110' : ''
                        }`} />
                        <span className={`text-xs font-medium ${
                          selectedCategory === category.id ? 'text-gray-800' : 'text-gray-600'
                        }`}>{category.name}</span>
                      </Button>
                    ))}
                    <Button
                      variant="ghost"
                      className="h-16 flex-col space-y-2 bg-white hover:bg-gray-50 border border-dashed border-gray-300 rounded-lg transition-all duration-200 hover:scale-105"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-200 ring-4 ring-gray-100 flex items-center justify-center">
                        <Plus className="w-4 h-4 text-gray-500" />
                      </div>
                      <span className="text-xs text-gray-500">Yeni</span>
                    </Button>
                  </div>
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
                  {dailyGoals.map((goal) => (
                    <div key={goal.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">{goal.category}</span>
                        <span className="text-sm text-gray-500">
                          {formatMinutes(goal.completed)} / {formatMinutes(goal.target)}
                        </span>
                      </div>
                      <Progress 
                        value={(goal.completed / goal.target) * 100} 
                        className="h-2"
                      />
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>%{Math.round((goal.completed / goal.target) * 100)} tamamlandı</span>
                        <span>{formatMinutes(goal.target - goal.completed)} kaldı</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

            </div>
          </div>

          {/* Alt Kısım - Bugünkü Çalışmalar (Full Width) */}
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white/90 backdrop-blur-sm border-emerald-100 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-gray-700">
                  <Clock className="w-5 h-5" />
                  Bugünkü Çalışmalar
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todaysSessions.length === 0 || todaysSessions.every(s => s.duration === 0) ? (
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
                    {todaysSessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`w-4 h-4 rounded-full bg-${session.color}-500`} />
                          <span className="font-medium text-gray-700">{session.category}</span>
                        </div>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                          {formatMinutes(session.duration)}
                        </Badge>
                      </div>
                    ))}
                    
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="flex items-center justify-between font-semibold text-gray-700 text-lg">
                        <span>Toplam Çalışma</span>
                        <span className="text-emerald-600">
                          {formatMinutes(todaysSessions.reduce((acc, s) => acc + s.duration, 0))}
                        </span>
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