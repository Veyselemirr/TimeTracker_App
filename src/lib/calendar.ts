// src/types/calendar.ts

export interface DayData {
  date: string
  totalMinutes: number
  totalSessions: number
  categories: CategoryData[]
  sessions: SessionData[]
  achievements: AchievementData[]
  goalProgress: GoalProgressData[]
  intensity: number
  hasData: boolean
}

export interface CategoryData {
  name: string
  color: string
  minutes: number
  sessions: number
}

export interface SessionData {
  id: string
  startTime: string
  endTime: string
  duration: number
  description?: string
  category: {
    id: string
    name: string
    color: string
    icon?: string
  }
  points: number
}

export interface AchievementData {
  id: string
  name: string
  icon: string
  points: number
}

export interface GoalProgressData {
  goalId: string
  categoryName: string
  categoryColor: string
  targetMinutes: number
  currentMinutes: number
  percentage: number
  isCompleted: boolean
}

export interface CalendarStatistics {
  totalMinutes: number
  totalHours: number
  totalSessions: number
  activeDays: number
  totalDays: number
  avgDailyMinutes: number
  avgSessionLength: number
  categoryStats: CategoryStatData[]
  bestDays: BestDayData[]
  weeklyPattern: WeeklyPatternData[]
  completionRate: number
}

export interface CategoryStatData {
  name: string
  color: string
  minutes: number
  sessions: number
}

export interface BestDayData {
  date: string
  totalMinutes: number
  totalSessions: number
  hasData: boolean
}

export interface WeeklyPatternData {
  dayName: string
  avgMinutes: number
  dayCount: number
}

export interface StreakData {
  currentStreak: number
  longestStreak: number
  isStreakActive: boolean
}

export interface CalendarData {
  view: string
  dateRange: {
    start: string
    end: string
  }
  dailyData: DayData[]
  statistics: CalendarStatistics
  streakData: StreakData
  totalDays: number
  activeDays: number
}

export type ViewType = 'month' | 'week' | 'day' | 'year' | 'trend'

export interface CalendarViewProps {
  data: CalendarData
  onDayClick?: (dayData: DayData) => void
  getIntensityColor?: (intensity: number) => string
  formatDuration?: (minutes: number) => string
}

export interface DayDetailModalProps {
  dayData: DayData
  isOpen: boolean
  onClose: () => void
  formatDuration: (minutes: number) => string
}

// API Response types
export interface CalendarApiResponse {
  success: boolean
  data?: CalendarData
  error?: string
}

// Utility types for calendar navigation
export interface DateRange {
  start: Date
  end: Date
}

export interface CalendarNavigation {
  currentDate: Date
  currentView: ViewType
  navigateDate: (direction: 'prev' | 'next') => void
  goToToday: () => void
  setView: (view: ViewType) => void
}