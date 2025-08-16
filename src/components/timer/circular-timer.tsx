'use client'

import { useEffect, useState } from 'react'
import { useTimerStore, formatTime } from '@/store/timer-store'
import { Button } from '@/components/ui/button'
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw,
  Clock,
  Timer as TimerIcon
} from 'lucide-react'
import { useSession } from 'next-auth/react'

interface CircularTimerProps {
  size?: number
}

export default function CircularTimer({ size = 420 }: CircularTimerProps) {
  const { data: session } = useSession()
  
  const {
    isRunning,
    currentTime,
    selectedCategory,
    activeTimerId,
    isLoading,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    tick,
    loadActiveTimer
  } = useTimerStore()

  const [timerMode, setTimerMode] = useState<'stopwatch' | 'countdown'>('stopwatch')
  const [targetTime, setTargetTime] = useState(3600) // 1 saat default
  const [selectedCategoryColor, setSelectedCategoryColor] = useState('#10b981')

  // Kategori renklerini tanımla
  const categoryColors = {
    '#10b981': { stroke: '#10b981', bg: 'from-emerald-400 to-emerald-600' },
    '#3b82f6': { stroke: '#3b82f6', bg: 'from-blue-400 to-blue-600' },
    '#8b5cf6': { stroke: '#8b5cf6', bg: 'from-purple-400 to-purple-600' },
    '#f97316': { stroke: '#f97316', bg: 'from-orange-400 to-orange-600' },
    '#ec4899': { stroke: '#ec4899', bg: 'from-pink-400 to-pink-600' },
    '#6366f1': { stroke: '#6366f1', bg: 'from-indigo-400 to-indigo-600' },
    'default': { stroke: '#10b981', bg: 'from-emerald-400 to-emerald-600' }
  }

  // Sayfa yüklendiğinde aktif timer'ı kontrol et
  useEffect(() => {
    if (session?.user?.id) {
      console.log('🔍 Aktif timer kontrol ediliyor...')
      loadActiveTimer()
    }
  }, [session, loadActiveTimer])

  // Seçilen kategorinin rengini al
  useEffect(() => {
    if (selectedCategory && session?.user?.id) {
      fetch('/api/categories')
        .then(res => res.json())
        .then(data => {
          const category = data.categories?.find((cat: any) => cat.id === selectedCategory)
          if (category) {
            setSelectedCategoryColor(category.color)
          }
        })
        .catch(console.error)
    }
  }, [selectedCategory, session])

  const activeColor = categoryColors[selectedCategoryColor as keyof typeof categoryColors] || categoryColors.default

  // Progress hesaplama
  const progress = timerMode === 'countdown' 
    ? Math.max(0, ((targetTime - currentTime) / targetTime) * 100)
    : ((currentTime % 3600) / 3600) * 100

  const radius = (size - 30) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress / 100) * circumference

  // Her saniye tick
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning && !isLoading) {
      interval = setInterval(() => {
        tick()
        
        // Countdown modunda süre bittiyse durdur
        if (timerMode === 'countdown' && currentTime >= targetTime) {
          stopTimer()
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('⏰ Süre Doldu!', {
              body: 'Geri sayım tamamlandı!',
              icon: '/favicon.ico'
            })
          }
        }
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, isLoading, tick, timerMode, currentTime, targetTime, stopTimer])

  const handleStart = () => {
    if (!selectedCategory) {
      alert('Lütfen bir kategori seçin!')
      return
    }
    
    const description = timerMode === 'countdown' 
      ? `Geri sayım (${targetTime / 60} dakika)` 
      : 'Kronometre çalışması'
    
    startTimer(selectedCategory, description)
  }

  const handlePauseResume = () => {
    if (isRunning) {
      pauseTimer()
    } else if (activeTimerId) {
      resumeTimer()
    } else {
      handleStart()
    }
  }

  const handleModeChange = (mode: 'stopwatch' | 'countdown') => {
    if (!isRunning && !activeTimerId) {
      setTimerMode(mode)
    }
  }

  const getDisplayTime = () => {
    if (timerMode === 'countdown') {
      const remaining = Math.max(0, targetTime - currentTime)
      return formatTime(remaining)
    }
    return formatTime(currentTime)
  }

  // Loading durumu
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[420px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-8">
      
      {/* Mode Selector - Sadece aktif timer yoksa göster */}
      {!activeTimerId && (
        <div className="flex items-center space-x-1 bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-lg border border-gray-200">
          <Button
            size="sm"
            onClick={() => handleModeChange('stopwatch')}
            className={`rounded-full px-6 py-2 text-sm transition-all duration-200 ${
              timerMode === 'stopwatch' 
                ? `bg-gradient-to-r ${activeColor.bg} text-white shadow-md` 
                : 'bg-transparent hover:bg-gray-50 text-gray-600'
            }`}
          >
            <Clock className="w-4 h-4 mr-2" />
            Kronometre
          </Button>
          <Button
            size="sm"
            onClick={() => handleModeChange('countdown')}
            className={`rounded-full px-6 py-2 text-sm transition-all duration-200 ${
              timerMode === 'countdown' 
                ? `bg-gradient-to-r ${activeColor.bg} text-white shadow-md` 
                : 'bg-transparent hover:bg-gray-50 text-gray-600'
            }`}
          >
            <TimerIcon className="w-4 h-4 mr-2" />
            Geri Sayım
          </Button>
        </div>
      )}

      {/* Countdown Target Selector */}
      {timerMode === 'countdown' && !isRunning && !activeTimerId && (
        <div className="flex items-center space-x-3 bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200">
          <span className="text-sm text-gray-600 font-medium">Hedef süre:</span>
          <div className="flex space-x-2">
            {[
              { seconds: 900, label: "15dk" },
              { seconds: 1800, label: "30dk" },
              { seconds: 3600, label: "1sa" },
              { seconds: 5400, label: "1.5sa" }
            ].map((option) => (
              <Button
                key={option.seconds}
                size="sm"
                onClick={() => setTargetTime(option.seconds)}
                className={`text-xs h-8 px-4 rounded-lg transition-all duration-200 ${
                  targetTime === option.seconds
                    ? `bg-gradient-to-r ${activeColor.bg} text-white shadow-md`
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Circular Timer */}
      <div className="relative flex items-center justify-center">
        <div 
          className="relative rounded-full bg-white shadow-xl"
          style={{ width: size, height: size }}
        >
          {/* Progress Circle SVG */}
          <svg 
            width={size} 
            height={size} 
            className="absolute top-0 left-0 transform -rotate-90"
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#f9fafb"
              strokeWidth="6"
              fill="none"
            />
            
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={isRunning ? activeColor.stroke : "#d1d5db"}
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
            
            {/* Time Display */}
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-mono font-semibold text-gray-800 tracking-wide">
                {getDisplayTime()}
              </div>
              
              {/* Subtitle */}
              <div className="text-sm text-gray-500 mt-2 font-medium">
                {timerMode === 'countdown' ? (
                  currentTime >= targetTime ? 'Süre doldu!' : 'Kalan süre'
                ) : (
                  currentTime > 0 ? `${Math.floor(currentTime / 60)} dakika` : 'Hazır'
                )}
              </div>
            </div>

            {/* Status Indicator */}
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
              isRunning 
                ? `bg-gradient-to-r ${activeColor.bg} text-white shadow-lg` 
                : 'bg-gray-100 text-gray-600'
            }`}>
              <div className={`w-2 h-2 rounded-full transition-all duration-200 ${
                isRunning ? 'bg-white animate-pulse' : 'bg-gray-400'
              }`} />
              <span className="text-xs font-semibold">
                {isRunning ? 'Çalışıyor' : activeTimerId ? 'Duraklatıldı' : 'Durduruldu'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center space-x-4">
        {!activeTimerId ? (
          // Timer başlatılmamış
          <Button 
            onClick={handleStart} 
            size="lg" 
            disabled={!selectedCategory}
            className="rounded-full px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-5 h-5 mr-2" />
            Başlat
          </Button>
        ) : (
          // Timer aktif veya duraklatılmış
          <>
            <Button 
              onClick={handlePauseResume} 
              size="lg" 
              className="rounded-full px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-gray-300 shadow-md transition-all duration-200"
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Duraklat
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Devam
                </>
              )}
            </Button>

            <Button 
              onClick={stopTimer} 
              size="lg" 
              className="rounded-full px-6 py-3 bg-white hover:bg-red-50 text-red-600 border-2 border-red-200 hover:border-red-300 shadow-md transition-all duration-200"
            >
              <Square className="w-4 h-4 mr-2" />
              Bitir ve Kaydet
            </Button>

            <Button 
              onClick={resetTimer} 
              size="lg" 
              className="rounded-full px-6 py-3 bg-white hover:bg-gray-50 text-gray-600 border-2 border-gray-200 hover:border-gray-300 shadow-md transition-all duration-200"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              İptal
            </Button>
          </>
        )}
      </div>

      {/* Debug Info - Development Only */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400 text-center space-y-1">
          <div>Timer ID: {activeTimerId || 'Yok'}</div>
          <div>Kategori: {selectedCategory || 'Seçilmedi'}</div>
          <div>Durum: {isRunning ? 'Çalışıyor' : activeTimerId ? 'Duraklatıldı' : 'Durduruldu'}</div>
        </div>
      )}
    </div>
  )
}