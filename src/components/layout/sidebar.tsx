'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Timer,
  BarChart3,
  Folder,
  Trophy,
  Settings,
  Calendar,
  Target,
  Users
} from 'lucide-react'

const navigation = [
  {
    name: 'Timer',
    href: '/',
    icon: Timer,
    description: 'Zaman Takip Et'
  },
{
    name: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
    description: 'Genel Bakış'
  },

  {
    name: 'Raporlar',
    href: '/reports',
    icon: BarChart3,
    description: 'Çalışma istatistikleri'
  },
  {
    name: 'Kategoriler',
    href: '/categories',
    icon: Folder,
    description: 'Çalışma konuları'
  },
  {
    name: 'Rozetler',
    href: '/achievements',
    icon: Trophy,
    description: 'Kazanılan başarımlar'
  },
  {
    name: 'Takvim',
    href: '/calendar',
    icon: Calendar,
    description: 'Günlük planlama'
  },
  {
    name: 'Hedefler',
    href: '/goals',
    icon: Target,
    description: 'Günlük/haftalık hedefler'
  },
  {
    name: 'Liderlik Tablosu',
    href: '/leaderboard',
    icon: Users,
    description: 'En çok çalışanlar'
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:pt-16">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 px-6 pb-4">
          
          {/* Quick Stats */}
          <div className="mt-6">
            <div className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Bugün
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                0s 0d 0sa
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Hedef: 8 saat
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }} />
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            isActive
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white',
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors'
                          )}
                        >
                          <item.icon
                            className={cn(
                              isActive
                                ? 'text-blue-700 dark:text-blue-300'
                                : 'text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white',
                              'h-5 w-5 shrink-0'
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{item.name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                              {item.description}
                            </span>
                          </div>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>

              {/* Alt kısım - Ayarlar */}
              <li className="mt-auto">
                <Link
                  href="/settings"
                  className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                >
                  <Settings className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                  Ayarlar
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  )
}