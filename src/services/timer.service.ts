import { prisma } from '@/lib/prisma'

export class TimerService {
  /**
   * Kullanıcının aktif timer'ını kontrol et
   * Mantık: Her kullanıcının aynı anda sadece 1 aktif timer'ı olabilir
   */
  static async checkActiveTimer(userId: string) {
    const activeTimer = await prisma.timeEntry.findFirst({
      where: {
        userId,
        endTime: null
      },
      include: {
        category: true
      }
    })

    return activeTimer
  }

  /**
   * Eski/yarım kalmış timer'ları temizle
   * Mantık: 24 saatten eski ve hala açık olan timer'lar muhtemelen unutulmuş
   */
  static async cleanupOldTimers(userId: string) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const oldTimers = await prisma.timeEntry.findMany({
      where: {
        userId,
        endTime: null,
        startTime: {
          lt: yesterday
        }
      }
    })

    for (const timer of oldTimers) {
      const duration = Math.floor((Date.now() - timer.startTime.getTime()) / 1000)
      
      const cappedDuration = Math.min(duration, 28800)
      const points = Math.floor(cappedDuration / 60)

      await prisma.timeEntry.update({
        where: { id: timer.id },
        data: {
          endTime: new Date(timer.startTime.getTime() + cappedDuration * 1000),
          duration: cappedDuration,
          points,
          description: (timer.description || '') + ' (Otomatik kapatıldı)'
        }
      })
    }

    return oldTimers.length
  }

  /**
   * Yeni timer başlat
   * Mantık: Önce aktif timer var mı kontrol et, varsa hata ver veya kapat
   */
  static async startTimer(
    userId: string, 
    categoryId: string, 
    description?: string,
    forceClose: boolean = false
  ) {
    await this.cleanupOldTimers(userId)

    const activeTimer = await this.checkActiveTimer(userId)
    
    if (activeTimer) {
      if (!forceClose) {
        throw new Error(
          `Aktif bir timer var: ${activeTimer.category?.name}. ` +
          `Başlangıç: ${activeTimer.startTime.toLocaleTimeString('tr-TR')}`
        )
      } else {
        await this.stopTimer(userId, activeTimer.id)
      }
    }

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId
      }
    })

    if (!category) {
      throw new Error('Geçersiz kategori seçimi')
    }

    const newTimer = await prisma.timeEntry.create({
      data: {
        userId,
        categoryId,
        startTime: new Date(),
        description: description || '',
        duration: 0,
        points: 0
      },
      include: {
        category: true
      }
    })

    console.log('Timer başlatıldı:', {
      id: newTimer.id,
      category: newTimer.category?.name,
      startTime: newTimer.startTime
    })

    return newTimer
  }

  /**
   * Timer'ı durdur
   * Mantık: Duration ve points hesapla, endTime kaydet
   */
  static async stopTimer(userId: string, timerId?: string) {
    let timer
    if (timerId) {
      timer = await prisma.timeEntry.findFirst({
        where: {
          id: timerId,
          userId,
          endTime: null
        }
      })
    } else {
      timer = await this.checkActiveTimer(userId)
    }

    if (!timer) {
      throw new Error('Durdurulacak aktif timer bulunamadı')
    }

    const now = new Date()
    const duration = Math.floor((now.getTime() - timer.startTime.getTime()) / 1000)
    const points = Math.floor(duration / 60)

    const updatedTimer = await prisma.timeEntry.update({
      where: { id: timer.id },
      data: {
        endTime: now,
        duration,
        points
      },
      include: {
        category: true
      }
    })

    console.log('Timer durduruldu:', {
      id: updatedTimer.id,
      category: updatedTimer.category?.name,
      duration: `${Math.floor(duration / 60)} dakika`,
      points
    })

    return updatedTimer
  }

  /**
   * Kullanıcının tüm aktif timer'larını zorla kapat
   * Mantık: Logout veya cleanup için kullanılır
   */
  static async forceCloseAllTimers(userId: string) {
    const activeTimers = await prisma.timeEntry.findMany({
      where: {
        userId,
        endTime: null
      }
    })

    const results = []
    for (const timer of activeTimers) {
      try {
        const closed = await this.stopTimer(userId, timer.id)
        results.push(closed)
      } catch (error) {
        console.error(`Timer ${timer.id} kapatılamadı:`, error)
      }
    }

    return results
  }
}