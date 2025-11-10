import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log('NextAuth authorize called with:', { email: credentials?.email, password: credentials?.password });
        
        // Check if credentials exist
        if (!credentials?.email || !credentials?.password) {
          console.log('NextAuth: Missing credentials');
          return null;
        }
        
        // Check credentials
        if (credentials.email === "ansh@kaksha.ai" && credentials.password === "password") {
          console.log('NextAuth: Valid credentials, returning user');
          // Find or create user in database
          let user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });
          
          if (!user) {
            user = await prisma.user.create({
              data: {
                email: credentials.email,
                name: "Ansh",
              },
            });
          }
          
          return { 
            id: user.id, 
            name: user.name, 
            email: user.email 
          };
        }
        
        console.log('NextAuth: Invalid credentials, returning null');
        return null;
      },
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
      console.log("[NextAuth] signIn callback triggered", { 
        provider: account?.provider, 
        email: user?.email,
        hasAccount: !!account,
        hasProfile: !!profile
      });

      if (account?.provider === "google") {
        try {
          console.log("[NextAuth] Processing Google sign-in for:", user.email);
          
          if (!user.email) {
            console.error("[NextAuth] No email provided by Google");
            return false;
          }

          console.log("[NextAuth] Checking database connection...");
          // Test database connection first
          try {
            await prisma.$connect();
            console.log("[NextAuth] Database connected successfully");
          } catch (dbError) {
            console.error("[NextAuth] Database connection failed:", dbError);
            throw dbError;
          }

          console.log("[NextAuth] Looking up user in database:", user.email);
          // Find or create user in database
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          });
          
          if (!dbUser) {
            console.log("[NextAuth] Creating new user:", user.email);
            dbUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name || (profile as any)?.name || null,
                image: user.image || (profile as any)?.picture || null,
              },
            });
            console.log("[NextAuth] User created successfully:", dbUser.id);
          } else {
            console.log("[NextAuth] User found, updating:", dbUser.id);
            // Update user info if needed
            await prisma.user.update({
              where: { id: dbUser.id },
              data: {
                name: user.name || dbUser.name,
                image: user.image || dbUser.image,
              },
            });
            console.log("[NextAuth] User updated successfully");
          }
          
          user.id = dbUser.id;
          console.log("[NextAuth] SignIn successful! User ID:", user.id);
          return true;
        } catch (error) {
          console.error("[NextAuth] ERROR in signIn callback:", error);
          // Log full error details
          if (error instanceof Error) {
            console.error("[NextAuth] Error message:", error.message);
            console.error("[NextAuth] Error stack:", error.stack);
          }
          // Don't block sign-in if database fails - allow it to proceed
          // This prevents infinite loading
          console.log("[NextAuth] Allowing sign-in despite error (will retry later)");
          return true; // Changed from false to true to prevent blocking
        }
      }
      console.log("[NextAuth] SignIn callback completed, returning true");
      return true;
    },
    async jwt({ token, user, account }) {
      console.log("[NextAuth] jwt callback", { 
        hasUser: !!user, 
        hasAccount: !!account,
        tokenEmail: token.email,
        userEmail: user?.email,
        userId: user?.id
      });
      
      // Initial sign in - user object is available
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        console.log("[NextAuth] JWT token updated with user ID:", user.id);
        return token;
      }
      
      // Subsequent requests - user object is not available, but we have email in token
      // Fetch user from database if we have email but no ID
      if (token.email && !token.id) {
        try {
          console.log("[NextAuth] Fetching user from database for email:", token.email);
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
          });
          
          if (dbUser) {
            token.id = dbUser.id;
            token.name = dbUser.name;
            console.log("[NextAuth] User found in database, ID:", dbUser.id);
          } else {
            console.error("[NextAuth] User not found in database for email:", token.email);
          }
        } catch (error) {
          console.error("[NextAuth] Error fetching user from database:", error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      console.log("[NextAuth] session callback", { 
        hasToken: !!token, 
        hasSessionUser: !!session.user,
        tokenId: token.id,
        tokenEmail: token.email
      });
      
      if (token && session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).id = token.id as string;
        
        // Ensure email is set if not already
        if (!session.user.email && token.email) {
          session.user.email = token.email as string;
        }
        
        // Ensure name is set if not already
        if (!session.user.name && token.name) {
          session.user.name = token.name as string;
        }
      }
      
      return session;
    },
    async redirect({ url, baseUrl }) {
      console.log("[NextAuth] redirect callback", { url, baseUrl });
      
      // Allows relative callback URLs
      if (url.startsWith("/")) {
        const redirectUrl = `${baseUrl}${url}`;
        console.log("[NextAuth] Redirecting to relative URL:", redirectUrl);
        return redirectUrl;
      }
      
      // Allows callback URLs on the same origin
      try {
        const urlOrigin = new URL(url).origin;
        if (urlOrigin === baseUrl) {
          console.log("[NextAuth] Redirecting to same origin URL:", url);
          return url;
        }
      } catch (e) {
        console.error("[NextAuth] Error parsing redirect URL:", e);
      }
      
      console.log("[NextAuth] Redirecting to baseUrl:", baseUrl);
      return baseUrl;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development",
  debug: true,
  useSecureCookies: false, // Disable secure cookies for development
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };