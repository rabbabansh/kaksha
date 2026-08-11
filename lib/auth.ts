/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextAuthOptions, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";

import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "test@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const prisma = (await import('@/lib/prisma')).default;
        let dbUser = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!dbUser) {
           dbUser = await prisma.user.create({
             data: { email: credentials.email, name: "Test User" }
           });
        }
        return { id: dbUser.id, email: dbUser.email, name: dbUser.name };
      }
    }),
  ],
  pages: {
    signIn: '/login'
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          if (!user.email) return false;
          let dbUser = await prisma.user.findUnique({ where: { email: user.email } });
          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || (profile as { name?: string } | undefined)?.name || null,
                image: user.image || (profile as { picture?: string } | undefined)?.picture || null,
              },
            });
          } else {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: {
                name: user.name || dbUser.name,
                image: user.image || dbUser.image,
              },
            });
          }
          user.id = dbUser.id;
          return true;
        } catch (error) {
          console.error("[NextAuth] ERROR in signIn callback:", error);
          return true; 
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        return token;
      }
      if (token.email && !token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
          });
          if (dbUser) {
            token.id = dbUser.id;
            token.name = dbUser.name;
          }
        } catch (error) {
          console.error("[NextAuth] Error fetching user from database:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        if (!session.user.email && token.email) session.user.email = token.email as string;
        if (!session.user.name && token.name) session.user.name = token.name as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch (e) {
        console.error("[NextAuth] Error parsing redirect URL:", e);
      }
      return baseUrl;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development",
  debug: process.env.NODE_ENV === "development",
  useSecureCookies: process.env.NODE_ENV === "production",
};

export async function getAuthSession() {
  return await getServerSession(authOptions);
}

export async function getUserProfile() {
  const session = await getAuthSession();
  if (!session?.user?.email) return null;
  const prisma = (await import('@/lib/prisma')).default;
  return await prisma.userProfile.findFirst({
    where: { user: { email: session.user.email } }
  });
}
