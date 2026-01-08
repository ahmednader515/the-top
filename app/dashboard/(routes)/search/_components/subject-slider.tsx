"use client";

import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Globe,
  Calculator,
  FlaskConical,
  Atom,
  Leaf,
  History,
  Map,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

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

// Icon mapping for subjects
const SUBJECT_ICONS: Record<string, LucideIcon> = {
  "اللغة العربية": BookOpen,
  "English": Globe,
  "english": Globe,
  "الرياضيات": Calculator,
  "Math": Calculator,
  "العلوم": FlaskConical,
  "Science": FlaskConical,
  "الفيزياء": Atom,
  "Physics": Atom,
  "الكيمياء": FlaskConical,
  "Chemistry": FlaskConical,
  "الاحياء": Leaf,
  "Biology": Leaf,
  "التاريخ": History,
  "الجغرافيا": Map,
};

// Color mapping for subject icons
const SUBJECT_ICON_COLORS: Record<string, string> = {
  "اللغة العربية": "text-green-600",
  "English": "text-blue-600",
  "english": "text-blue-600",
  "الرياضيات": "text-purple-600",
  "Math": "text-purple-600",
  "العلوم": "text-cyan-600",
  "Science": "text-cyan-600",
  "الفيزياء": "text-orange-600",
  "Physics": "text-orange-600",
  "الكيمياء": "text-red-600",
  "Chemistry": "text-red-600",
  "الاحياء": "text-emerald-600",
  "Biology": "text-emerald-600",
  "التاريخ": "text-amber-600",
  "الجغرافيا": "text-indigo-600",
};

interface SubjectSliderProps {
  curriculum: string | null | undefined;
  selectedSubject: string | null;
  onSubjectChange: (subject: string | null) => void;
  userGrade?: string | null;
  userDivision?: string | null;
}

export const SubjectSlider = ({
  curriculum,
  selectedSubject,
  onSubjectChange,
  userGrade,
  userDivision,
}: SubjectSliderProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const subjects =
    curriculum === "لغات" ? LANGUAGES_SUBJECTS : ARABIC_SUBJECTS;

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;

    const scrollAmount = 250;
    const currentScroll = scrollRef.current.scrollLeft;
    const newScrollLeft =
      direction === "left"
        ? currentScroll - scrollAmount
        : currentScroll + scrollAmount;

    scrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    });
  };

  const checkScrollButtons = () => {
    if (!scrollRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
  };

  useEffect(() => {
    // Initial check
    const timer = setTimeout(() => {
      checkScrollButtons();
    }, 100);

    // Check on scroll
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", checkScrollButtons);
      window.addEventListener("resize", checkScrollButtons);
    }

    return () => {
      clearTimeout(timer);
      if (scrollElement) {
        scrollElement.removeEventListener("scroll", checkScrollButtons);
        window.removeEventListener("resize", checkScrollButtons);
      }
    };
  }, [subjects]);

  if (!curriculum) {
    return null;
  }

  // Format grade/division display
  const getGradeDisplay = () => {
    if (!userGrade) return null;
    
    const intermediateGrades = ["الاول الاعدادي", "الثاني الاعدادي", "الثالث الاعدادي"];
    const isIntermediate = intermediateGrades.includes(userGrade);
    
    if (isIntermediate) {
      return userGrade;
    }
    
    if (userDivision) {
      return `${userGrade} ${userDivision}`;
    }
    
    return userGrade;
  };

  const gradeDisplay = getGradeDisplay();

  return (
    <div className="relative w-full">
      {/* Grade/Division Label - Above the slider */}
      {gradeDisplay && (
        <div className="mb-2 px-1 text-sm text-gray-600 font-medium">
          {gradeDisplay}
        </div>
      )}

      {/* Slider Container */}
      <div className="relative w-full bg-gray-50 rounded-lg p-3">
        <div className="flex items-center gap-3">
          {/* Left Scroll Button */}
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={cn(
              "flex-shrink-0 h-8 w-8 rounded-full bg-white border border-gray-200 flex items-center justify-center transition-all",
              "hover:bg-gray-100 shadow-sm",
              canScrollLeft
                ? "cursor-pointer opacity-100"
                : "cursor-not-allowed opacity-30"
            )}
          >
            <ChevronRight className="h-4 w-4 text-gray-600" />
          </button>

          {/* Subject Cards Container */}
        <div
          ref={scrollRef}
          onScroll={checkScrollButtons}
          className="flex gap-2 overflow-x-auto scrollbar-hide flex-1 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {subjects.map((subject) => {
            const isSelected = selectedSubject === subject;
            const Icon = SUBJECT_ICONS[subject] || BookOpen;
            const iconColor = SUBJECT_ICON_COLORS[subject] || "text-gray-600";
            return (
              <button
                key={subject}
                onClick={() => onSubjectChange(isSelected ? null : subject)}
                className={cn(
                  "flex-shrink-0 px-4 py-2 rounded-lg border transition-all duration-200",
                  "text-sm font-medium whitespace-nowrap flex items-center gap-2",
                  isSelected
                    ? "bg-brand text-white border-brand shadow-md"
                    : "bg-white text-gray-700 border-gray-200 hover:border-brand/30 hover:bg-gray-50"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 flex-shrink-0",
                    isSelected ? "text-white" : iconColor
                  )}
                />
                <span>{subject}</span>
              </button>
            );
          })}
        </div>

          {/* Right Scroll Button */}
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className={cn(
              "flex-shrink-0 h-8 w-8 rounded-full bg-white border border-gray-200 flex items-center justify-center transition-all",
              "hover:bg-gray-100 shadow-sm",
              canScrollRight
                ? "cursor-pointer opacity-100"
                : "cursor-not-allowed opacity-30"
            )}
          >
            <ChevronLeft className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};
