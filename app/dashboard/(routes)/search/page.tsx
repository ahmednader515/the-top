import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { Course, Purchase } from "@prisma/client";
import { auth } from "@/lib/auth";
import { SearchContent } from "./_components/search-content";

type CourseWithDetails = Course & {
    chapters: { id: string }[];
    purchases: Purchase[];
    progress: number;
}

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        return redirect("/");
    }

    // Get user info for filtering
    const { user } = await auth();
    
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
            purchases: {
                where: {
                    userId: session.user.id,
                }
            }
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    const coursesWithProgress = await Promise.all(
        courses.map(async (course) => {
            const totalChapters = course.chapters.length;
            const completedChapters = await db.userProgress.count({
                where: {
                    userId: session.user.id,
                    chapterId: {
                        in: course.chapters.map(chapter => chapter.id)
                    },
                    isCompleted: true
                }
            });

            const progress = totalChapters > 0 
                ? (completedChapters / totalChapters) * 100 
                : 0;

            return {
                ...course,
                progress,
                user: course.user
            } as CourseWithDetails;
        })
    );

    return (
        <SearchContent
            initialCourses={coursesWithProgress}
            curriculum={user?.curriculum}
            userGrade={user?.grade}
            userDivision={user?.division}
        />
    );
}