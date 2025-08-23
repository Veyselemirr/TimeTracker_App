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
    description: 'Zaman takip et'
  },
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
    description: 'Genel bakış'
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
    <div className="fixed left-0 top-16 bottom-0 w-64 z-40">
      <div className="flex h-full flex-col gap-y-5 overflow-y-auto bg-gradient-to-b from-emerald-50 to-green-100 border-r border-emerald-200 px-6 pb-4">
        
        {/* Quick Stats */}
        <div className="mt-6">
          <div className="rounded-lg bg-white/70 backdrop-blur-sm border border-emerald-200 p-4 shadow-sm">
            <div className="text-sm text-emerald-700 mb-2 font-medium">
              Bugün
            </div>
            <div className="text-2xl font-bold text-gray-800">
              0s 0d 0sa
            </div>
            <div className="text-xs text-emerald-600 mb-2">
              Hedef: 8 saat
            </div>
            <div className="w-full bg-emerald-100 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full transition-all duration-300" style={{ width: '0%' }} />
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
                            ? 'bg-emerald-200/60 text-emerald-800 shadow-sm'
                            : 'text-gray-700 hover:bg-emerald-100/60 hover:text-emerald-800',
                          'group flex gap-x-3 rounded-lg p-3 text-sm leading-6 font-medium transition-all duration-200 hover:shadow-sm'
                        )}
                      >
                        <item.icon
                          className={cn(
                            isActive
                              ? 'text-emerald-700'
                              : 'text-gray-500 group-hover:text-emerald-700',
                            'h-5 w-5 shrink-0 transition-colors'
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{item.name}</span>
                          <span className="text-xs text-gray-500 font-normal">
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
                className="group -mx-2 flex gap-x-3 rounded-lg p-3 text-sm font-medium leading-6 text-gray-700 hover:bg-emerald-100/60 hover:text-emerald-800 transition-all duration-200"
              >
                <Settings className="h-5 w-5 shrink-0 text-gray-500 group-hover:text-emerald-700 transition-colors" />
                <span>Ayarlar</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}
