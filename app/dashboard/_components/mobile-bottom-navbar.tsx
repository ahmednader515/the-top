"use client";

import { Layout, Compass, Wallet, User, List, FileText, Award, Users } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

const guestRoutes = [
  {
    icon: Layout,
    label: "لوحة التحكم",
    href: "/dashboard",
  },
  {
    icon: Compass,
    label: "الكورسات",
    href: "/dashboard/search",
  },
  {
    icon: Wallet,
    label: "الرصيد",
    href: "/dashboard/balance",
  },
];

// Bottom navbar routes for teacher and admin (3 main tabs)
const teacherAdminBottomRoutes = [
  {
    icon: Users,
    label: "إدارة المستخدمين",
    teacherHref: "/dashboard/teacher/users",
    adminHref: "/dashboard/admin/users",
  },
  {
    icon: List,
    label: "الكورسات",
    teacherHref: "/dashboard/teacher/courses",
    adminHref: "/dashboard/admin/courses",
  },
  {
    icon: Award,
    label: "الدرجات",
    teacherHref: "/dashboard/teacher/grades",
    adminHref: "/dashboard/teacher/grades", // Admin can access teacher grades
  },
];

export const MobileBottomNavbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  // Don't show bottom navbar for admin/teacher - they use the drawer menu
  const userRole = session?.user?.role;
  if (userRole === "ADMIN" || userRole === "TEACHER") {
    return null;
  }

  // Determine which routes to show based on user role (only for guests/users)
  const routes = guestRoutes;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {routes.map((route) => {
          const Icon = route.icon;
          const isActive = pathname === route.href || pathname?.startsWith(route.href + "/");
          
          return (
            <button
              key={route.href}
              onClick={() => router.push(route.href)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                isActive
                  ? "text-brand"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{route.label}</span>
            </button>
          );
        })}
        
        {/* User Button */}
        {session?.user && (
          <div className="flex flex-col items-center justify-center gap-1 flex-1 h-full">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex flex-col items-center justify-center gap-1">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={session.user.image || ""} />
                    <AvatarFallback className="text-xs">
                      {session.user.name?.charAt(0) || session.user.fullName?.charAt(0) || session.user.email?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium text-gray-600">الحساب</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="mb-2">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile/edit" className="cursor-pointer">
                    <User className="h-4 w-4 mr-2" />
                    تعديل الملف الشخصي
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="text-red-600 cursor-pointer"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  تسجيل الخروج
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
};

