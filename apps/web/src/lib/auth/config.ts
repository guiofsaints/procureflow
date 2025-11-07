import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
// import GoogleProvider from 'next-auth/providers/google';

export const authConfig: NextAuthOptions = {
  providers: [
    // Credentials provider - fully implemented for bootstrap demo
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'user@example.com',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },
      async authorize(credentials) {
        // WARNING: This is a bootstrap placeholder implementation
        // In production, replace with proper user verification:
        // - Hash password comparison
        // - Database user lookup
        // - Proper error handling

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Demo credentials for bootstrap testing
        // TODO: Remove this and implement real user authentication
        if (
          credentials.email === 'demo@procureflow.com' &&
          credentials.password === 'demo123'
        ) {
          return {
            id: '1',
            email: 'demo@procureflow.com',
            name: 'Demo User',
            role: 'admin',
          };
        }

        // In a real app, you would:
        // 1. Hash the password using bcrypt or similar
        // 2. Query your database for the user
        // 3. Compare the hashed password
        // 4. Return the user object or null

        return null;
      },
    }),

    // Google OAuth provider - stubbed for future implementation
    // Uncomment and configure when ready to add Google authentication
    /*
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    */
  ],

  pages: {
    signIn: '/auth/signin',
    // signUp: '/auth/signup',  // Custom signup page
    // error: '/auth/error',    // Error code passed as query string
  },

  callbacks: {
    async jwt({ token, user }) {
      // Persist additional user data in the token
      if (user) {
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      // Send properties to the client
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
};

// Type augmentation for additional user properties
declare module 'next-auth' {
  interface User {
    role?: string;
  }

  interface Session {
    user: User & {
      id: string;
      role?: string;
    };
  }
}
