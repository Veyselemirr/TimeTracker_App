import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      )
    }

    const deleted = await prisma.timeEntry.deleteMany({
      where: {
        userId: session.user.id,
        endTime: null
      }
    })

    console.log(`🧹 ${deleted.count} aktif timer temizlendi`)

    return NextResponse.json({
      success: true,
      message: `${deleted.count} aktif timer temizlendi`,
      deletedCount: deleted.count
    })
  } catch (error) {
    console.error('Force cleanup error:', error)
    return NextResponse.json(
      { error: 'Temizleme başarısız' },
      { status: 500 }
    )
  }
}