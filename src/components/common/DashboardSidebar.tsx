"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
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
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Add Topics",
    href: "/dashboard/add-topic",
    icon: FolderPlus,
  },
  {
    label: "Add Article",
    href: "/dashboard/add-article",
    icon: FileText,
  },
  {
    label: "Add Projects",
    href: "/dashboard/add-projects",
    icon: BriefcaseBusiness,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

const DashboardSidebar = () => {
  const pathname = usePathname();

  return (
    <aside
      className="
        h-screen w-70
        sticky top-0
        border-r border-(--color-active-border)
        bg-(--color-bg)/90
        backdrop-blur-xl
        flex flex-col
        px-4 py-5
      "
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
            <Link key={item.href} href={item.href} className="block">
              <motion.div
                whileTap={{ scale: 0.98 }}
                whileHover={{ x: 4 }}
                className={`
                  relative overflow-hidden
                  flex items-center justify-between
                  px-4 py-3 rounded-2xl
                  transition-all duration-200
                  border
                  ${
                    active
                      ? "bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-600/20"
                      : "bg-transparent text-(--color-gray) border-transparent hover:bg-(--color-active-bg) hover:text-(--color-text)"
                  }
                `}
              >
                {/* Glow */}
                {active && (
                  <motion.div
                    layoutId="sidebar-pill"
                    className="absolute inset-0 bg-violet-600"
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 30,
                    }}
                  />
                )}

                <div className="relative z-10 flex items-center gap-3">
                  <Icon className="w-5 h-5" />

                  <span className="text-sm font-medium">{item.label}</span>
                </div>

                <ChevronRight
                  className={`
                    relative z-10 w-4 h-4 transition-transform
                    ${active ? "translate-x-0" : "-translate-x-1 opacity-0"}
                  `}
                />
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="pt-4 border-t border-(--color-active-border)">
        <Link href="/">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="
              flex items-center gap-3
              px-4 py-3 rounded-2xl
              bg-(--color-active-bg)
              border border-(--color-active-border)
              text-(--color-text)
            "
          >
            <Home className="w-5 h-5" />

            <span className="text-sm font-medium">Back to Home</span>
          </motion.div>
        </Link>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
