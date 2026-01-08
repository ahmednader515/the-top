import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const { userId, user } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userData = await db.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        parentPhoneNumber: true,
        curriculum: true,
        grade: true,
        division: true,
        image: true,
      },
    });

    if (!userData) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json(userData);
  } catch (error) {
    console.error("[PROFILE_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId, user } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { curriculum, grade, division } = await req.json();

    // Validate curriculum
    if (curriculum) {
      const validCurricula = ["عربي", "لغات"];
      if (!validCurricula.includes(curriculum)) {
        return new NextResponse("Invalid curriculum", { status: 400 });
      }
    }

    // Validate grade
    if (grade) {
      const validGrades = ["الرابع الابتدائي", "الخامس الابتدائي", "السادس الابتدائي", "الاول الاعدادي", "الثاني الاعدادي", "الثالث الاعدادي", "الأول الثانوي", "الثاني الثانوي", "الثالث الثانوي"];
      if (!validGrades.includes(grade)) {
        return new NextResponse("Invalid grade", { status: 400 });
      }
    }

    // Validate division for high school grades
    const elementaryGrades = ["الرابع الابتدائي", "الخامس الابتدائي", "السادس الابتدائي"];
    const intermediateGrades = ["الاول الاعدادي", "الثاني الاعدادي", "الثالث الاعدادي"];
    const isIntermediateGrade = grade && (elementaryGrades.includes(grade) || intermediateGrades.includes(grade));

    if (grade && !isIntermediateGrade && !division) {
      return new NextResponse("Division is required for high school grades", { status: 400 });
    }

    if (grade && isIntermediateGrade && division) {
      return new NextResponse("Division should not be set for intermediate grades", { status: 400 });
    }

    // Validate division matches grade
    if (grade && !isIntermediateGrade && division) {
      const gradeDivisions: Record<string, string[]> = {
        "الأول الثانوي": ["بكالوريا", "عام"],
        "الثاني الثانوي": ["علمي", "أدبي"],
        "الثالث الثانوي": ["علمي رياضة", "أدبي"],
      };
      if (!gradeDivisions[grade]?.includes(division)) {
        return new NextResponse("Invalid division for selected grade", { status: 400 });
      }
    }

    // Update user
    const updatedUser = await db.user.update({
      where: {
        id: userId,
      },
      data: {
        curriculum: curriculum || null,
        grade: grade || null,
        division: grade && isIntermediateGrade ? null : (division || null),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        curriculum: updatedUser.curriculum,
        grade: updatedUser.grade,
        division: updatedUser.division,
      },
    });
  } catch (error) {
    console.error("[PROFILE_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

