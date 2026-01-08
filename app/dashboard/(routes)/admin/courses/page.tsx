import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { adminColumns } from "./_components/admin-columns";
import { AdminCoursesTable } from "./_components/admin-courses-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AdminCoursesPage = async () => {
  const { userId, user } = await auth();
  if (!userId) return redirect("/");

  // Only admin can access
  if (user?.role !== "ADMIN") {
    return redirect("/dashboard");
  }

  const courses = await db.course.findMany({
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          phoneNumber: true,
        }
      },
      chapters: {
        select: {
          id: true,
          isPublished: true,
        }
      },
      quizzes: {
        select: {
          id: true,
          isPublished: true,
        }
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  }).then(courses => courses.map(course => ({
    ...course,
    price: course.price || 0,
    publishedChaptersCount: course.chapters.filter(ch => ch.isPublished).length,
    publishedQuizzesCount: course.quizzes.filter(q => q.isPublished).length,
    user: course.user,
  })));

  const unpublishedCourses = courses.filter(course => !course.isPublished);
  const hasUnpublishedCourses = unpublishedCourses.length > 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">كل الكورسات</h1>
        <Link href="/dashboard/admin/courses/create">
          <Button className="bg-brand hover:bg-brand/90 text-white">
            <PlusCircle className="h-4 w-4 mr-2" />
            إنشاء كورس جديدة
          </Button>
        </Link>
      </div>

      {hasUnpublishedCourses && (
        <Alert className="mt-6 border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="mb-2">
              <strong>لنشر الكورسات على الصفحة الرئيسية، تحتاج إلى:</strong>
            </div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>إضافة عنوان للكورس</li>
              <li>إضافة وصف للكورس</li>
              <li>إضافة صورة للكورس</li>
              <li>إضافة فصل واحد على الأقل ونشره</li>
              <li>النقر على زر "نشر" في صفحة إعدادات الكورس</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-6">
        <AdminCoursesTable columns={adminColumns} data={courses as any} />
      </div>
    </div>
  );
};

export default AdminCoursesPage;


