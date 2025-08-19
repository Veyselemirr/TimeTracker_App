// src/lib/achievements.ts
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: 'streak' | 'time' | 'goal' | 'performance' | 'total' | 'category'
  points: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  condition: {
    type: string
    value: number
    period?: string
    timeRange?: string[]
  }
}

export const ACHIEVEMENTS: Achievement[] = [
  // STREAK BAŞARIMLARI
  {
    id: 'streak_beginner',
    name: 'Başlangıç Serisi',
    description: '3 gün üst üste çalışma yapın',
    icon: 'Flame',
    category: 'streak',
    points: 50,
    rarity: 'common',
    condition: { type: 'consecutive_days', value: 3 }
  },
  {
    id: 'streak_warrior',
    name: 'Haftalık Savaşçı',
    description: '7 gün üst üste çalışma yapın',
    icon: 'Sword',
    category: 'streak',
    points: 150,
    rarity: 'rare',
    condition: { type: 'consecutive_days', value: 7 }
  },
  {
    id: 'streak_king',
    name: 'Ay Kralı',
    description: '30 gün üst üste çalışma yapın',
    icon: 'Crown',
    category: 'streak',
    points: 500,
    rarity: 'epic',
    condition: { type: 'consecutive_days', value: 30 }
  },
  {
    id: 'streak_legend',
    name: 'Efsane',
    description: '100 gün üst üste çalışma yapın',
    icon: 'Star',
    category: 'streak',
    points: 1500,
    rarity: 'legendary',
    condition: { type: 'consecutive_days', value: 100 }
  },
  {
    id: 'streak_titan',
    name: 'Titan',
    description: '365 gün üst üste çalışma yapın',
    icon: 'Trophy',
    category: 'streak',
    points: 5000,
    rarity: 'legendary',
    condition: { type: 'consecutive_days', value: 365 }
  },

  // SÜRE BAŞARIMLARI
  {
    id: 'time_first_step',
    name: 'İlk Adım',
    description: 'İlk 30 dakika çalışma tamamlayın',
    icon: 'Clock',
    category: 'time',
    points: 25,
    rarity: 'common',
    condition: { type: 'daily_minutes', value: 30 }
  },
  {
    id: 'time_hourly_hero',
    name: 'Saatlik Kahraman',
    description: 'Bir günde 1 saat çalışın',
    icon: 'Clock3',
    category: 'time',
    points: 100,
    rarity: 'common',
    condition: { type: 'daily_minutes', value: 60 }
  },
  {
    id: 'time_marathon',
    name: 'Maraton Runner',
    description: 'Bir günde 3 saat çalışın',
    icon: 'Timer',
    category: 'time',
    points: 300,
    rarity: 'rare',
    condition: { type: 'daily_minutes', value: 180 }
  },
  {
    id: 'time_iron_man',
    name: 'Demir Adam',
    description: 'Bir günde 5 saat çalışın',
    icon: 'Shield',
    category: 'time',
    points: 500,
    rarity: 'epic',
    condition: { type: 'daily_minutes', value: 300 }
  },
  {
    id: 'time_super_human',
    name: 'Süper İnsan',
    description: 'Bir günde 8 saat çalışın',
    icon: 'Zap',
    category: 'time',
    points: 800,
    rarity: 'legendary',
    condition: { type: 'daily_minutes', value: 480 }
  },

  // HEDEF BAŞARIMLARI
  {
    id: 'goal_hunter',
    name: 'Hedef Avcısı',
    description: 'İlk hedefinizi tamamlayın',
    icon: 'Target',
    category: 'goal',
    points: 75,
    rarity: 'common',
    condition: { type: 'goals_completed', value: 1 }
  },
  {
    id: 'goal_perfect_shot',
    name: 'Tam İsabet',
    description: '5 hedef tamamlayın',
    icon: 'Crosshair',
    category: 'goal',
    points: 200,
    rarity: 'rare',
    condition: { type: 'goals_completed', value: 5 }
  },
  {
    id: 'goal_perfectionist',
    name: 'Mükemmeliyetçi',
    description: '10 hedef tamamlayın',
    icon: 'Award',
    category: 'goal',
    points: 400,
    rarity: 'epic',
    condition: { type: 'goals_completed', value: 10 }
  },
  {
    id: 'goal_master',
    name: 'Hedef Ustası',
    description: 'Bir ayda 25 hedef tamamlayın',
    icon: 'Trophy',
    category: 'goal',
    points: 1000,
    rarity: 'legendary',
    condition: { type: 'monthly_goals_completed', value: 25 }
  },

  // PERFORMANS BAŞARIMLARI
  {
    id: 'perf_early_bird',
    name: 'Erken Kuş',
    description: 'Sabah 6-9 arasında çalışın',
    icon: 'Sunrise',
    category: 'performance',
    points: 100,
    rarity: 'rare',
    condition: { type: 'time_range_work', value: 1, timeRange: ['06:00', '09:00'] }
  },
  {
    id: 'perf_night_owl',
    name: 'Gece Baykuşu',
    description: 'Gece 22-02 arasında çalışın',
    icon: 'Moon',
    category: 'performance',
    points: 100,
    rarity: 'rare',
    condition: { type: 'time_range_work', value: 1, timeRange: ['22:00', '02:00'] }
  },
  {
    id: 'perf_weekend_warrior',
    name: 'Hafta Sonu Savaşçısı',
    description: 'Hafta sonu çalışın',
    icon: 'Calendar',
    category: 'performance',
    points: 150,
    rarity: 'rare',
    condition: { type: 'weekend_work', value: 1 }
  },
  {
    id: 'perf_deep_focus',
    name: 'Süper Konsantrasyon',
    description: '2 saat aralıksız çalışın',
    icon: 'Focus',
    category: 'performance',
    points: 200,
    rarity: 'epic',
    condition: { type: 'continuous_work', value: 120 }
  },

  // TOPLAM İSTATİSTİK BAŞARIMLARI
  {
    id: 'total_first_10',
    name: 'İlk 10 Saat',
    description: 'Toplam 10 saat çalışma tamamlayın',
    icon: 'Clock4',
    category: 'total',
    points: 200,
    rarity: 'common',
    condition: { type: 'total_hours', value: 10 }
  },
  {
    id: 'total_100_club',
    name: '100 Saat Kulübü',
    description: 'Toplam 100 saat çalışma tamamlayın',
    icon: 'Medal',
    category: 'total',
    points: 1000,
    rarity: 'rare',
    condition: { type: 'total_hours', value: 100 }
  },
  {
    id: 'total_500_legend',
    name: '500 Saat Efsanesi',
    description: 'Toplam 500 saat çalışma tamamlayın',
    icon: 'Award',
    category: 'total',
    points: 3000,
    rarity: 'epic',
    condition: { type: 'total_hours', value: 500 }
  },
  {
    id: 'total_1000_titan',
    name: '1000 Saat Titanı',
    description: 'Toplam 1000 saat çalışma tamamlayın',
    icon: 'Crown',
    category: 'total',
    points: 10000,
    rarity: 'legendary',
    condition: { type: 'total_hours', value: 1000 }
  },

  // KATEGORİ BAŞARIMLARI
  {
    id: 'cat_expert',
    name: 'Uzman',
    description: 'Bir kategoride 50 saat çalışın',
    icon: 'BookOpen',
    category: 'category',
    points: 500,
    rarity: 'rare',
    condition: { type: 'category_hours', value: 50 }
  },
  {
    id: 'cat_master',
    name: 'Master',
    description: 'Bir kategoride 100 saat çalışın',
    icon: 'GraduationCap',
    category: 'category',
    points: 1000,
    rarity: 'epic',
    condition: { type: 'category_hours', value: 100 }
  },
  {
    id: 'cat_versatile',
    name: 'Çok Yönlü',
    description: '5 farklı kategoride çalışın',
    icon: 'Shuffle',
    category: 'category',
    points: 300,
    rarity: 'rare',
    condition: { type: 'unique_categories', value: 5 }
  }
]

// Rarity renkleri
export const RARITY_COLORS = {
  common: '#10B981',   // Yeşil
  rare: '#3B82F6',     // Mavi  
  epic: '#8B5CF6',     // Mor
  legendary: '#F59E0B' // Altın
}

// Rarity Türkçe isimleri
export const RARITY_NAMES = {
  common: 'Yaygın',
  rare: 'Nadir',
  epic: 'Epik',
  legendary: 'Efsanevi'
}

// Kategori isimleri
export const CATEGORY_NAMES = {
  streak: 'Seri',
  time: 'Süre',
  goal: 'Hedef',
  performance: 'Performans',
  total: 'Toplam',
  category: 'Kategori'
}

// Achievement kontrolü için yardımcı fonksiyonlar
export class AchievementChecker {
  static checkStreak(consecutiveDays: number): Achievement[] {
    return ACHIEVEMENTS.filter(achievement => 
      achievement.condition.type === 'consecutive_days' && 
      consecutiveDays >= achievement.condition.value
    )
  }

  static checkDailyTime(minutes: number): Achievement[] {
    return ACHIEVEMENTS.filter(achievement => 
      achievement.condition.type === 'daily_minutes' && 
      minutes >= achievement.condition.value
    )
  }

  static checkGoalsCompleted(goalCount: number): Achievement[] {
    return ACHIEVEMENTS.filter(achievement => 
      achievement.condition.type === 'goals_completed' && 
      goalCount >= achievement.condition.value
    )
  }

  static checkTotalHours(hours: number): Achievement[] {
    return ACHIEVEMENTS.filter(achievement => 
      achievement.condition.type === 'total_hours' && 
      hours >= achievement.condition.value
    )
  }

  static checkTimeRange(startTime: string, endTime: string): Achievement[] {
    const achievements: Achievement[] = []
    
    ACHIEVEMENTS.forEach(achievement => {
      if (achievement.condition.type === 'time_range_work' && achievement.condition.timeRange) {
        const [rangeStart, rangeEnd] = achievement.condition.timeRange
        
        // Saat kontrolü yapılacak (basit kontrol)
        const startHour = parseInt(startTime.split(':')[0])
        const endHour = parseInt(endTime.split(':')[0])
        const rangeStartHour = parseInt(rangeStart.split(':')[0])
        const rangeEndHour = parseInt(rangeEnd.split(':')[0])
        
        if (startHour >= rangeStartHour && endHour <= rangeEndHour) {
          achievements.push(achievement)
        }
      }
    })
    
    return achievements
  }

  static checkWeekendWork(isWeekend: boolean): Achievement[] {
    if (!isWeekend) return []
    
    return ACHIEVEMENTS.filter(achievement => 
      achievement.condition.type === 'weekend_work'
    )
  }

  static checkCategoryHours(categoryHours: number): Achievement[] {
    return ACHIEVEMENTS.filter(achievement => 
      achievement.condition.type === 'category_hours' && 
      categoryHours >= achievement.condition.value
    )
  }

  static checkUniqueCategories(categoryCount: number): Achievement[] {
    return ACHIEVEMENTS.filter(achievement => 
      achievement.condition.type === 'unique_categories' && 
      categoryCount >= achievement.condition.value
    )
  }
}