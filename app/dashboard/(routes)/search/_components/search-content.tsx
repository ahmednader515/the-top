"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SubjectSlider } from "./subject-slider";

type CourseWithDetails = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: number | null;
  grade: string | null;
  subject: string | null;
  chapters: { id: string }[];
  purchases: any[];
  progress: number;
  updatedAt: Date;
  user?: {
    id: string;
    fullName: string | null;
    image: string | null;
  } | null;
};

interface SearchContentProps {
  initialCourses: CourseWithDetails[];
  curriculum: string | null | undefined;
  userGrade: string | null | undefined;
  userDivision: string | null | undefined;
}

export const SearchContent = ({
  initialCourses,
  curriculum,
  userGrade,
  userDivision,
}: SearchContentProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(
    searchParams.get("subject")
  );
  const [loading, setLoading] = useState(false);

  // Memoize filtered courses to avoid recalculation on every render
  const filteredCourses = useMemo(() => {
    if (selectedSubject === null) {
      return initialCourses;
    }
    return initialCourses.filter(
      (course) => course.subject === selectedSubject
    );
  }, [selectedSubject, initialCourses]);

  // Update URL when subject changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedSubject) {
      params.set("subject", selectedSubject);
    }
    const newUrl = params.toString()
      ? `/dashboard/search?${params.toString()}`
      : "/dashboard/search";
    router.replace(newUrl, { scroll: false });
  }, [selectedSubject, router]);

  // Set loading state briefly when filtering
  useEffect(() => {
    if (selectedSubject !== null) {
      setLoading(true);
      const timer = setTimeout(() => setLoading(false), 100);
      return () => clearTimeout(timer);
    }
  }, [selectedSubject]);

  return (
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">البحث عن الكورسات</h1>
        <p className="text-muted-foreground text-lg">
          {selectedSubject
            ? `الكورسات المتاحة في مادة ${selectedSubject}`
            : "اكتشف مجموعة متنوعة من الكورسات التعليمية المميزة"}
        </p>
      </div>

      {/* Subject Slider Section */}
      {curriculum && (
        <div className="w-full">
          <SubjectSlider
            curriculum={curriculum}
            selectedSubject={selectedSubject}
            onSubjectChange={setSelectedSubject}
            userGrade={userGrade}
            userDivision={userDivision}
          />
        </div>
      )}

      {/* Results Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {selectedSubject
              ? `كورسات ${selectedSubject} (${filteredCourses.length})`
              : `جميع الكورسات (${filteredCourses.length})`}
          </h2>
          {filteredCourses.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {filteredCourses.length} كورس متاح
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="text-lg text-muted-foreground">جاري التحميل...</div>
          </div>
        ) : (
          <>
            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="group bg-card rounded-2xl overflow-hidden border shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="relative w-full aspect-[16/9]">
                    <Image
                      src={course.imageUrl || "/placeholder.png"}
                      alt={course.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Course Status Badge */}
                    <div className="absolute top-4 right-4">
                      <div
                        className={`rounded-full px-3 py-1 text-sm font-medium ${
                          course.purchases.length > 0
                            ? "bg-green-500 text-white"
                            : "bg-white/90 backdrop-blur-sm text-gray-800"
                        }`}
                      >
                        {course.purchases.length > 0 ? "مشترك" : "متاح"}
                      </div>
                    </div>

                    {/* Price Badge */}
                    <div className="absolute top-4 left-4">
                      <div
                        className={`rounded-full px-3 py-1 text-sm font-medium ${
                          course.price === 0
                            ? "bg-green-500 text-white"
                            : "bg-white/90 backdrop-blur-sm text-gray-800"
                        }`}
                      >
                        {course.price === 0
                          ? "مجاني"
                          : `${course.price} جنيه`}
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold mb-3 line-clamp-2 min-h-[3rem] text-gray-900">
                        {course.title}
                      </h3>

                      {/* Subject and Teacher Name Badges */}
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        {/* Subject Badge */}
                        {course.subject && (
                          <div className="inline-flex items-center px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium border border-purple-200">
                            {course.subject}
                          </div>
                        )}
                        {/* Teacher Name Badge */}
                        {course.user && (
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
                            {course.user.image && (
                              <Image
                                src={course.user.image}
                                alt={course.user.fullName || "Teacher"}
                                width={20}
                                height={20}
                                className="rounded-full"
                              />
                            )}
                            <span>{course.user.fullName || "المدرس"}</span>
                          </div>
                        )}
                      </div>

                      {/* Course Stats */}
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <span className="whitespace-nowrap">
                            {course.chapters.length}{" "}
                            {course.chapters.length === 1 ? "فصل" : "فصول"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span className="whitespace-nowrap">
                            {course.purchases.length} طالب
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span className="whitespace-nowrap">
                            {new Date(course.updatedAt).toLocaleDateString(
                              "ar",
                              {
                                year: "numeric",
                                month: "short",
                              }
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-brand hover:bg-brand/90 text-white font-semibold py-3 text-base transition-all duration-200 hover:scale-105"
                      variant="default"
                      asChild
                    >
                      <Link
                        href={
                          course.chapters.length > 0
                            ? `/courses/${course.id}/chapters/${course.chapters[0].id}`
                            : `/courses/${course.id}`
                        }
                      >
                        {course.purchases.length > 0
                          ? "متابعة التعلم"
                          : "عرض الكورس"}
                      </Link>
                    </Button>

                    {course.purchases.length === 0 && (
                      <Button
                        className="w-full mt-3 border-brand text-brand hover:bg-brand/10 font-semibold py-3 text-base transition-all duration-200"
                        variant="outline"
                        asChild
                      >
                        <Link href={`/courses/${course.id}/purchase`}>
                          شراء الكورس
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredCourses.length === 0 && (
              <div className="text-center py-16">
                <div className="bg-muted/50 rounded-2xl p-8 max-w-md mx-auto">
                  <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {selectedSubject
                      ? `لا توجد كورسات متاحة في مادة ${selectedSubject}`
                      : "لا توجد كورسات متاحة"}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {selectedSubject
                      ? "سيتم إضافة كورسات جديدة قريباً"
                      : "سيتم إضافة كورسات جديدة قريباً"}
                  </p>
                  {selectedSubject && (
                    <Button
                      onClick={() => setSelectedSubject(null)}
                      className="bg-brand hover:bg-brand/90 text-white font-semibold"
                    >
                      عرض جميع الكورسات
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

