"use client";

import { NavbarRoutes } from "@/components/navbar-routes"
import { MobileSidebar } from "./mobile-sidebar"
import { Logo } from "./logo"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"

export const Navbar = () => {
    const pathname = usePathname();
    const { data: session } = useSession();
    const userRole = session?.user?.role;
    const isTeacherOrAdmin = userRole === "TEACHER" || userRole === "ADMIN";
    
    return (
        <div className="p-4 border-b h-full flex items-center bg-card shadow-sm relative">
            {/* Mobile sidebar trigger - always visible on mobile */}
            <div className="md:hidden">
                <MobileSidebar />
            </div>
            {/* Desktop sidebar trigger */}
            <div className="hidden md:block">
                <MobileSidebar />
            </div>
            
            {/* Logo positioning: no logo on mobile for teacher/admin, but show on desktop */}
            {isTeacherOrAdmin ? (
                // Logo on desktop only for teacher/admin (hidden on mobile)
                <div className="hidden md:flex items-center rtl:mr-4 ltr:ml-4">
                    <Logo />
                </div>
            ) : (
                <>
                    {/* Centered logo on mobile for guests */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:hidden">
                        <Logo />
                    </div>
                    {/* Logo on desktop for guests */}
                    <div className="hidden md:flex items-center rtl:mr-4 ltr:ml-4">
                        <Logo />
                    </div>
                </>
            )}
            
            <div className="flex items-center gap-x-4 rtl:mr-auto ltr:ml-auto">
                {/* Show NavbarRoutes on desktop for all, and on mobile for teacher/admin */}
                <div className={isTeacherOrAdmin ? "flex" : "hidden md:flex"}>
                    <NavbarRoutes />
                </div>
            </div>
        </div>
    )
}