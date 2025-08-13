import { CircularTimer } from '@/components/timer/circular-timer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BookOpen, 
  Code, 
  Calculator, 
  Dumbbell,
  Music,
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
  { id: 'software', name: 'Yazılım', icon: Code, color: 'bg-emerald-500' },
  { id: 'math', name: 'Matematik', icon: Calculator, color: 'bg-blue-500' },
  { id: 'reading', name: 'Kitap', icon: BookOpen, color: 'bg-purple-500' },
  { id: 'exercise', name: 'Egzersiz', icon: Dumbbell, color: 'bg-orange-500' },
  { id: 'music', name: 'Müzik', icon: Music, color: 'bg-pink-500' },
]

const dailyGoals = [
  { category: 'Yazılım', target: 180, completed: 0, color: 'emerald' },
  { category: 'Matematik', target: 120, completed: 0, color: 'blue' },
  { category: 'Kitap', target: 60, completed: 0, color: 'purple' },
]

export default function TimerPage() {
  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}s ${mins}d`
    }
    return `${mins}d`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      
      <div className="container mx-auto px-4 py-8 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold text-gray-800">
            Timer
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Zamanını takip et, hedeflerine odaklan ve her gün biraz daha ilerle.
          </p>
        </div>

        {/* Main Timer */}
        <div className="flex justify-center">
          <CircularTimer size={320} />
        </div>

        {/* Category Selection - Daha küçük */}
        <Card className="bg-white/90 backdrop-blur-sm border-emerald-100 max-w-3xl mx-auto shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-gray-700">
              <Target className="w-5 h-5" />
              Çalışma Konusu Seç
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant="ghost"
                  className="h-16 flex-col space-y-1 bg-white hover:bg-emerald-50 border border-gray-100 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-sm"
                >
                  <div className={`p-1.5 rounded-md ${category.color}`}>
                    <category.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs text-gray-600">{category.name}</span>
                </Button>
              ))}
              <Button
                variant="ghost"
                className="h-16 flex-col space-y-1 bg-white hover:bg-gray-50 border border-dashed border-gray-300 rounded-lg transition-all duration-200 hover:scale-105"
              >
                <div className="p-1.5 rounded-md bg-gray-200">
                  <Plus className="w-4 h-4 text-gray-500" />
                </div>
                <span className="text-xs text-gray-500">Yeni</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          
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

          {/* Today's Sessions */}
          <Card className="bg-white/90 backdrop-blur-sm border-emerald-100 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-700">
                <Clock className="w-5 h-5" />
                Bugünkü Çalışmalar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todaysSessions.length === 0 || todaysSessions.every(s => s.duration === 0) ? (
                <div className="text-center py-6">
                  <TrendingUp className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    Henüz çalışma kaydı yok.
                    <br />
                    Timer'ı başlatarak ilk seansını oluştur!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaysSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full bg-${session.color}-500`} />
                        <span className="font-medium text-gray-700">{session.category}</span>
                      </div>
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                        {formatMinutes(session.duration)}
                      </Badge>
                    </div>
                  ))}
                  
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex items-center justify-between font-semibold text-gray-700">
                      <span>Toplam</span>
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
  )
}