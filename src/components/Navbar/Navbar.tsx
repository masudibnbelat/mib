"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Eye,
  FolderKanban,
  Home,
  Moon,
  Newspaper,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "@/src/providers/ThemeProvider";

// ------------------ TYPES ------------------

type MenuItemName = "home" | "projects" | "articles" | "Third Eye";

interface MenuItem {
  readonly name: MenuItemName;
  readonly path: string;
  readonly icon: LucideIcon;
}

type NavItemVariant = "desktop" | "mobile";

// ------------------ MENU ITEMS ------------------

const MENU_ITEMS: readonly MenuItem[] = [
  { name: "home", path: "/", icon: Home },
  { name: "projects", path: "/projects", icon: FolderKanban },
  { name: "articles", path: "/articles", icon: Newspaper },
  { name: "Third Eye", path: "/third-eye", icon: Eye },
] as const;

// ------------------ HELPERS ------------------

const getActiveItem = (pathname: string): MenuItemName => {
  const matched = MENU_ITEMS.find((item) =>
    item.path === "/" ? pathname === "/" : pathname.startsWith(item.path),
  );

  return matched?.name ?? "home";
};

// ------------------ NAV ITEM ------------------

interface NavItemProps {
  item: MenuItem;
  isActive: boolean;
  variant: NavItemVariant;
}

const NavItem = ({ item, isActive, variant }: NavItemProps) => {
  const Icon = item.icon;

  if (variant === "desktop") {
    return (
      <li className="relative">
        {isActive && (
          <motion.div
            layoutId="desktopActiveTab"
            className="absolute inset-0 rounded-lg border border-(--color-active-border) bg-(--color-active-bg)"
            transition={{
              type: "spring",
              stiffness: 350,
              damping: 30,
              mass: 0.8,
            }}
          />
        )}

        <Link
          href={item.path}
          prefetch
          aria-current={isActive ? "page" : undefined}
          className={`relative z-10 block rounded-lg px-5 py-2.5 font-medium capitalize transition-colors ${
            isActive
              ? "text-(--color-active-text)"
              : "text-(--color-gray) hover:text-(--color-text)"
          }`}
        >
          {item.name}
        </Link>
      </li>
    );
  }

  return (
    <Link
      href={item.path}
      prefetch
      aria-current={isActive ? "page" : undefined}
      className={`relative flex h-12 w-20 flex-col items-center justify-center gap-1 rounded transition-colors ${
        isActive
          ? "text-(--color-active-text)"
          : "text-(--color-gray) hover:text-(--color-text)"
      }`}
    >
      {isActive && (
        <motion.span
          layoutId="mobileBottomActive"
          className="absolute inset-0 rounded-lg bg-(--color-active-bg)"
          transition={{
            type: "spring",
            stiffness: 350,
            damping: 30,
            mass: 0.8,
          }}
        />
      )}

      <motion.span
        className="relative z-10 grid place-items-center"
        whileTap={{ scale: 0.85 }}
      >
        <Icon className="h-5 w-5" strokeWidth={2.4} />
      </motion.span>
    </Link>
  );
};

// ------------------ COMPONENT ------------------

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const activeItem = useMemo(() => getActiveItem(pathname), [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLogoScroll = () => {
    const scrollTop = window.scrollY;
    const maxScroll =
      document.documentElement.scrollHeight - window.innerHeight;

    const nearTop = scrollTop <= 50;
    const nearBottom = maxScroll - scrollTop <= 50;

    if (nearTop) {
      window.scrollTo({
        top: maxScroll,
        behavior: "smooth",
      });
      return;
    }

    if (nearBottom) {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      return;
    }

    window.scrollTo({
      top: scrollTop < maxScroll / 2 ? maxScroll : 0,
      behavior: "smooth",
    });
  };

  const handleLogoClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== "/") return;
    event.preventDefault();
    handleLogoScroll();
  };

  return (
    <div>
      {/* Top Navbar */}
      <nav
        className={`fixed z-50 transition-all duration-300 ${
          scrolled
            ? "top-2 left-2 right-2 rounded-2xl border border-(--color-active-border) bg-(--color-bg) py-3 backdrop-blur-xl"
            : "top-0 left-0 right-0 py-4"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 md:px-0">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              prefetch
              onClick={handleLogoClick}
              aria-label="Masud ibn Belat"
              className="pacifico text-2xl leading-none text-(--color-text) transition-colors md:text-3xl"
            >
              Masud ibn Belat
            </Link>

            {/* Desktop Menu */}
            <ul className="relative hidden items-center space-x-1 md:flex">
              {MENU_ITEMS.map((item) => (
                <NavItem
                  key={item.name}
                  item={item}
                  isActive={activeItem === item.name}
                  variant="desktop"
                />
              ))}
            </ul>

            {/* Theme Toggle */}
            <motion.button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === "dark"
                  ? "Switch to light theme"
                  : "Switch to dark theme"
              }
              className="grid h-11 w-11 place-items-center rounded-2xl border border-(--color-active-border) bg-(--color-bg) text-(--color-text)"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.92 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={theme}
                  initial={{ opacity: 0, rotate: -90, scale: 0.7 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.7 }}
                  transition={{ duration: 0.2 }}
                  className="grid place-items-center"
                >
                  {theme === "dark" ? (
                    <Moon className="h-5 w-5" strokeWidth={2.2} />
                  ) : (
                    <Sun className="h-5 w-5" strokeWidth={2.2} />
                  )}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navbar */}
      <motion.nav
        aria-label="Mobile bottom navigation"
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-(--color-active-border) bg-(--color-bg) px-2 py-0.5 backdrop-blur-xl md:hidden"
      >
        {MENU_ITEMS.map((item) => (
          <NavItem
            key={item.name}
            item={item}
            isActive={activeItem === item.name}
            variant="mobile"
          />
        ))}
      </motion.nav>
    </div>
  );
};

export default Navbar;
