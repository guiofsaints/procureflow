import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

import { verifyCredentials } from '@/features/auth';

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
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Verify user credentials using bcrypt
        const user = await verifyCredentials({
          email: credentials.email,
          password: credentials.password,
        });

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role || 'requester',
        };
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
    signOut: '/auth/signout',
    // error: '/auth/error',    // Error code passed as query string
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Persist additional user data in the token
      if (user) {
        token.id = user.id; // Preserve custom user ID
        token.role = user.role;
        token.name = user.name;
      }

      // Handle session updates (e.g., when user updates their profile)
      if (trigger === 'update' && session?.user) {
        token.name = session.user.name;
      }

      return token;
    },

    async session({ session, token }) {
      // Send properties to the client
      if (token && session.user) {
        session.user.id = token.id as string; // Use custom ID instead of token.sub
        session.user.role = token.role as string;
        session.user.name = token.name as string;
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

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
    name?: string;
  }
}
