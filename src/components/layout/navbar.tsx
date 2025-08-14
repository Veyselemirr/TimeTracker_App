'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Timer,
  Bell,
  Settings,
  User,
  LogOut,
  Trophy,
  Menu,
  X,
  LogIn
} from 'lucide-react'
import { useTimerStore, formatTime } from '@/store/timer-store'

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isRunning, currentTime } = useTimerStore()
  const { data: session, status } = useSession()

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-emerald-50 to-green-50 backdrop-blur-md border-b border-emerald-200 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Sol Taraf - Logo ve Hamburger */}
          <div className="flex items-center gap-4">
            {/* Mobile Hamburger */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg p-2 shadow-sm">
                <Timer className="h-6 w-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-800">
                  TimeTracker Pro
                </h1>
              </div>
            </Link>
          </div>

          {/* Orta - Aktif Timer Durumu */}
          {isRunning && session && (
            <div className="hidden md:flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-green-700">
                Çalışıyor: {formatTime(currentTime)}
              </span>
            </div>
          )}

          {/* Sağ Taraf - Authentication */}
          <div className="flex items-center gap-3">
            
            {status === 'loading' ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            ) : session ? (
              <>
                {/* Puan Badge */}
                <Badge variant="secondary" className="hidden sm:flex items-center gap-1 bg-emerald-100 text-emerald-700">
                  <Trophy className="h-3 w-3" />
                  1250 Puan
                </Badge>

                {/* Bildirimler */}
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    2
                  </span>
                </Button>

                {/* Profil Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
                        <AvatarFallback className="bg-emerald-100 text-emerald-700">
                          {session.user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{session.user?.name}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {session.user?.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Ayarlar
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Çıkış Yap
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              /* Giriş yapılmamış */
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/auth/signin">
                    <LogIn className="mr-2 h-4 w-4" />
                    Giriş Yap
                  </Link>
                </Button>
                <Button asChild className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700">
                  <Link href="/auth/signup">
                    Kayıt Ol
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-emerald-200 bg-white/95 backdrop-blur-sm">
          <div className="px-4 py-2 space-y-1">
            {isRunning && session && (
              <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-green-700">
                  Çalışıyor: {formatTime(currentTime)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
