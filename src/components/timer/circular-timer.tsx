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

interface CircularTimerProps {
  size?: number
}

export function CircularTimer({ size = 420 }: CircularTimerProps) {
  const {
    isRunning,
    currentTime,
    selectedCategory,
    startTimer,
    stopTimer,
    pauseTimer,
    resetTimer,
    tick
  } = useTimerStore()

  const [timerMode, setTimerMode] = useState<'stopwatch' | 'countdown'>('stopwatch')
  const [targetTime, setTargetTime] = useState(3600) // 1 saat default

  // Kategori renklerini API'den gelen hex kodlara göre tanımla
  const categoryColors = {
    '#10b981': { stroke: '#10b981', bg: 'from-emerald-400 to-emerald-600' }, // Yazılım
    '#3b82f6': { stroke: '#3b82f6', bg: 'from-blue-400 to-blue-600' },       // Matematik
    '#8b5cf6': { stroke: '#8b5cf6', bg: 'from-purple-400 to-purple-600' },   // Kitap
    '#f97316': { stroke: '#f97316', bg: 'from-orange-400 to-orange-600' },   // Egzersiz
    '#ec4899': { stroke: '#ec4899', bg: 'from-pink-400 to-pink-600' },       // Müzik
    '#6366f1': { stroke: '#6366f1', bg: 'from-indigo-400 to-indigo-600' },   // Tasarım
    'default': { stroke: '#10b981', bg: 'from-emerald-400 to-emerald-600' }
  }

  // Aktif renk seçimi - selectedCategory artık hex rengi değil ID
  const [selectedCategoryColor, setSelectedCategoryColor] = useState('#10b981')
  
  // Seçilen kategorinin rengini API'den al
  useEffect(() => {
    if (selectedCategory) {
      // API'den kategori bilgisini çek
      fetch(`/api/categories?userId=temp-user`)
        .then(res => res.json())
        .then(data => {
          const category = data.categories?.find((cat: any) => cat.id === selectedCategory)
          if (category) {
            setSelectedCategoryColor(category.color)
          }
        })
        .catch(console.error)
    }
  }, [selectedCategory])

  const activeColor = categoryColors[selectedCategoryColor as keyof typeof categoryColors] || categoryColors.default

  // Progress hesaplama
  const progress = timerMode === 'countdown' 
    ? Math.max(0, ((targetTime - currentTime) / targetTime) * 100)
    : ((currentTime % 3600) / 3600) * 100 // 1 saatte tam tur

  const radius = (size - 30) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress / 100) * circumference

  // Her saniye tick
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning) {
      interval = setInterval(() => {
        tick()
        
        // Countdown modunda süre bittiyse durdur
        if (timerMode === 'countdown' && currentTime >= targetTime) {
          stopTimer()
          alert('⏰ Süre doldu!')
        }
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, tick, timerMode, currentTime, targetTime, stopTimer])

  const handleStart = () => {
    const categoryId = selectedCategory || 'fallback' // Fallback ID
    startTimer(categoryId, `${timerMode === 'countdown' ? 'Countdown' : 'Stopwatch'} çalışması`)
  }

  const handleModeChange = (mode: 'stopwatch' | 'countdown') => {
    if (!isRunning) {
      setTimerMode(mode)
      resetTimer() // Mod değiştiğinde timer'ı sıfırla
    }
  }

  const getDisplayTime = () => {
    if (timerMode === 'countdown') {
      const remaining = Math.max(0, targetTime - currentTime)
      return formatTime(remaining)
    }
    return formatTime(currentTime)
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-8">
      
      {/* Mode Selector */}
      <div className="flex items-center space-x-1 bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-lg border border-gray-200">
        <Button
          size="sm"
          onClick={() => handleModeChange('stopwatch')}
          className={`rounded-full px-6 py-2 text-sm transition-all duration-200 ${
            timerMode === 'stopwatch' 
              ? `bg-gradient-to-r ${activeColor.bg} text-white shadow-md` 
              : 'bg-transparent hover:bg-gray-50 text-gray-600'
          }`}
          disabled={isRunning}
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
          disabled={isRunning}
        >
          <TimerIcon className="w-4 h-4 mr-2" />
          Geri Sayım
        </Button>
      </div>

      {/* Countdown Target Selector */}
      {timerMode === 'countdown' && !isRunning && (
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

      {/* Circular Timer Container */}
      <div className="relative flex items-center justify-center">
        
        {/* Main Timer Circle - Sadece beyaz daire */}
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
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#f9fafb"
              strokeWidth="6"
              fill="none"
            />
            
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={isRunning ? "#10b981" : "#d1d5db"}
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
                {isRunning ? 'Çalışıyor' : 'Durduruldu'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center space-x-4">
        {!isRunning && currentTime === 0 ? (
          <Button 
            onClick={handleStart} 
            size="lg" 
            className="rounded-full px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold"
          >
            <Play className="w-5 h-5 mr-2" />
            Başlat
          </Button>
        ) : (
          <>
            <Button 
              onClick={isRunning ? pauseTimer : handleStart} 
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
              Bitir
            </Button>

            <Button 
              onClick={resetTimer} 
              size="lg" 
              className="rounded-full px-6 py-3 bg-white hover:bg-gray-50 text-gray-600 border-2 border-gray-200 hover:border-gray-300 shadow-md transition-all duration-200"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Sıfırla
            </Button>
          </>
        )}
      </div>
    </div>
  )
}