'use client'

import { useEffect } from 'react'
import { useTimerStore, formatTime } from '@/store/timer-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, Pause, Square, RotateCcw } from 'lucide-react'

export function TimerDisplay() {
  const {
    isRunning,
    currentTime,
    activeCategory,
    description,
    startTimer,
    stopTimer,
    pauseTimer,
    resetTimer,
    tick
  } = useTimerStore()

  // Her saniye tick fonksiyonunu çağır
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning) {
      interval = setInterval(() => {
        tick()
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isRunning, tick])

  // Test için kategoriler (daha sonra gerçek verilerle değişecek)
  const testCategories = [
    { id: 'cat1', name: 'Yazılım' },
    { id: 'cat2', name: 'Matematik' },
    { id: 'cat3', name: 'Kitap Okuma' }
  ]

  const handleStart = () => {
    // Test için ilk kategoriyi kullan
    startTimer('cat1', 'Test çalışması')
  }

  const handleStop = () => {
    if (isRunning) {
      pauseTimer()
    } else {
      handleStart()
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Timer</CardTitle>
        {activeCategory && (
          <p className="text-sm text-muted-foreground">
            Kategori: Yazılım {/* Şimdilik sabit */}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Zaman Göstergesi */}
        <div className="text-center">
          <div className="text-6xl font-mono font-bold tracking-wider">
            {formatTime(currentTime)}
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            {currentTime > 0 && (
              <span>
                {Math.floor(currentTime / 60)} dakika çalıştınız
              </span>
            )}
          </div>
        </div>

        {/* Kontrol Butonları */}
        <div className="flex justify-center gap-3">
          {!isRunning && currentTime === 0 ? (
            // Başlat butonu
            <Button onClick={handleStart} size="lg" className="gap-2">
              <Play className="w-4 h-4" />
              Başlat
            </Button>
          ) : (
            <>
              {/* Duraklat/Devam et */}
              <Button onClick={handleStop} size="lg" variant="outline" className="gap-2">
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    Duraklat
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Devam Et
                  </>
                )}
              </Button>

              {/* Durdur */}
              <Button onClick={stopTimer} size="lg" variant="destructive" className="gap-2">
                <Square className="w-4 h-4" />
                Durdur
              </Button>

              {/* Sıfırla */}
              <Button onClick={resetTimer} size="lg" variant="ghost" className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Sıfırla
              </Button>
            </>
          )}
        </div>

        {/* Durum Göstergesi */}
        <div className="text-center">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isRunning 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`} />
            {isRunning ? 'Çalışıyor' : 'Durduruldu'}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}