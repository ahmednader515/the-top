"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export type AdminCourse = {
    id: string;
    title: string;
    price: number;
    isPublished: boolean;
    createdAt: Date;
    grade: string | null;
    divisions: string[];
    user: {
        id: string;
        fullName: string | null;
        phoneNumber: string | null;
    } | null;
}

export const adminColumns: ColumnDef<AdminCourse>[] = [
    {
        accessorKey: "title",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    العنوان
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
    },
    {
        accessorKey: "user",
        header: () => {
            return <div className="text-right font-medium">المدرس</div>;
        },
        cell: ({ row }) => {
            const user = row.original.user;
            if (!user) {
                return <div className="text-muted-foreground">غير محدد</div>;
            }
            return (
                <div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {user.fullName || user.phoneNumber || "غير محدد"}
                    </Badge>
                </div>
            );
        },
    },
    {
        accessorKey: "price",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    السعر
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const price = parseFloat(row.getValue("price"));
            return <div>{formatPrice(price)}</div>;
        },
    },
    {
        accessorKey: "isPublished",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    الحالة
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const isPublished = row.getValue("isPublished") || false;
            return (
                <Badge variant={isPublished ? "default" : "secondary"}>
                    {isPublished ? "منشور" : "مسودة"}
                </Badge>
            );
        },
    },
    {
        accessorKey: "createdAt",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    انشئ في
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const date = new Date(row.getValue("createdAt"));
            return <div>{format(date, "dd/MM/yyyy", { locale: ar })}</div>;
        },
    },
    {
        accessorKey: "grade",
        header: () => {
            return <div className="text-right font-medium">الصف الدراسي</div>;
        },
        cell: ({ row }) => {
            const grade = row.original.grade;
            const divisions = row.original.divisions || [];
            
            if (!grade) {
                return <div className="text-muted-foreground">غير محدد</div>;
            }
            
            if (grade === "الكل") {
                return <div>الكل</div>;
            }
            
            if (divisions.length > 0) {
                return <div>{grade} - {divisions.join(", ")}</div>;
            }
            
            return <div>{grade}</div>;
        },
    }
];
