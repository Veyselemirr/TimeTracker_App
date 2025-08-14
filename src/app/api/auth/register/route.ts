// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, username, email, password } = body

    // Validasyon
    if (!name || !username || !email || !password) {
      return NextResponse.json(
        { error: 'Tüm alanlar gerekli' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Şifre en az 6 karakter olmalı' },
        { status: 400 }
      )
    }

    // Username validasyon
    const usernameRegex = /^[a-zA-Z0-9_]+$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir' },
        { status: 400 }
      )
    }

    // Email kontrol - büyük/küçük harf duyarsız
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUserByEmail) {
      return NextResponse.json(
        { error: 'Bu email adresi zaten kullanılıyor' },
        { status: 400 }
      )
    }

    // Username kontrol - büyük/küçük harf duyarsız
    const existingUserByUsername = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    })

    if (existingUserByUsername) {
      return NextResponse.json(
        { error: 'Bu kullanıcı adı zaten alınmış' },
        { status: 400 }
      )
    }

    // Şifreyi hash'le
    const hashedPassword = await bcrypt.hash(password, 12)

    // Transaction ile kullanıcı ve kategorileri oluştur
    const result = await prisma.$transaction(async (tx) => {
      // Kullanıcı oluştur
      const user = await tx.user.create({
        data: {
          name,
          username: username.toLowerCase(),
          email: email.toLowerCase(),
          password: hashedPassword,
        }
      })

      // Default kategorileri oluştur
      const defaultCategories = [
        { 
          name: 'Yazılım', 
          color: '#10b981', 
          icon: 'Code',
          description: 'Programlama, kodlama ve yazılım geliştirme'
        },
        { 
          name: 'Matematik', 
          color: '#3b82f6', 
          icon: 'Calculator',
          description: 'Matematik çalışması ve problem çözme'
        },
        { 
          name: 'Kitap Okuma', 
          color: '#8b5cf6', 
          icon: 'BookOpen',
          description: 'Kitap okuma ve araştırma'
        },
        { 
          name: 'Egzersiz', 
          color: '#f97316', 
          icon: 'Dumbbell',
          description: 'Spor ve fiziksel aktiviteler'
        },
        { 
          name: 'Müzik', 
          color: '#ec4899', 
          icon: 'Music',
          description: 'Müzik çalışması ve enstrüman çalma'
        },
        { 
          name: 'Tasarım', 
          color: '#6366f1', 
          icon: 'Palette',
          description: 'Grafik tasarım ve yaratıcı çalışmalar'
        },
      ]

      // Kategorileri toplu oluştur
      await tx.category.createMany({
        data: defaultCategories.map(category => ({
          ...category,
          userId: user.id,
          isDefault: true,
        }))
      })

      return user
    })

    // Şifreyi response'dan çıkar
    const { password: _, ...userWithoutPassword } = result

    return NextResponse.json(
      { 
        message: 'Kullanıcı başarıyla oluşturuldu',
        user: userWithoutPassword 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Registration error:', error)
    
    // Prisma hata kodlarını kontrol et
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Bu email veya kullanıcı adı zaten kullanılıyor' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Kayıt sırasında bir hata oluştu' },
      { status: 500 }
    )
  }
}