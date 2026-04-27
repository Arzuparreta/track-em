import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcrypt'
import { prisma } from './db'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // For MVP: Check credentials against hardcoded values from env
        // In production, you would use a proper User model
        const userEmail = process.env.APP_USER_EMAIL
        const userPasswordHash = process.env.APP_USER_PASSWORD_HASH

        if (credentials.email !== userEmail) {
          return null
        }

        const isValid = await compare(credentials.password, userPasswordHash || '')

        if (!isValid) {
          return null
        }

        return {
          id: '1',
          email: credentials.email,
          name: 'Music Manager',
        }
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
  },
}
