// src/components/Dashboard/DashboardSidebar.tsx
"use client";

import Link from "next/link";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  FolderPlus,
  FileText,
  BriefcaseBusiness,
  Home,
  Settings,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Add Topics", href: "/dashboard/add-topic", icon: FolderPlus },
  { label: "Add Article", href: "/dashboard/add-article", icon: FileText },
  {
    label: "Add Projects",
    href: "/dashboard/add-projects",
    icon: BriefcaseBusiness,
  },
  { label: "Manage Topic", href: "/dashboard/manage-topic", icon: Settings },
  {
    label: "Manage Article",
    href: "/dashboard/manage-article",
    icon: Settings,
  },
  {
    label: "Manage Project",
    href: "/dashboard/manage-project",
    icon: Settings,
  },
];

type Props = {
  openSidebar: boolean;
  setOpenSidebar: Dispatch<SetStateAction<boolean>>;
};

const DashboardSidebar = ({ openSidebar, setOpenSidebar }: Props) => {
  const pathname = usePathname();

  // ✅ Resize track করে isDesktop update করে
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check(); // initial check
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {openSidebar && !isDesktop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpenSidebar(false)}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        transition={{ type: "spring", stiffness: 260, damping: 25 }}
        // ✅ এখন isDesktop state থেকে পড়ছে, resize-এ reactive
        animate={{ x: isDesktop ? 0 : openSidebar ? 0 : -320 }}
        className="fixed lg:sticky left-0 top-0 z-50 h-screen w-70
          border-r border-(--color-active-border) bg-(--color-bg)/95
          backdrop-blur-xl flex flex-col px-4 py-5"
      >
        {/* Logo */}
        <div className="mb-8 px-2">
          <h1 className="text-2xl font-black tracking-tight text-(--color-text)">
            MIB<span className="text-violet-500">.</span>
          </h1>
          <p className="text-xs text-(--color-gray) mt-1">Content Management</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpenSidebar(false)}
                className="block"
              >
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ x: 4 }}
                  className={`
                    relative overflow-hidden flex items-center justify-between
                    px-4 py-3 rounded-lg transition-all duration-200 border
                    ${
                      active
                        ? "bg-(--color-active-bg) text-(--color-text) border-(--color-active-bg)"
                        : "bg-transparent text-(--color-gray) border-transparent hover:bg-(--color-active-bg) hover:text-(--color-text)"
                    }
                  `}
                >
                  {active && (
                    <motion.div
                      layoutId="sidebar-pill"
                      className="absolute inset-0 bg-(--color-active-bg)"
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <ChevronRight
                    className={`relative z-10 w-4 h-4 transition-transform
                      ${active ? "translate-x-0" : "-translate-x-1 opacity-0"}`}
                  />
                </motion.div>
              </Link>
            );
          })}

          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl
                text-(--color-gray) hover:bg-(--color-active-bg) hover:text-(--color-text)"
            >
              <Home className="w-5 h-5" />
              <span className="text-sm font-medium">Home</span>
            </motion.div>
          </Link>
        </nav>
      </motion.aside>
    </>
  );
};

export default DashboardSidebar;
