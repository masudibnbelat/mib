import DashboardSidebar from "@/src/components/common/DashboardSidebar";
import { ReactNode } from "react";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <main className="flex-1">
        {/* <DashboardNavbar /> */}
        {children}
      </main>
    </div>
  );
}
