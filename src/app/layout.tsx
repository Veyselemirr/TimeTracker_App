import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/navbar'
import { Sidebar } from '@/components/layout/sidebar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TimeTracker Pro - Zaman Takip Uygulaması',
  description: 'Çalışma zamanınızı takip edin, hedeflerinize ulaşın ve rozetler kazanın.',
  keywords: ['zaman takibi', 'productivity', 'çalışma', 'timer'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          {/* Üst Navigasyon */}
          <Navbar />
          
          <div className="flex">
            {/* Sol Sidebar */}
            <Sidebar />
            
            {/* Ana İçerik */}
            <main className="flex-1 p-6 lg:ml-64 mt-16">
              <div className="max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}