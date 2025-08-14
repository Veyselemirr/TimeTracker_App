import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Kategorileri getir
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'temp-user' // Geçici user ID

    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { userId: userId },
          { isDefault: true }
        ]
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
    const body = await request.json()
    const { name, description, color, icon, userId = 'temp-user' } = body

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
        description,
        color: color || '#3B82F6',
        icon,
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