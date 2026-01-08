"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const CURRICULA = ["عربي", "لغات"] as const;

const STAGES = ["الابتدائية", "الاعدادية", "الثانوية"] as const;

const ELEMENTARY_GRADES = [
  "الرابع الابتدائي",
  "الخامس الابتدائي",
  "السادس الابتدائي",
] as const;

const INTERMEDIATE_GRADES_ONLY = [
  "الاول الاعدادي",
  "الثاني الاعدادي",
  "الثالث الاعدادي",
] as const;

const HIGH_SCHOOL_GRADES = [
  "الأول الثانوي",
  "الثاني الثانوي",
  "الثالث الثانوي",
] as const;

const GRADES = [...ELEMENTARY_GRADES, ...INTERMEDIATE_GRADES_ONLY, ...HIGH_SCHOOL_GRADES] as const;

const GRADE_DIVISIONS: Record<string, string[]> = {
  "الأول الثانوي": ["بكالوريا", "عام"],
  "الثاني الثانوي": ["علمي", "أدبي"],
  "الثالث الثانوي": ["علمي رياضة", "أدبي"],
};

const ELEMENTARY_GRADES_LIST = [
  "الرابع الابتدائي",
  "الخامس الابتدائي",
  "السادس الابتدائي",
];

const INTERMEDIATE_GRADES_LIST = [
  "الاول الاعدادي",
  "الثاني الاعدادي",
  "الثالث الاعدادي",
];

const INTERMEDIATE_GRADES_WITH_ELEMENTARY = [
  ...ELEMENTARY_GRADES_LIST,
  ...INTERMEDIATE_GRADES_LIST,
];

interface GradeDivisionSelectorProps {
  curriculum?: string;
  stage?: string;
  grade: string;
  division: string | null;
  divisions?: string[];
  onCurriculumChange?: (curriculum: string) => void;
  onStageChange?: (stage: string) => void;
  onGradeChange: (grade: string) => void;
  onDivisionChange: (division: string | null) => void;
  onDivisionsChange?: (divisions: string[]) => void;
  required?: boolean;
  showAllOption?: boolean;
  isCourseForm?: boolean;
}

export const GradeDivisionSelector = ({
  curriculum = "",
  stage = "",
  grade,
  division,
  divisions = [],
  onCurriculumChange,
  onStageChange,
  onGradeChange,
  onDivisionChange,
  onDivisionsChange,
  required = false,
  showAllOption = false,
  isCourseForm = false,
}: GradeDivisionSelectorProps) => {
  const showCurriculumSelector = onCurriculumChange !== undefined;
  const showStageSelector = onStageChange !== undefined;
  const isHighSchoolGrade = grade && !INTERMEDIATE_GRADES_WITH_ELEMENTARY.includes(grade);
  const availableDivisions = grade ? GRADE_DIVISIONS[grade] || [] : [];

  // Get grades based on selected stage
  const getAvailableGrades = () => {
    if (showStageSelector && stage) {
      switch (stage) {
        case "الابتدائية":
          return ELEMENTARY_GRADES;
        case "الاعدادية":
          return INTERMEDIATE_GRADES_ONLY;
        case "الثانوية":
          return HIGH_SCHOOL_GRADES;
        default:
          return [];
      }
    }
    return GRADES;
  };

  const availableGrades = getAvailableGrades();

  const handleCurriculumChange = (newCurriculum: string) => {
    onCurriculumChange?.(newCurriculum);
    // Reset stage, grade and division when curriculum changes
    onStageChange?.("");
    onGradeChange("");
    onDivisionChange(null);
    onDivisionsChange?.([]);
  };

  const handleStageChange = (newStage: string) => {
    onStageChange?.(newStage);
    // Reset grade and division when stage changes
    onGradeChange("");
    onDivisionChange(null);
    onDivisionsChange?.([]);
  };

  const handleGradeChange = (newGrade: string) => {
    onGradeChange(newGrade);
    // Reset division when grade changes
    const isNewGradeIntermediate = INTERMEDIATE_GRADES_WITH_ELEMENTARY.includes(newGrade);
    const isNewGradeAll = newGrade === "الكل";
    
    if (isCourseForm) {
      // For course forms, reset divisions if grade is intermediate/elementary or "الكل"
      if (isNewGradeIntermediate || isNewGradeAll) {
        onDivisionsChange?.([]);
      }
    } else {
      // For user forms, reset division if grade changes
      onDivisionChange(null);
    }
  };

  const handleDivisionToggle = (div: string, checked: boolean) => {
    if (!onDivisionsChange) return;
    
    if (checked) {
      onDivisionsChange([...divisions, div]);
    } else {
      onDivisionsChange(divisions.filter((d) => d !== div));
    }
  };

  return (
    <div className="space-y-4">
      {showCurriculumSelector && (
        <div className="space-y-2">
          <Label>
            المنهج {required && "*"}
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {CURRICULA.map((c) => {
              const isSelected = curriculum === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleCurriculumChange(c)}
                  className={cn(
                    "relative flex items-center justify-center gap-2 rounded-lg border p-4 text-sm font-medium transition-all cursor-pointer",
                    "hover:bg-gray-100 dark:hover:bg-gray-800",
                    isSelected
                      ? "border-gray-900 bg-gray-100 text-gray-900 dark:border-gray-100 dark:bg-gray-800 dark:text-gray-100"
                      : "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                  )}
                >
                  {isSelected && (
                    <Check className="h-4 w-4 absolute left-3 top-3 text-gray-900 dark:text-gray-100" />
                  )}
                  <span className={isSelected ? "mr-6" : ""}>{c}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showStageSelector && (!showCurriculumSelector || curriculum) && (
        <div className="space-y-2">
          <Label htmlFor="stage">
            المرحلة {required && "*"}
          </Label>
          <Select
            value={stage}
            onValueChange={handleStageChange}
            required={required}
            disabled={showCurriculumSelector && !curriculum}
          >
            <SelectTrigger id="stage">
              <SelectValue placeholder="اختر المرحلة" />
            </SelectTrigger>
            <SelectContent>
              {STAGES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {(!showCurriculumSelector || curriculum) && (!showStageSelector || stage) && (
        <div className="space-y-2">
          <Label htmlFor="grade">
            الصف {required && "*"}
          </Label>
          <Select
            value={grade}
            onValueChange={handleGradeChange}
            required={required}
            disabled={(showCurriculumSelector && !curriculum) || (showStageSelector && !stage)}
          >
            <SelectTrigger id="grade">
              <SelectValue placeholder="اختر الصف" />
            </SelectTrigger>
            <SelectContent>
              {showAllOption && (
                <SelectItem value="الكل">الكل</SelectItem>
              )}
              {availableGrades.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isCourseForm && grade && grade !== "الكل" && isHighSchoolGrade && (
        <div className="space-y-2">
          <Label>
            الشعبة {required && "*"}
          </Label>
          <div className="space-y-2">
            {availableDivisions.map((div) => (
              <div key={div} className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id={`division-${div}`}
                  checked={divisions.includes(div)}
                  onCheckedChange={(checked) =>
                    handleDivisionToggle(div, checked as boolean)
                  }
                />
                <Label
                  htmlFor={`division-${div}`}
                  className="font-normal cursor-pointer"
                >
                  {div}
                </Label>
              </div>
            ))}
          </div>
          {required && divisions.length === 0 && (
            <p className="text-sm text-red-500">
              يجب اختيار شعبة واحدة على الأقل
            </p>
          )}
        </div>
      )}

      {!isCourseForm && grade && isHighSchoolGrade && (
        <div className="space-y-2">
          <Label htmlFor="division">
            الشعبة {required && "*"}
          </Label>
          <Select
            value={division || ""}
            onValueChange={(value) => onDivisionChange(value || null)}
            required={required}
          >
            <SelectTrigger id="division">
              <SelectValue placeholder="اختر الشعبة" />
            </SelectTrigger>
            <SelectContent>
              {availableDivisions.map((div) => (
                <SelectItem key={div} value={div}>
                  {div}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

