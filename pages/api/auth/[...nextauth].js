// pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import { comparePassword } from "@/utils/password";

const prisma = new PrismaClient();

export const authOptions = {
  // Configure one or more authentication providers
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        tenantDomain: { label: "Tenant Domain", type: "text" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password || !credentials?.tenantDomain) {
            console.log("Missing credentials");
            return null;
          }

          // First, find the tenant by domain
          const tenant = await prisma.tenant.findUnique({
            where: {
              domain: credentials.tenantDomain
            }
          });

          if (!tenant) {
            console.log("Tenant not found:", credentials.tenantDomain);
            throw new Error("Tenant not found");
          }

          // Now find the conveyancer with this email and tenant
          const conveyancer = await prisma.conveyancer.findFirst({
            where: {
              email: credentials.email,
              tenantId: tenant.id
            }
          });

          if (!conveyancer) {
            console.log("Conveyancer not found:", credentials.email);
            throw new Error("No user found with this email");
          }

          // Verify the password
          const isPasswordValid = await comparePassword(
            credentials.password,
            conveyancer.password_hash
          );

          if (!isPasswordValid) {
            console.log("Invalid password for:", credentials.email);
            throw new Error("Invalid password");
          }

          console.log("Authentication successful for:", credentials.email);
          
          // Return the user object (don't include the password)
          return {
            id: conveyancer.id,
            name: conveyancer.name,
            email: conveyancer.email,
            tenantId: tenant.id,
            tenantName: tenant.name
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add user details to the JWT token
      if (user) {
        console.log("Setting JWT token with user data:", user.name);
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.tenantId = user.tenantId;
        token.tenantName = user.tenantName;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user details from JWT token to the session
      if (token) {
        console.log("Setting session with token data:", token.name);
        session.user = {
          id: token.id,
          name: token.name,
          email: token.email,
          tenantId: token.tenantId,
          tenantName: token.tenantName
        };
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
  // Make sure NEXTAUTH_SECRET is set in your environment variables
  secret: process.env.NEXTAUTH_SECRET || "YOUR_SECRET_HERE", // Replace in production
};

export default NextAuth(authOptions);