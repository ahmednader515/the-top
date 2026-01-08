import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { userId } = await auth()
        const { title } = await req.json();

        if(!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const course = await db.course.create({
            data: {
                userId,
                title,
            }
        });

        return NextResponse.json(course);

    } catch (error) {
        console.log("[Courses]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const includeProgress = searchParams.get('includeProgress') === 'true';
    
    // Try to get user, but don't fail if not authenticated
    let userId = null;
    let user = null;
    try {
      const authResult = await auth();
      userId = authResult.userId;
      user = authResult.user;
    } catch (error) {
      // User is not authenticated, which is fine for the home page
      console.log("User not authenticated, showing courses without progress");
    }

    // Build where clause for course filtering
    const whereClause: any = {
      isPublished: true,
    };

    // Build grade filtering conditions
    const gradeConditions: any[] = [];
    if (user && user.role === "USER" && user.grade) {
      const elementaryGrades = ["الرابع الابتدائي", "الخامس الابتدائي", "السادس الابتدائي"];
      const intermediateGrades = ["الاول الاعدادي", "الثاني الاعدادي", "الثالث الاعدادي"];
      const gradesWithoutDivision = [...elementaryGrades, ...intermediateGrades];
      const isGradeWithoutDivision = gradesWithoutDivision.includes(user.grade);

      gradeConditions.push(
        { grade: "الكل" }, // All grades
        { grade: null }, // Backward compatibility
      );

      if (isGradeWithoutDivision) {
        // For elementary and intermediate grades, match by grade only
        gradeConditions.push({ grade: user.grade });
      } else if (user.division) {
        // For high school grades, check both grade and division
        gradeConditions.push({
          AND: [
            { grade: user.grade },
            { divisions: { has: user.division } }
          ]
        });
      } else {
        // If no division selected for high school, still show courses for that grade
        // (this handles cases where user hasn't set division yet)
        gradeConditions.push({ grade: user.grade });
      }
    }

    // Build curriculum filtering conditions
    const curriculumConditions: any[] = [];
    if (user && user.role === "USER" && user.curriculum) {
      // Show courses that match user's curriculum OR courses without curriculum (for backward compatibility)
      curriculumConditions.push(
        { curriculum: user.curriculum },
        { curriculum: null } // Backward compatibility: show courses without curriculum
      );
    }

    // Combine conditions: both grade AND curriculum must match (if applicable)
    if (gradeConditions.length > 0 && curriculumConditions.length > 0) {
      whereClause.AND = [
        { OR: gradeConditions },
        { OR: curriculumConditions }
      ];
    } else if (gradeConditions.length > 0) {
      whereClause.OR = gradeConditions;
    } else if (curriculumConditions.length > 0) {
      whereClause.OR = curriculumConditions;
    }

    const courses = await db.course.findMany({
      where: whereClause,
      include: {
        user: true,
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
        purchases: includeProgress && userId ? {
          where: {
            userId: userId,
            status: "ACTIVE"
          }
        } : undefined,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (includeProgress && userId) {
      const coursesWithProgress = await Promise.all(
        courses.map(async (course) => {
          const totalChapters = course.chapters.length;
          const totalQuizzes = course.quizzes.length;
          const totalContent = totalChapters + totalQuizzes;

          let completedChapters = 0;
          let completedQuizzes = 0;

          if (course.purchases && course.purchases.length > 0) {
            // Get completed chapters
            completedChapters = await db.userProgress.count({
              where: {
                userId,
                chapterId: {
                  in: course.chapters.map(chapter => chapter.id)
                },
                isCompleted: true
              }
            });

            // Get completed quizzes
            const completedQuizResults = await db.quizResult.findMany({
                where: {
                    studentId: userId,
                    quizId: {
                        in: course.quizzes.map(quiz => quiz.id)
                    }
                },
                select: {
                    quizId: true
                }
            });

            // Count unique quizIds
            const uniqueQuizIds = new Set(completedQuizResults.map(result => result.quizId));
            completedQuizzes = uniqueQuizIds.size;
          }

          const completedContent = completedChapters + completedQuizzes;
          const progress = totalContent > 0 ? (completedContent / totalContent) * 100 : 0;

          return {
            ...course,
            progress
          };
        })
      );

      return NextResponse.json(coursesWithProgress);
    }

    // For unauthenticated users, return courses without progress
    const coursesWithoutProgress = courses.map(course => ({
      ...course,
      progress: 0
    }));

    return NextResponse.json(coursesWithoutProgress);
  } catch (error) {
    console.error("[COURSES]", error);
    // Return more detailed error in development
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error", details: errorMessage }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}