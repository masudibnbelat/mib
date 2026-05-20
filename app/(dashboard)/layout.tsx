// app/(dashboard)/layout.tsx

"use client";

import { useState } from "react";
import type { ReactNode } from "react";

import DashboardNavbar from "@/src/components/Dashboard/DashboardNavbar";
import DashboardSidebar from "@/src/components/Dashboard/DashboardSidebar";
import AuthGuard from "@/src/components/Dashboard/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  const [openSidebar, setOpenSidebar] = useState(false);

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-(--color-bg)">
        <DashboardSidebar
          openSidebar={openSidebar}
          setOpenSidebar={setOpenSidebar}
        />

        <main className="flex-1 min-w-0">
          <DashboardNavbar
            openSidebar={openSidebar}
            setOpenSidebar={setOpenSidebar}
          />

          <div className="p-4">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}
