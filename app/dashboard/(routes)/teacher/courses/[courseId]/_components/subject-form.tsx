"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Course } from "@prisma/client";
import toast from "react-hot-toast";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { SubjectSelector } from "@/components/subject-selector";

interface SubjectFormProps {
    initialData: Course;
    courseId: string;
}

export const SubjectForm = ({
    initialData,
    courseId
}: SubjectFormProps) => {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const ARABIC_SUBJECTS = [
        "اللغة العربية",
        "english",
        "الرياضيات",
        "العلوم",
        "الفيزياء",
        "الكيمياء",
        "الاحياء",
        "التاريخ",
        "الجغرافيا",
    ];

    const LANGUAGES_SUBJECTS = [
        "اللغة العربية",
        "التاريخ",
        "الجغرافيا",
        "English",
        "Math",
        "Science",
        "Physics",
        "Chemistry",
        "Biology",
    ];

    // Extract curriculum from subject if curriculum is not stored
    // If curriculum exists on course, use it; otherwise infer from subject
    const getCurriculumFromSubject = (subject: string | null | undefined): string => {
        if (!subject) return "";
        // Check if subject is in languages list
        if (LANGUAGES_SUBJECTS.includes(subject as any)) {
            return "لغات";
        }
        // Check if subject is in Arabic list
        if (ARABIC_SUBJECTS.includes(subject as any)) {
            return "عربي";
        }
        return "";
    };

    const [curriculum, setCurriculum] = useState(
        (initialData as any).curriculum || getCurriculumFromSubject(initialData.subject)
    );
    const [subject, setSubject] = useState(initialData.subject || "");

    const toggleEdit = () => setIsEditing((current) => !current);

    const onSubmit = async () => {
        try {
            setIsLoading(true);

            if (!curriculum) {
                toast.error("يجب اختيار المنهج");
                return;
            }

            if (!subject) {
                toast.error("يجب اختيار المادة");
                return;
            }

            const updateData: { subject: string | null; curriculum: string | null } = {
                subject: subject || null,
                curriculum: curriculum || null,
            };

            await axios.patch(`/api/courses/${courseId}`, updateData);
            toast.success("تم تحديث المادة");
            toggleEdit();
            router.refresh();
        } catch {
            toast.error("حدث خطأ ما");
        } finally {
            setIsLoading(false);
        }
    };

    const getDisplayText = () => {
        if (!initialData.subject) {
            return "غير محدد (لن يظهر للطلاب)";
        }
        return initialData.subject;
    };

    return (
        <div className="mt-6 border bg-slate-100 rounded-md p-4">
            <div className="font-medium flex items-center justify-between">
                المادة
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
                    <p className={!initialData.subject ? "text-yellow-600 font-medium" : ""}>
                        {getDisplayText()}
                    </p>
                    {!initialData.subject && (
                        <p className="text-xs text-muted-foreground mt-1">
                            تحذير: الكورس لن يظهر للطلاب حتى يتم تحديد المادة
                        </p>
                    )}
                </div>
            )}
            {isEditing && (
                <div className="mt-4 space-y-4">
                    <SubjectSelector
                        curriculum={curriculum}
                        subject={subject}
                        onCurriculumChange={setCurriculum}
                        onSubjectChange={setSubject}
                        required={true}
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

