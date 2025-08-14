import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Önce test user'ı oluştur
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      id: 'temp-user',
      email: 'test@example.com',
      username: 'testuser',
      name: 'Test User',
      password: 'hashedpassword' // Normalde bcrypt ile hash'lenir
    }
  })
  console.log('✅ Created test user')

  // Default kategorileri oluştur
  const defaultCategories = [
    {
      name: 'Yazılım',
      description: 'Programlama, kodlama ve yazılım geliştirme',
      color: '#10b981', // emerald-500
      icon: 'Code',
      isDefault: true,
      userId: 'temp-user'
    },
    {
      name: 'Matematik',
      description: 'Matematik çalışması ve problem çözme',
      color: '#3b82f6', // blue-500
      icon: 'Calculator',
      isDefault: true,
      userId: 'temp-user'
    },
    {
      name: 'Kitap Okuma',
      description: 'Kitap okuma ve araştırma',
      color: '#8b5cf6', // purple-500
      icon: 'BookOpen',
      isDefault: true,
      userId: 'temp-user'
    },
    {
      name: 'Egzersiz',
      description: 'Spor ve fiziksel aktiviteler',
      color: '#f97316', // orange-500
      icon: 'Dumbbell',
      isDefault: true,
      userId: 'temp-user'
    },
    {
      name: 'Müzik',
      description: 'Müzik çalışması ve enstrüman çalma',
      color: '#ec4899', // pink-500
      icon: 'Music',
      isDefault: true,
      userId: 'temp-user'
    },
    {
      name: 'Tasarım',
      description: 'Grafik tasarım ve yaratıcı çalışmalar',
      color: '#6366f1', // indigo-500
      icon: 'Palette',
      isDefault: true,
      userId: 'temp-user'
    }
  ]

  // Kategorileri upsert et (varsa güncelle, yoksa oluştur)
  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: {
        name_userId: {
          name: category.name,
          userId: category.userId
        }
      },
      update: {
        description: category.description,
        color: category.color,
        icon: category.icon
      },
      create: category
    })
    
    console.log(`✅ Created/Updated category: ${category.name}`)
  }

  // Sample achievements
  const achievements = [
    {
      name: 'İlk Adım',
      description: 'İlk timer seansını tamamla',
      icon: 'Star',
      condition: JSON.stringify({ type: 'first_session' }),
      points: 10
    },
    {
      name: 'Günlük Kahraman',
      description: 'Bir günde 8 saat çalış',
      icon: 'Trophy',
      condition: JSON.stringify({ type: 'daily_hours', target: 480 }),
      points: 50
    },
    {
      name: 'Haftalık Şampiyon',
      description: 'Bir haftada 40 saat çalış',
      icon: 'Award',
      condition: JSON.stringify({ type: 'weekly_hours', target: 2400 }),
      points: 100
    }
  ]

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { name: achievement.name },
      update: achievement,
      create: achievement
    })
    
    console.log(`🏆 Created/Updated achievement: ${achievement.name}`)
  }

  console.log('✅ Seeding completed!')
}

// Ana fonksiyonu çağır ve hataları yakala
main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })