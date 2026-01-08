"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Course } from "@prisma/client";
import toast from "react-hot-toast";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { GradeDivisionSelector } from "@/components/grade-division-selector";

interface GradeDivisionFormProps {
    initialData: Course;
    courseId: string;
}

export const GradeDivisionForm = ({
    initialData,
    courseId
}: GradeDivisionFormProps) => {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [grade, setGrade] = useState(initialData.grade || "");
    const [divisions, setDivisions] = useState<string[]>(initialData.divisions || []);

    const toggleEdit = () => setIsEditing((current) => !current);

    const onSubmit = async () => {
        try {
            setIsLoading(true);

            // Validation
            const elementaryGrades = ["الرابع الابتدائي", "الخامس الابتدائي", "السادس الابتدائي"];
            const intermediateGrades = ["الاول الاعدادي", "الثاني الاعدادي", "الثالث الاعدادي"];
            const gradesWithoutDivision = [...elementaryGrades, ...intermediateGrades];
            const isGradeWithoutDivision = grade && gradesWithoutDivision.includes(grade);
            const isHighSchoolGrade = grade && !gradesWithoutDivision.includes(grade) && grade !== "الكل";

            if (grade && grade !== "الكل" && isHighSchoolGrade && divisions.length === 0) {
                toast.error("يجب اختيار شعبة واحدة على الأقل للصفوف الثانوية");
                return;
            }

            if (grade && (isGradeWithoutDivision || grade === "الكل") && divisions.length > 0) {
                // Auto-correct: clear divisions for elementary/intermediate grades or "الكل"
                setDivisions([]);
            }

            const updateData: { grade: string | null; divisions: string[] } = {
                grade: grade || null,
                divisions: (grade === "الكل" || !grade || isGradeWithoutDivision) ? [] : divisions,
            };

            await axios.patch(`/api/courses/${courseId}`, updateData);
            toast.success("تم تحديث الصف والشعبة");
            toggleEdit();
            router.refresh();
        } catch {
            toast.error("حدث خطأ ما");
        } finally {
            setIsLoading(false);
        }
    };

    const getDisplayText = () => {
        if (!initialData.grade) {
            return "غير محدد (لن يظهر للطلاب)";
        }
        if (initialData.grade === "الكل") {
            return "الكل";
        }
        if (initialData.divisions && initialData.divisions.length > 0) {
            return `${initialData.grade} - ${initialData.divisions.join(", ")}`;
        }
        return initialData.grade;
    };

    return (
        <div className="mt-6 border bg-slate-100 rounded-md p-4">
            <div className="font-medium flex items-center justify-between">
                الصف والشعبة
                <Button onClick={toggleEdit} variant="ghost">
                    {isEditing ? (
                        <>إلغاء</>
                    ) : (
                        <>
                            <Pencil className="h-4 w-4 mr-2" />
                            تعديل
                        </>
                    )}
                </Button>
            </div>
            {!isEditing && (
                <div className="mt-2 text-sm">
                    <p className={!initialData.grade ? "text-yellow-600 font-medium" : ""}>
                        {getDisplayText()}
                    </p>
                    {!initialData.grade && (
                        <p className="text-xs text-muted-foreground mt-1">
                            تحذير: الكورس لن يظهر للطلاب حتى يتم تحديد الصف
                        </p>
                    )}
                </div>
            )}
            {isEditing && (
                <div className="mt-4 space-y-4">
                    <GradeDivisionSelector
                        grade={grade}
                        division={null}
                        divisions={divisions}
                        onGradeChange={setGrade}
                        onDivisionChange={() => {}}
                        onDivisionsChange={setDivisions}
                        showAllOption={true}
                        isCourseForm={true}
                    />
                    <div className="flex items-center gap-x-2">
                        <Button
                            disabled={isLoading}
                            onClick={onSubmit}
                            type="button"
                        >
                            حفظ
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

