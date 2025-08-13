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

export function CircularTimer({ size = 300 }: CircularTimerProps) {
  const {
    isRunning,
    currentTime,
    startTimer,
    stopTimer,
    pauseTimer,
    resetTimer,
    tick
  } = useTimerStore()

  const [timerMode, setTimerMode] = useState<'stopwatch' | 'countdown'>('stopwatch')
  const [targetTime, setTargetTime] = useState(3600) // 1 saat default

  // Progress hesaplama
  const progress = timerMode === 'countdown' 
    ? ((targetTime - currentTime) / targetTime) * 100
    : ((currentTime % 3600) / 3600) * 100 // 1 saatte tam tur

  const radius = (size - 20) / 2
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
        }
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, tick, timerMode, currentTime, targetTime, stopTimer])

  const handleStart = () => {
    startTimer('default', `${timerMode === 'countdown' ? 'Countdown' : 'Stopwatch'} çalışması`)
  }

  const getDisplayTime = () => {
    if (timerMode === 'countdown') {
      const remaining = Math.max(0, targetTime - currentTime)
      return formatTime(remaining)
    }
    return formatTime(currentTime)
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      
      {/* Mode Selector - Daha sade */}
      <div className="flex items-center space-x-1 bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-sm">
        <Button
          size="sm"
          variant={timerMode === 'stopwatch' ? 'default' : 'ghost'}
          onClick={() => setTimerMode('stopwatch')}
          className="rounded-full px-4 text-sm bg-emerald-500 hover:bg-emerald-600"
        >
          <Clock className="w-4 h-4 mr-1" />
          Kronometre
        </Button>
        <Button
          size="sm"
          variant={timerMode === 'countdown' ? 'default' : 'ghost'}
          onClick={() => setTimerMode('countdown')}
          className="rounded-full px-4 text-sm"
        >
          <TimerIcon className="w-4 h-4 mr-1" />
          Geri Sayım
        </Button>
      </div>

      {/* Countdown Target Selector */}
      {timerMode === 'countdown' && !isRunning && (
        <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm">
          <span className="text-sm text-gray-600">Hedef:</span>
          <div className="flex space-x-1">
            {[
              { seconds: 900, label: "15dk" },
              { seconds: 1800, label: "30dk" },
              { seconds: 3600, label: "1sa" },
              { seconds: 5400, label: "1.5sa" }
            ].map((option) => (
              <Button
                key={option.seconds}
                size="sm"
                variant={targetTime === option.seconds ? 'default' : 'outline'}
                onClick={() => setTargetTime(option.seconds)}
                className="text-xs h-7 px-3"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Circular Timer */}
      <div className="relative flex items-center justify-center">
        
        {/* Background Circle - Sade beyaz */}
        <div 
          className="absolute inset-0 rounded-full bg-white/95 backdrop-blur-sm shadow-lg"
          style={{ width: size, height: size }}
        />

        {/* Progress Circle */}
        <svg 
          width={size} 
          height={size} 
          className="absolute transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#f0f9ff"
            strokeWidth="6"
            fill="none"
          />
          
          {/* Progress circle - Yeşil tonları */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isRunning ? "#10b981" : "#6b7280"}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Content */}
        <div className="flex flex-col items-center justify-center space-y-3 z-10">
          
          {/* Time Display */}
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-mono font-bold text-gray-800">
              {getDisplayTime()}
            </div>
            
            {/* Subtitle */}
            <div className="text-sm text-gray-500 mt-1">
              {timerMode === 'countdown' ? (
                currentTime >= targetTime ? 'Süre doldu!' : 'Kalan süre'
              ) : (
                currentTime > 0 ? `${Math.floor(currentTime / 60)} dakika` : 'Hazır'
              )}
            </div>
          </div>

          {/* Status Indicator */}
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
            isRunning 
              ? 'bg-emerald-100 text-emerald-700' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
            }`} />
            <span className="text-xs font-medium">
              {isRunning ? 'Çalışıyor' : 'Durduruldu'}
            </span>
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center space-x-3">
        {!isRunning && currentTime === 0 ? (
          <Button 
            onClick={handleStart} 
            size="lg" 
            className="rounded-full px-8 bg-emerald-500 hover:bg-emerald-600 text-white shadow-md"
          >
            <Play className="w-5 h-5 mr-2" />
            Başlat
          </Button>
        ) : (
          <>
            <Button 
              onClick={isRunning ? pauseTimer : handleStart} 
              size="lg" 
              variant="outline"
              className="rounded-full px-6 bg-white hover:bg-gray-50"
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
              variant="outline"
              className="rounded-full px-6 bg-white hover:bg-red-50 text-red-600 border-red-200"
            >
              <Square className="w-4 h-4 mr-2" />
              Bitir
            </Button>

            <Button 
              onClick={resetTimer} 
              size="lg" 
              variant="ghost"
              className="rounded-full px-6 text-gray-600 hover:bg-white/50"
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