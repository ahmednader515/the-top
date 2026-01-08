"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GradeDivisionSelector } from "@/components/grade-division-selector";
import { toast } from "sonner";
import axios from "axios";

interface GradeEditDialogProps {
  courseId: string;
  currentGrade: string | null;
  currentDivisions: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GradeEditDialog({
  courseId,
  currentGrade,
  currentDivisions,
  open,
  onOpenChange,
}: GradeEditDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [grade, setGrade] = useState(currentGrade || "");
  const [divisions, setDivisions] = useState<string[]>(currentDivisions || []);

  useEffect(() => {
    if (open) {
      setGrade(currentGrade || "");
      setDivisions(currentDivisions || []);
    }
  }, [open, currentGrade, currentDivisions]);

  const handleSubmit = async () => {
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

      const updateData: { grade: string | null; divisions: string[] } = {
        grade: grade || null,
        divisions: (grade === "الكل" || !grade || isGradeWithoutDivision) ? [] : divisions,
      };

      await axios.patch(`/api/courses/${courseId}`, updateData);
      toast.success("تم تحديث الصف والشعبة بنجاح");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error("حدث خطأ أثناء التحديث");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>تعديل الصف والشعبة</DialogTitle>
          <DialogDescription>
            حدد الصف الدراسي لهذا الكورس لعرضه للطلاب المناسبين. يمكنك اختيار "الكل" لعرض الكورس لجميع الصفوف.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
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
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !grade}
            className="bg-brand hover:bg-brand/90 text-white"
          >
            {isLoading ? "جاري الحفظ..." : "حفظ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


