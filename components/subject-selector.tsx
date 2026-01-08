"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const CURRICULA_TYPES = ["لغات", "عربي"] as const;

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
] as const;

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
] as const;

interface SubjectSelectorProps {
  curriculum?: string;
  subject: string;
  onCurriculumChange?: (curriculum: string) => void;
  onSubjectChange: (subject: string) => void;
  required?: boolean;
}

export const SubjectSelector = ({
  curriculum = "",
  subject,
  onCurriculumChange,
  onSubjectChange,
  required = false,
}: SubjectSelectorProps) => {
  const showCurriculumSelector = onCurriculumChange !== undefined;
  
  const getAvailableSubjects = () => {
    if (!curriculum) return [];
    if (curriculum === "عربي") {
      return ARABIC_SUBJECTS;
    }
    if (curriculum === "لغات") {
      return LANGUAGES_SUBJECTS;
    }
    return [];
  };

  const availableSubjects = getAvailableSubjects();

  const handleCurriculumChange = (newCurriculum: string) => {
    onCurriculumChange?.(newCurriculum);
    // Reset subject when curriculum changes
    onSubjectChange("");
  };

  return (
    <div className="space-y-4">
      {showCurriculumSelector && (
        <div className="space-y-2">
          <Label>
            المنهج {required && "*"}
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {CURRICULA_TYPES.map((c) => {
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

      {curriculum && (
        <div className="space-y-2">
          <Label htmlFor="subject">
            المادة {required && "*"}
          </Label>
          <Select
            value={subject}
            onValueChange={onSubjectChange}
            required={required}
            disabled={!curriculum}
          >
            <SelectTrigger id="subject">
              <SelectValue placeholder="اختر المادة" />
            </SelectTrigger>
            <SelectContent>
              {availableSubjects.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

