// src/app/api/categories/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

// GET - Kategorileri getir
export async function GET(request: NextRequest) {
  try {
    // Session'dan user ID al
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    const categories = await prisma.category.findMany({
      where: {
        userId: userId
      },
      orderBy: [
        { isDefault: 'desc' }, // Default kategoriler önce
        { createdAt: 'asc' }
      ]
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Categories fetch error:', error)
    return NextResponse.json(
      { error: 'Kategoriler yüklenirken hata oluştu' },
      { status: 500 }
    )
  }
}

// POST - Yeni kategori oluştur
export async function POST(request: NextRequest) {
  try {
    // Session kontrolü
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const body = await request.json()
    const { name, description, color, icon } = body

    // Validasyon
    if (!name) {
      return NextResponse.json(
        { error: 'Kategori adı gerekli' },
        { status: 400 }
      )
    }

    // Aynı isimde kategori var mı kontrol et
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: name,
        userId: userId
      }
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Bu isimde bir kategori zaten mevcut' },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name,
        description: description || '',
        color: color || '#3B82F6',
        icon: icon || null,
        userId,
        isDefault: false
      }
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Category creation error:', error)
    return NextResponse.json(
      { error: 'Kategori oluşturulurken hata oluştu' },
      { status: 500 }
    )
  }
}

// DELETE - Kategori sil (sadece default olmayan)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Oturum açmanız gerekiyor' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('id')

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Kategori ID gerekli' },
        { status: 400 }
      )
    }

    // Kategoriyi kontrol et
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        userId: session.user.id
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Kategori bulunamadı' },
        { status: 404 }
      )
    }

    if (category.isDefault) {
      return NextResponse.json(
        { error: 'Default kategoriler silinemez' },
        { status: 400 }
      )
    }

    // Kategoriyi sil
    await prisma.category.delete({
      where: { id: categoryId }
    })

    return NextResponse.json({ message: 'Kategori silindi' })
  } catch (error) {
    console.error('Category deletion error:', error)
    return NextResponse.json(
      { error: 'Kategori silinirken hata oluştu' },
      { status: 500 }
    )
  }
}