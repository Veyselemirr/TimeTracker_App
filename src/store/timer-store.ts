import { create } from 'zustand'

// Timer state'inin tipi
interface TimerState {
  // Mevcut durum
  isRunning: boolean
  currentTime: number // saniye cinsinden
  startTime: Date | null
  activeCategory: string | null
  selectedCategory: string | null // Seçilen kategori
  activeEntryId: string | null // Aktif zaman kaydının ID'si
  description: string
  
  // Actions (fonksiyonlar)
  startTimer: (categoryId: string, description?: string) => Promise<void>
  stopTimer: () => Promise<void>
  pauseTimer: () => void
  resetTimer: () => void
  setDescription: (description: string) => void
  setSelectedCategory: (categoryId: string) => void
  tick: () => void // Her saniye çağrılacak
}

// Zustand store oluştur
export const useTimerStore = create<TimerState>((set, get) => ({
  // Initial state
  isRunning: false,
  currentTime: 0,
  startTime: null,
  activeCategory: null,
  selectedCategory: null,
  activeEntryId: null,
  description: '',

  // Timer başlat - API'ye kaydet
  startTimer: async (categoryId: string, description: string = '') => {
    try {
      console.log('🚀 Starting timer with categoryId:', categoryId)
      
      const now = new Date()
      
      // Session'dan user ID al (client-side)
      const session = await fetch('/api/auth/session').then(res => res.json())
      const userId = session?.user?.id || 'temp-user'
      
      // API'ye yeni time entry oluştur
      const response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startTime: now.toISOString(),
          categoryId,
          description,
          userId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Timer start failed:', errorData)
        throw new Error(`Timer başlatılamadı: ${errorData.error}`)
      }

      const { timeEntry } = await response.json()
      console.log('✅ Timer started successfully:', timeEntry)

      set({
        isRunning: true,
        startTime: now,
        activeCategory: categoryId,
        activeEntryId: timeEntry.id,
        description: description,
        currentTime: 0
      })
    } catch (error) {
      console.error('Timer start error:', error)
      alert(`Timer başlatılamadı: ${error}`)
      // Fallback: Local state'e kaydet
      set({
        isRunning: true,
        startTime: new Date(),
        activeCategory: categoryId,
        description: description,
        currentTime: 0
      })
    }
  },

  // Timer durdur ve API'yi güncelle
  stopTimer: async () => {
    const state = get()
    
    try {
      if (state.activeEntryId && state.startTime) {
        const endTime = new Date()
        const duration = state.currentTime

        // API'yi güncelle
        const response = await fetch('/api/time-entries', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: state.activeEntryId,
            endTime: endTime.toISOString(),
            duration
          })
        })

        if (response.ok) {
          const { timeEntry } = await response.json()
          console.log('✅ Timer completed successfully:', {
            duration: `${Math.floor(duration / 60)}d ${duration % 60}s`,
            category: timeEntry.category?.name,
            points: timeEntry.points
          })
          
          // Başarı bildirimi
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🎉 Çalışma tamamlandı!', {
              body: `${Math.floor(duration / 60)} dakika çalıştın ve ${timeEntry.points} puan kazandın!`,
              icon: '/favicon.ico'
            })
          }
        }
      }
    } catch (error) {
      console.error('Timer stop error:', error)
    }
    
    set({
      isRunning: false,
      currentTime: 0,
      startTime: null,
      activeCategory: null,
      activeEntryId: null,
      description: ''
    })
  },

  // Timer'ı duraklat (veri kaybetmeden)
  pauseTimer: () => {
    set({ isRunning: false })
  },

  // Timer'ı sıfırla
  resetTimer: () => {
    set({
      isRunning: false,
      currentTime: 0,
      startTime: null,
      activeCategory: null,
      activeEntryId: null,
      description: ''
    })
  },

  // Açıklama güncelle
  setDescription: (description: string) => {
    set({ description })
  },

  // Kategori seç
  setSelectedCategory: (categoryId: string) => {
    set({ selectedCategory: categoryId })
  },

  // Her saniye çağrılacak (süreyi artır)
  tick: () => {
    const state = get()
    if (state.isRunning) {
      set({ currentTime: state.currentTime + 1 })
    }
  }
}))

// Helper fonksiyonlar
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export const getTimeBreakdown = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  return {
    hours,
    minutes,
    seconds: seconds % 60,
    totalMinutes: Math.floor(seconds / 60)
  }
}