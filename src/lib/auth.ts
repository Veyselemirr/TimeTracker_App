// src/lib/auth.ts
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
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Type guard ve validation
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Email ve password'ü string olarak cast et
        const email = String(credentials.email).toLowerCase()
        const password = String(credentials.password)

        try {
          const user = await prisma.user.findUnique({
            where: { email }
          })

          if (!user || !user.password) {
            console.log("User not found:", email)
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            password,
            user.password
          )

          if (!isPasswordValid) {
            console.log("Invalid password for:", email)
            return null
          }

          // Return user object for JWT
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
    maxAge: 30 * 24 * 60 * 60,
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.username = user.username
      }

      if (trigger === "update" && session) {
        token = { ...token, ...session }
      }

      return token
    },

    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string || null
        session.user.username = token.username as string
      }
      return session
    },

    async signIn() {
      return true
    }
  },

  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  trustHost: true,
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)