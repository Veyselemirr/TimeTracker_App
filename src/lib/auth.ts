import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import type { NextAuthConfig } from "next-auth"

const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Email/Password giriş
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Kullanıcıyı bul
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string }
          })

          if (!user || !user.password) {
            return null
          }

          // Şifreyi kontrol et
          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            username: user.username,
          }
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    }),

    // Google OAuth (opsiyonel)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET 
      ? [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        })]
      : []
    ),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 gün
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.email = user.email
        token.name = user.name
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
      }
      return session
    },

    async signIn({ user, account }) {
      // Google ile giriş yapıldığında kategorileri oluştur
      if (account?.provider === "google") {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })

          // Yeni Google kullanıcısı ise
          if (!existingUser) {
            // Username oluştur
            const username = user.email!.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
            let finalUsername = username
            let counter = 1
            
            while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
              finalUsername = `${username}${counter}`
              counter++
            }

            // User güncelle ve kategoriler ekle
            const updatedUser = await prisma.user.update({
              where: { email: user.email! },
              data: { 
                username: finalUsername,
                password: await bcrypt.hash(Math.random().toString(36), 12)
              }
            })

            // Default kategorileri oluştur
            const defaultCategories = [
              { name: 'Yazılım', color: '#10b981', icon: 'Code', description: 'Programlama ve yazılım geliştirme' },
              { name: 'Matematik', color: '#3b82f6', icon: 'Calculator', description: 'Matematik çalışması' },
              { name: 'Kitap Okuma', color: '#8b5cf6', icon: 'BookOpen', description: 'Kitap okuma' },
              { name: 'Egzersiz', color: '#f97316', icon: 'Dumbbell', description: 'Spor ve egzersiz' },
              { name: 'Müzik', color: '#ec4899', icon: 'Music', description: 'Müzik çalışması' },
              { name: 'Tasarım', color: '#6366f1', icon: 'Palette', description: 'Tasarım çalışmaları' },
            ]

            await prisma.category.createMany({
              data: defaultCategories.map(cat => ({
                ...cat,
                userId: updatedUser.id,
                isDefault: true
              }))
            })
          }
        } catch (error) {
          console.error("Google sign in error:", error)
          return false
        }
      }
      return true
    }
  },

  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
