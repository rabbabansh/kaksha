import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
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
          return { 
            id: "1", 
            name: "Ansh", 
            email: "ansh@kaksha.ai" 
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development",
  debug: true,
  useSecureCookies: false, // Disable secure cookies for development
});

export { handler as GET, handler as POST };