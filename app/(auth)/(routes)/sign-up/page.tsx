"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Link from "next/link";
import axios, { AxiosError } from "axios";
import { Check, X, Eye, EyeOff, ChevronLeft } from "lucide-react";
import Image from "next/image";
import { GradeDivisionSelector } from "@/components/grade-division-selector";
import ReCAPTCHA from "react-google-recaptcha";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    parentPhoneNumber: "",
    password: "",
    confirmPassword: "",
    curriculum: "",
    stage: "",
    grade: "",
    division: "",
  });

  // Read curriculum from query params
  useEffect(() => {
    const curriculumParam = searchParams.get("curriculum");
    if (curriculumParam && (curriculumParam === "عربي" || curriculumParam === "لغات")) {
      setFormData((prev) => ({ ...prev, curriculum: curriculumParam }));
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validatePasswords = () => {
    return {
      match: formData.password === formData.confirmPassword,
      isValid: formData.password === formData.confirmPassword && formData.password.length > 0,
    };
  };

  const passwordChecks = validatePasswords();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!passwordChecks.isValid) {
      toast.error("كلمات المرور غير متطابقة");
      setIsLoading(false);
      return;
    }

    // Check if CAPTCHA is verified
    if (!captchaToken) {
      toast.error("يرجى التحقق من أنك لست روبوت");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post("/api/auth/register", {
        ...formData,
        captchaToken,
      });
      
      if (response.data.success) {
        toast.success("تم إنشاء الحساب بنجاح");
        // Reset CAPTCHA
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
        router.push("/sign-in");
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      const errorMessage = axiosError.response?.data as string || "";
      
      if (axiosError.response?.status === 400) {
        if (errorMessage.includes("Phone number already exists")) {
          toast.error("رقم الهاتف مسجل مسبقاً");
        } else if (errorMessage.includes("Parent phone number already exists")) {
          toast.error("رقم هاتف الوالد مسجل مسبقاً");
        } else if (errorMessage.includes("Phone number cannot be the same as parent phone number")) {
          toast.error("رقم الهاتف لا يمكن أن يكون نفس رقم هاتف الوالد");
        } else if (errorMessage.includes("Passwords do not match")) {
          toast.error("كلمات المرور غير متطابقة");
        } else if (errorMessage.includes("Missing required fields")) {
          toast.error("يرجى ملء جميع الحقول المطلوبة (بما في ذلك الصف)");
        } else if (errorMessage.includes("Invalid grade")) {
          toast.error("الصف غير صحيح");
        } else if (errorMessage.includes("Division is required")) {
          toast.error("يجب اختيار الشعبة للصفوف الثانوية");
        } else if (errorMessage.includes("Invalid division")) {
          toast.error("الشعبة غير صحيحة للصف المحدد");
        } else {
          toast.error(errorMessage || "حدث خطأ أثناء إنشاء الحساب");
        }
      } else if (axiosError.response?.status === 500 || axiosError.response?.status === 503) {
        if (errorMessage.includes("Database schema error") || errorMessage.includes("migrate")) {
          toast.error("خطأ في قاعدة البيانات. يرجى الاتصال بالدعم الفني");
        } else {
          toast.error(errorMessage || "حدث خطأ في الخادم");
        }
      } else {
        toast.error("حدث خطأ أثناء إنشاء الحساب");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background overflow-y-auto">
      <div className="absolute top-4 left-4 z-10">
        <Button variant="ghost" size="lg" asChild>
          <Link href="/">
            <ChevronLeft className="h-10 w-10" />
          </Link>
        </Button>
      </div>
      
      {/* Right Side - Image */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-brand/10 to-brand/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-brand/5"></div>
        <div className="relative z-10 flex items-center justify-center w-full">
          <div className="text-center space-y-6 p-8">
            <div className="relative w-64 h-[268px] mx-auto rounded-full border-4 border-brand/20 shadow-2xl overflow-hidden">
              <div className="absolute inset-8">
                <Image
                  src="/logo.png"
                  alt="Teacher"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-brand">
                مرحباً بك في اكاديمية القمة التعليمية
              </h3>
              <p className="text-lg text-muted-foreground max-w-md">
                انضم إلينا اليوم وابدأ رحلة التعلم مع أفضل المدرسين
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Left Side - Form */}
      <div className="flex-1 flex items-start justify-center p-8">
        <div className="w-full max-w-md space-y-6 py-8 mt-8">
          <div className="space-y-2 text-center">
            <h2 className="text-3xl font-bold tracking-tight mt-8">
              إنشاء حساب جديد
            </h2>
            <p className="text-sm text-muted-foreground">
              أدخل بياناتك لإنشاء حساب جديد
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                disabled={isLoading}
                className="h-10"
                value={formData.fullName}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">رقم الهاتف</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                autoComplete="tel"
                required
                disabled={isLoading}
                className="h-10"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="+20XXXXXXXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentPhoneNumber">رقم هاتف الوالد</Label>
              <Input
                id="parentPhoneNumber"
                name="parentPhoneNumber"
                type="tel"
                autoComplete="tel"
                required
                disabled={isLoading}
                className="h-10"
                value={formData.parentPhoneNumber}
                onChange={handleInputChange}
                placeholder="+20XXXXXXXXXX"
              />
            </div>
            
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

            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  disabled={isLoading}
                  className="h-10"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  disabled={isLoading}
                  className="h-10"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {passwordChecks.match ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm text-muted-foreground">كلمات المرور متطابقة</span>
              </div>
            </div>

            {/* reCAPTCHA */}
            <div className="flex justify-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
                onChange={(token) => {
                  setCaptchaToken(token);
                }}
                onExpired={() => {
                  setCaptchaToken(null);
                  toast.warning("انتهت صلاحية التحقق. يرجى التحقق مرة أخرى");
                }}
                onError={(error) => {
                  setCaptchaToken(null);
                  console.error("[RECAPTCHA_ERROR]", error);
                  toast.error("حدث خطأ في التحقق. يرجى تحديث الصفحة والمحاولة مرة أخرى");
                }}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-10 bg-brand hover:bg-brand/90 text-white"
              disabled={isLoading || !passwordChecks.isValid || !captchaToken}
            >
              {isLoading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
            </Button>
          </form>
          <div className="text-center text-sm">
            <span className="text-muted-foreground">لديك حساب بالفعل؟ </span>
            <Link 
              href="/sign-in" 
              className="text-primary hover:underline transition-colors"
            >
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-background items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    }>
      <SignUpForm />
    </Suspense>
  );
} 