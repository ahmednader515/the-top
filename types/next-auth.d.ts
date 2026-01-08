import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
      phoneNumber?: string;
      role: string;
      curriculum?: string | null;
      grade?: string | null;
      division?: string | null;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    role: string;
    grade?: string | null;
    division?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    role: string;
    grade?: string | null;
    division?: string | null;
    picture?: string;
  }
} 