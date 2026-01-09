import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const { userId, user } = await auth();
        const resolvedParams = await params;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Build where clause: ADMIN can access any course, TEACHER only their own
        const whereClause = user?.role === "ADMIN"
            ? { id: resolvedParams.courseId }
            : { id: resolvedParams.courseId, userId };

        const course = await db.course.findUnique({
            where: whereClause,
            include: {
                chapters: true
            }
        });

        if (!course) {
            return new NextResponse("Not found", { status: 404 });
        }

        // Only validate required fields when publishing (setting to true), not when unpublishing
        const willBePublished = !course.isPublished;
        
        if (willBePublished) {
            const hasPublishedChapters = course.chapters.some((chapter) => chapter.isPublished);

            // Price can be 0 (free), but must not be null or undefined
            const hasValidPrice = course.price !== null && course.price !== undefined;

            if (!course.title || !course.description || !course.imageUrl || !hasValidPrice || !hasPublishedChapters) {
                return new NextResponse("Missing required fields", { status: 401 });
            }
        }

        const publishedCourse = await db.course.update({
            where: {
                id: resolvedParams.courseId,
            },
            data: {
                isPublished: !course.isPublished
            }
        });

        return NextResponse.json(publishedCourse);
    } catch (error) {
        console.log("[COURSE_PUBLISH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
} 