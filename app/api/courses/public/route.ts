import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Public endpoint shows all published courses (no filtering)
    // Grade filtering is handled in authenticated endpoints
    // Select only fields that exist to avoid schema errors
    const courses = await db.course.findMany({
      where: {
        isPublished: true,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            image: true,
          }
        },
        chapters: {
          where: {
            isPublished: true,
          },
          select: {
            id: true,
          }
        },
        quizzes: {
          where: {
            isPublished: true,
          },
          select: {
            id: true,
          }
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      // Remove cacheStrategy as it might not be supported in all Prisma versions
      // cacheStrategy: process.env.NODE_ENV === "production" ? { ttl: 120 } : undefined,
    });

    // Return courses with default progress of 0 for public view
    const coursesWithDefaultProgress = courses.map(course => ({
      ...course,
      progress: 0
    }));

    return NextResponse.json(coursesWithDefaultProgress);
  } catch (error) {
    console.error("[COURSES_PUBLIC]", error);
    
    // If the table doesn't exist or there's a database connection issue,
    // return an empty array instead of an error
    if (error instanceof Error && (
      error.message.includes("does not exist") || 
      error.message.includes("P2021") ||
      error.message.includes("table") ||
      error.message.includes("Unknown column") ||
      error.message.includes("column") && error.message.includes("does not exist")
    )) {
      console.error("[COURSES_PUBLIC] Database schema issue:", error.message);
      return NextResponse.json([]);
    }
    
    // Return more detailed error in development
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[COURSES_PUBLIC] Full error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error", details: errorMessage }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
} 