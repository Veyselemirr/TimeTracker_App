// middleware.ts (projenin root klasöründe, src dışında)
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const pathname = req.nextUrl.pathname

  // Public sayfalar
  const isPublicPage = pathname === '/' || pathname.startsWith('/auth')
  
  // API rotaları her zaman erişilebilir
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  // Giriş yapmış kullanıcı auth sayfalarına girmeye çalışırsa
  if (isLoggedIn && pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/timer', req.url))
  }

  // Giriş yapmamış kullanıcı korumalı sayfalara girmeye çalışırsa
  if (!isLoggedIn && !isPublicPage) {
    const callbackUrl = encodeURIComponent(pathname)
    return NextResponse.redirect(new URL(`/auth/signin?callbackUrl=${callbackUrl}`, req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
}