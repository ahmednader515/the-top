import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // Check if user is teacher
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (session.user.role !== "TEACHER") {
      return new NextResponse("Forbidden - Teacher access required", { status: 403 });
    }

    const { fullName, phoneNumber, parentPhoneNumber, password, confirmPassword, curriculum, grade, division } = await req.json();

    if (!fullName || !phoneNumber || !parentPhoneNumber || !password || !confirmPassword || !curriculum || !grade) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Validate curriculum
    const validCurricula = ["عربي", "لغات"];
    if (!validCurricula.includes(curriculum)) {
      return new NextResponse("Invalid curriculum", { status: 400 });
    }

    // Validate grade
    const validGrades = ["الرابع الابتدائي", "الخامس الابتدائي", "السادس الابتدائي", "الاول الاعدادي", "الثاني الاعدادي", "الثالث الاعدادي", "الأول الثانوي", "الثاني الثانوي", "الثالث الثانوي"];
    if (!validGrades.includes(grade)) {
      return new NextResponse("Invalid grade", { status: 400 });
    }

    // Validate division for high school grades
    const elementaryGrades = ["الرابع الابتدائي", "الخامس الابتدائي", "السادس الابتدائي"];
    const intermediateGrades = ["الاول الاعدادي", "الثاني الاعدادي", "الثالث الاعدادي"];
    const isIntermediateGrade = elementaryGrades.includes(grade) || intermediateGrades.includes(grade);
    
    if (!isIntermediateGrade && !division) {
      return new NextResponse("Division is required for high school grades", { status: 400 });
    }

    if (isIntermediateGrade && division) {
      return new NextResponse("Division should not be set for intermediate grades", { status: 400 });
    }

    // Validate division matches grade
    if (!isIntermediateGrade && division) {
      const gradeDivisions: Record<string, string[]> = {
        "الأول الثانوي": ["بكالوريا", "عام"],
        "الثاني الثانوي": ["علمي", "أدبي"],
        "الثالث الثانوي": ["علمي رياضة", "أدبي"],
      };
      if (!gradeDivisions[grade]?.includes(division)) {
        return new NextResponse("Invalid division for selected grade", { status: 400 });
      }
    }

    if (password !== confirmPassword) {
      return new NextResponse("Passwords do not match", { status: 400 });
    }

    // Check if phone number is the same as parent phone number
    if (phoneNumber === parentPhoneNumber) {
      return new NextResponse("Phone number cannot be the same as parent phone number", { status: 400 });
    }

    // Check if user already exists
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { phoneNumber },
          { parentPhoneNumber }
        ]
      },
    });

    if (existingUser) {
      if (existingUser.phoneNumber === phoneNumber) {
        return new NextResponse("Phone number already exists", { status: 400 });
      }
      if (existingUser.parentPhoneNumber === parentPhoneNumber) {
        return new NextResponse("Parent phone number already exists", { status: 400 });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user with USER role (student)
    const newUser = await db.user.create({
      data: {
        fullName,
        phoneNumber,
        parentPhoneNumber,
        hashedPassword,
        role: "USER", // Always create as student
        curriculum,
        grade,
        division: isIntermediateGrade ? null : division,
      },
    });

    return NextResponse.json({ 
      success: true, 
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error("[TEACHER_CREATE_ACCOUNT]", error);
    
    // Check if it's a database schema error (migration not run)
    if (error instanceof Error && (
      error.message.includes("Unknown column") ||
      error.message.includes("column") && error.message.includes("does not exist") ||
      error.message.includes("P2021") ||
      error.message.includes("Unknown arg")
    )) {
      return new NextResponse("Database schema error. Please run: npx prisma migrate dev", { status: 500 });
    }
    
    return new NextResponse(`Internal Error: ${error instanceof Error ? error.message : "Unknown error"}`, { status: 500 });
  }
} 