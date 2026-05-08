import { ReactNode } from "react";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return (
    <div className="flex min-h-screen">
      {/* <Sidebar /> */}
      <main className="flex-1">
        {/* <DashboardNavbar /> */}
        {children}
      </main>
    </div>
  );
}
