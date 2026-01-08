"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, User, Save } from "lucide-react";
import Link from "next/link";
import axios, { AxiosError } from "axios";
import { GradeDivisionSelector } from "@/components/grade-division-selector";

export default function ProfileEditPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [formData, setFormData] = useState({
    curriculum: "",
    stage: "",
    grade: "",
    division: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get("/api/profile");
        // Determine stage from grade for profile edit
        const grade = response.data.grade || "";
        let stage = "";
        if (grade.includes("الابتدائي")) {
          stage = "الابتدائية";
        } else if (grade.includes("الاعدادي")) {
          stage = "الاعدادية";
        } else if (grade.includes("الثانوي")) {
          stage = "الثانوية";
        }
        
        setFormData({
          curriculum: response.data.curriculum || "",
          stage: stage,
          grade: grade,
          division: response.data.division || "",
        });
      } catch (error) {
        toast.error("حدث خطأ أثناء تحميل البيانات");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await axios.patch("/api/profile", {
        curriculum: formData.curriculum,
        grade: formData.grade,
        division: formData.division || null,
      });

      toast.success("تم تحديث الملف الشخصي بنجاح");
      router.push("/dashboard/search");
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.response?.status === 400) {
        const errorMessage = axiosError.response.data as string;
        if (errorMessage.includes("Division is required")) {
          toast.error("يجب اختيار الشعبة للصفوف الثانوية");
        } else if (errorMessage.includes("Invalid grade")) {
          toast.error("الصف غير صحيح");
        } else if (errorMessage.includes("Invalid division")) {
          toast.error("الشعبة غير صحيحة للصف المحدد");
        } else {
          toast.error("حدث خطأ أثناء التحديث");
        }
      } else {
        toast.error("حدث خطأ أثناء التحديث");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/search">
              <ArrowLeft className="h-4 w-4 mr-2" />
              العودة
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            تعديل الملف الشخصي
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              معلومات الصف والشعبة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <GradeDivisionSelector
                curriculum={formData.curriculum}
                stage={formData.stage}
                grade={formData.grade}
                division={formData.division || null}
                onCurriculumChange={(curriculum) => setFormData((prev) => ({ ...prev, curriculum }))}
                onStageChange={(stage) => setFormData((prev) => ({ ...prev, stage }))}
                onGradeChange={(grade) => setFormData((prev) => ({ ...prev, grade }))}
                onDivisionChange={(division) => setFormData((prev) => ({ ...prev, division: division || "" }))}
                required
              />

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isLoading || !formData.curriculum || !formData.stage || !formData.grade}
                  className="flex-1 bg-brand hover:bg-brand/90 text-white"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      حفظ التغييرات
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/search")}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

