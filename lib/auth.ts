import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { AuthOptions } from "next-auth";
import { db } from "@/lib/db";
import GoogleProvider from "next-auth/providers/google";
import { Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prismaAdapter } from "@/lib/auth/prisma-adapter";

export const auth = async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/sign-in");
  }

  return {
    userId: session.user.id,
    user: session.user,
  };
};

export const authOptions: AuthOptions = {
  adapter: prismaAdapter(db) as Adapter,
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        phoneNumber: { label: "Phone Number", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.phoneNumber || !credentials?.password) {
          throw new Error("MISSING_CREDENTIALS");
        }

        const user = await db.user.findUnique({
          where: {
            phoneNumber: credentials.phoneNumber,
          },
        });

        if (!user) {
          throw new Error("USER_NOT_FOUND");
        }

        if (!user.hashedPassword) {
          throw new Error("NO_PASSWORD_SET");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isPasswordValid) {
          throw new Error("INVALID_PASSWORD");
        }

        return {
          id: user.id,
          name: user.fullName,
          phoneNumber: user.phoneNumber,
          role: user.role,
          curriculum: user.curriculum,
          grade: user.grade,
          division: user.division,
        } as any;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    // Remove maxAge to make sessions persist indefinitely
    updateAge: 0, // Disable session updates
  },
  jwt: {
    // Remove maxAge to make JWT tokens persist indefinitely
  },
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Handle error redirects with error messages
      if (url.startsWith("/sign-in")) {
        return url;
      }
      if (url.startsWith(baseUrl)) {
        return url;
      }
      return baseUrl;
    },
    async session({ token, session }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.phoneNumber = token.phoneNumber;
        session.user.image = token.picture ?? undefined;
        session.user.role = token.role;
        session.user.curriculum = token.curriculum;
        session.user.grade = token.grade;
        session.user.division = token.division;
      }

      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        // When user first signs in, set the token with user data
        return {
          ...token,
          id: user.id,
          name: user.name,
          phoneNumber: user.phoneNumber,
          picture: (user as any).picture,
          role: user.role,
          curriculum: (user as any).curriculum,
          grade: (user as any).grade,
          division: (user as any).division,
        };
      }

      // On subsequent requests, fetch fresh user data to get updated grade/division
      // Only update if token already has an id (user is logged in)
      if (token?.id) {
        try {
          const dbUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: { curriculum: true, grade: true, division: true },
          });
            if (dbUser) {
              token.curriculum = dbUser.curriculum;
              token.grade = dbUser.grade;
              token.division = dbUser.division;
            }
        } catch (error) {
          // If database query fails, keep existing token values
          // Don't throw error to prevent breaking the auth flow
          console.error("[JWT_CALLBACK]", error);
        }
      }

      return token;
    },
  },
  debug: process.env.NODE_ENV === "development",
}; 