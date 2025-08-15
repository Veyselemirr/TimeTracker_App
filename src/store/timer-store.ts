// src/store/timer-store.ts
import { create } from 'zustand'

interface TimerState {
  // State
  isRunning: boolean
  currentTime: number
  startTime: Date | null
  activeTimerId: string | null
  selectedCategory: string | null
  description: string
  isLoading: boolean
  
  // Actions
  startTimer: (categoryId: string, description?: string) => Promise<void>
  stopTimer: () => Promise<void>
  pauseTimer: () => void
  resumeTimer: () => void
  resetTimer: () => Promise<void>
  loadActiveTimer: () => Promise<void>
  setSelectedCategory: (categoryId: string | null) => void
  setDescription: (description: string) => void
  tick: () => void
}

export const useTimerStore = create<TimerState>((set, get) => ({
  // Initial state
  isRunning: false,
  currentTime: 0,
  startTime: null,
  activeTimerId: null,
  selectedCategory: null,
  description: '',
  isLoading: false,

  // Kategori seç
  setSelectedCategory: (categoryId) => {
    set({ selectedCategory: categoryId })
  },

  // Açıklama ayarla
  setDescription: (description) => {
    set({ description })
  },

  // Aktif timer'ı yükle (sayfa yenilendiğinde)
  loadActiveTimer: async () => {
    try {
      const response = await fetch('/api/time-entries')
      const data = await response.json()
      
      if (data.activeTimer) {
        const startTime = new Date(data.activeTimer.startTime)
        const now = new Date()
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000)
        
        set({
          isRunning: true,
          currentTime: elapsed,
          startTime: startTime,
          activeTimerId: data.activeTimer.id,
          selectedCategory: data.activeTimer.categoryId,
          description: data.activeTimer.description || ''
        })
        
        console.log('✅ Aktif timer yüklendi:', data.activeTimer)
      }
    } catch (error) {
      console.error('Aktif timer yüklenemedi:', error)
    }
  },

  // Timer başlat
  startTimer: async (categoryId: string, description: string = '') => {
    const state = get()
    
    // Zaten çalışıyorsa uyar
    if (state.isRunning) {
      alert('Timer zaten çalışıyor!')
      return
    }

    if (!categoryId) {
      alert('Lütfen bir kategori seçin!')
      return
    }

    set({ isLoading: true })

    try {
      // İlk deneme - normal başlatma
      let response = await fetch('/api/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId,
          description,
          forceClose: false
        })
      })

      let data = await response.json()

      // Aktif timer varsa kullanıcıya sor
      if (response.status === 409 && data.requiresConfirmation) {
        const userConfirmed = confirm(
          data.error + '\n\nMevcut timer\'ı kapatıp yenisini başlatmak ister misiniz?'
        )
        
        if (!userConfirmed) {
          set({ isLoading: false })
          return
        }

        // Kullanıcı onayladı, forceClose ile tekrar dene
        response = await fetch('/api/time-entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryId,
            description,
            forceClose: true
          })
        })
        
        data = await response.json()
      }

      if (!response.ok) {
        throw new Error(data.error || 'Timer başlatılamadı')
      }

      // Timer başarıyla başlatıldı
      const now = new Date()
      set({
        isRunning: true,
        currentTime: 0,
        startTime: now,
        activeTimerId: data.timer.id,
        selectedCategory: categoryId,
        description: description,
        isLoading: false
      })

      console.log('✅ Timer başlatıldı:', data.timer)

      // Bildirim izni iste
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission()
      }

    } catch (error: any) {
      console.error('❌ Timer başlatma hatası:', error)
      alert(error.message || 'Timer başlatılamadı')
      set({ isLoading: false })
    }
  },

  // Timer durdur
  stopTimer: async () => {
    const state = get()
    
    if (!state.isRunning || !state.activeTimerId) {
      console.warn('Durdurulacak timer yok')
      return
    }

    set({ isLoading: true })

    try {
      const response = await fetch('/api/time-entries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timerId: state.activeTimerId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Timer durdurulamadı')
      }

      // Başarı bildirimi
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🎉 Çalışma Tamamlandı!', {
          body: data.message,
          icon: '/favicon.ico'
        })
      }

      // State sıfırla
      set({
        isRunning: false,
        currentTime: 0,
        startTime: null,
        activeTimerId: null,
        description: '',
        isLoading: false
      })

      console.log('✅ Timer durduruldu:', data)

      // Sayfayı yenile (istatistikleri güncellemek için)
      setTimeout(() => {
        window.location.reload()
      }, 1000)

    } catch (error: any) {
      console.error('❌ Timer durdurma hatası:', error)
      alert(error.message || 'Timer durdurulamadı')
      set({ isLoading: false })
    }
  },

  // Timer duraklat (sadece görsel, backend'e kaydetmez)
  pauseTimer: () => {
    set({ isRunning: false })
    console.log('⏸️ Timer duraklatıldı')
  },

  // Timer devam ettir
  resumeTimer: () => {
    const state = get()
    if (state.activeTimerId) {
      set({ isRunning: true })
      console.log('▶️ Timer devam ettiriliyor')
    }
  },

  // Timer sıfırla/iptal et
  resetTimer: async () => {
    const state = get()
    
    if (!state.activeTimerId) {
      set({
        isRunning: false,
        currentTime: 0,
        startTime: null,
        description: ''
      })
      return
    }

    const confirmReset = confirm('Timer iptal edilecek. Emin misiniz?')
    if (!confirmReset) return

    try {
      await fetch(`/api/time-entries?id=${state.activeTimerId}`, {
        method: 'DELETE'
      })
      
      console.log('🔄 Timer iptal edildi')
    } catch (error) {
      console.error('Timer iptal edilemedi:', error)
    }

    // State sıfırla
    set({
      isRunning: false,
      currentTime: 0,
      startTime: null,
      activeTimerId: null,
      description: ''
    })
  },

  // Her saniye sayacı artır
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

  const pad = (num: number) => num.toString().padStart(2, '0')
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`
}