import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { fullName, phoneNumber, parentPhoneNumber, password, confirmPassword, curriculum, grade, division, captchaToken } = await req.json();

    if (!fullName || !phoneNumber || !parentPhoneNumber || !password || !confirmPassword || !curriculum || !grade) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Verify CAPTCHA token
    if (process.env.RECAPTCHA_SECRET_KEY) {
      if (!captchaToken) {
        return new NextResponse("CAPTCHA verification required", { status: 400 });
      }

      try {
        const recaptchaResponse = await fetch(
          `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
          { method: "POST" }
        );
        const recaptchaData = await recaptchaResponse.json();

        if (!recaptchaData.success) {
          console.error("[RECAPTCHA_VERIFICATION_FAILED]", recaptchaData);
          return new NextResponse(
            `CAPTCHA verification failed: ${recaptchaData["error-codes"]?.join(", ") || "Unknown error"}`,
            { status: 400 }
          );
        }
      } catch (error) {
        console.error("[RECAPTCHA_VERIFICATION]", error);
        return new NextResponse("CAPTCHA verification error", { status: 500 });
      }
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

    // Hash password (no complexity requirements)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user directly without email verification
    await db.user.create({
      data: {
        fullName,
        phoneNumber,
        parentPhoneNumber,
        hashedPassword,
        role: "USER",
        curriculum,
        grade,
        division: isIntermediateGrade ? null : division,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[REGISTER]", error);
    
    // Check if it's a database schema error (migration not run)
    if (error instanceof Error && (
      error.message.includes("Unknown column") ||
      error.message.includes("column") && error.message.includes("does not exist") ||
      error.message.includes("P2021") ||
      error.message.includes("Unknown arg") ||
      error.message.includes("does not exist") ||
      error.message.includes("table")
    )) {
      return new NextResponse("Database schema error. Please run: npx prisma migrate dev", { status: 503 });
    }
    
    return new NextResponse(`Internal Error: ${error instanceof Error ? error.message : "Unknown error"}`, { status: 500 });
  }
} 