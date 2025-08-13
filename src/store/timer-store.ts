import { create } from 'zustand'

// Timer state'inin tipi
interface TimerState {
  // Mevcut durum
  isRunning: boolean
  currentTime: number // saniye cinsinden
  startTime: Date | null
  activeCategory: string | null
  description: string
  
  // Actions (fonksiyonlar)
  startTimer: (categoryId: string, description?: string) => void
  stopTimer: () => void
  pauseTimer: () => void
  resetTimer: () => void
  setDescription: (description: string) => void
  tick: () => void // Her saniye çağrılacak
}

// Zustand store oluştur
export const useTimerStore = create<TimerState>((set, get) => ({
  // Initial state
  isRunning: false,
  currentTime: 0,
  startTime: null,
  activeCategory: null,
  description: '',

  // Timer başlat
  startTimer: (categoryId: string, description: string = '') => {
    set({
      isRunning: true,
      startTime: new Date(),
      activeCategory: categoryId,
      description: description,
      currentTime: 0
    })
  },

  // Timer durdur ve kaydet
  stopTimer: () => {
    const state = get()
    if (state.isRunning && state.startTime && state.activeCategory) {
      // TODO: Veritabanına kaydet
      console.log('Timer stopped:', {
        duration: state.currentTime,
        categoryId: state.activeCategory,
        description: state.description
      })
    }
    
    set({
      isRunning: false,
      currentTime: 0,
      startTime: null,
      activeCategory: null,
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
      description: ''
    })
  },

  // Açıklama güncelle
  setDescription: (description: string) => {
    set({ description })
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