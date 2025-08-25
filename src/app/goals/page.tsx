'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Target, 
  Clock, 
  TrendingUp, 
  Plus, 
  Edit2, 
  Trash2, 
  Save,
  X,
  CheckCircle
} from 'lucide-react'

interface Category {
  id: string
  name: string
  color: string
  icon?: string
}

interface Goal {
  id: string
  categoryId: string
  targetMinutes: number
  currentMinutes: number
  percentage: number
  period: string
  isActive: boolean
  category: Category
}

export default function GoalsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [categories, setCategories] = useState<Category[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [editingGoal, setEditingGoal] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<number>(0)
  const [newGoals, setNewGoals] = useState<{ [key: string]: number }>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.id) {
      fetchData()
    }
  }, [session])

  const fetchData = async () => {
    try {
      const catResponse = await fetch('/api/categories')
      const catData = await catResponse.json()
      setCategories(catData.categories || [])

      const goalsResponse = await fetch('/api/goals')
const goalsData = await goalsResponse.json()
setGoals(goalsData.data?.goals || goalsData.goals || [])
    } catch (error) {
      console.error('Data fetch error:', error)
      showMessage('error', 'Veriler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleSaveGoal = async (categoryId: string, targetMinutes: number) => {
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          targetMinutes,
          period: 'daily'
        })
      })

      const data = await response.json()

      if (response.ok) {
        showMessage('success', data.message)
        fetchData() // Listeyi yenile
        setNewGoals({}) // Formu temizle
      } else {
        showMessage('error', data.error)
      }
    } catch (error) {
      showMessage('error', 'Hedef kaydedilemedi')
    }
  }

  const handleUpdateGoal = async (goalId: string, targetMinutes: number) => {
    try {
      const response = await fetch('/api/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId,
          targetMinutes
        })
      })

      const data = await response.json()

      if (response.ok) {
        showMessage('success', 'Hedef güncellendi')
        setEditingGoal(null)
        fetchData()
      } else {
        showMessage('error', data.error)
      }
    } catch (error) {
      showMessage('error', 'Hedef güncellenemedi')
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Bu hedefi kaldırmak istediğinize emin misiniz?')) return

    try {
      const response = await fetch(`/api/goals?id=${goalId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showMessage('success', 'Hedef kaldırıldı')
        fetchData()
      }
    } catch (error) {
      showMessage('error', 'Hedef kaldırılamadı')
    }
  }

  const categoriesWithoutGoals = categories.filter(
    cat => !goals.some(goal => goal.categoryId === cat.id)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-2">
            <Target className="w-8 h-8 text-emerald-600" />
            Hedeflerim
          </h1>
          <p className="text-gray-600">
            Günlük çalışma hedeflerinizi belirleyin ve ilerlemelerinizi takip edin
          </p>
        </div>

        {message && (
          <Alert className={message.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
            <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <Card className="bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Aktif Hedefler
            </CardTitle>
            <CardDescription>
              Bugünkü ilerlemeniz ve hedefleriniz
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {goals.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Henüz hedef belirlemediniz. Aşağıdan başlayın!
              </p>
            ) : (
              goals.map((goal) => (
                <div key={goal.id} className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: goal.category.color }}
                      />
                      <span className="font-medium text-gray-700">
                        {goal.category.name}
                      </span>
                    </div>
                    
                    {editingGoal === goal.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(Number(e.target.value))}
                          className="w-20 h-8"
                          min={1}
                          max={1440}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleUpdateGoal(goal.id, editValue)}
                          className="h-8"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingGoal(null)}
                          className="h-8"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">
                          {goal.currentMinutes} / {goal.targetMinutes} dakika
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingGoal(goal.id)
                            setEditValue(goal.targetMinutes)
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <Progress value={goal.percentage} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>%{goal.percentage} tamamlandı</span>
                      {goal.percentage >= 100 ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          Hedef tamamlandı!
                        </span>
                      ) : (
                        <span>{goal.targetMinutes - goal.currentMinutes} dakika kaldı</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {categoriesWithoutGoals.length > 0 && (
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Yeni Hedef Ekle
              </CardTitle>
              <CardDescription>
                Hedef belirlemediğiniz kategoriler için günlük hedef ekleyin
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {categoriesWithoutGoals.map((category) => (
                <div key={category.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-medium text-gray-700 flex-1">
                    {category.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Dakika"
                      value={newGoals[category.id] || ''}
                      onChange={(e) => setNewGoals({
                        ...newGoals,
                        [category.id]: Number(e.target.value)
                      })}
                      className="w-24"
                      min={1}
                      max={1440}
                    />
                    <Button
                      onClick={() => {
                        if (newGoals[category.id] > 0) {
                          handleSaveGoal(category.id, newGoals[category.id])
                        }
                      }}
                      disabled={!newGoals[category.id] || newGoals[category.id] < 1}
                    >
                      Hedef Belirle
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              İpuçları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Gerçekçi hedefler belirleyin. Küçük başlayıp zamanla artırın.</li>
              <li>• Günlük 2-3 saat çalışma, uzun vadede büyük fark yaratır.</li>
              <li>• Hedeflerinizi tamamladığınızda puan ve rozetler kazanırsınız.</li>
              <li>• Her gün düzenli çalışmak, yoğun ama düzensiz çalışmaktan daha etkilidir.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}