"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, FileText, FolderPlus, Home } from "lucide-react";
import { motion } from "framer-motion";

const DashboardPage = () => {
  const router = useRouter();

  const cards = [
    {
      title: "Add Topic",
      desc: "Create and manage topics",
      icon: FolderPlus,
      onClick: () => router.push("/dashboard/add-topic"),
    },
    {
      title: "Add Article",
      desc: "Write and publish articles",
      icon: FileText,
      onClick: () => router.push("/dashboard/add-article"),
    },
  ];

  return (
    <div className="min-h-screen bg-(--color-bg) text-(--color-text) px-6 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="opacity-70 text-sm">Manage your content easily</p>
        </div>

        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-(--color-text) text-(--color-bg) text-sm hover:opacity-90 transition"
        >
          <Home size={16} /> Home
        </Link>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((item, idx) => (
          <motion.div
            key={idx}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={item.onClick}
            className="cursor-pointer rounded-2xl border border-(--color-text)/20 p-6 bg-(--color-bg) shadow-sm hover:shadow-md transition"
          >
            <item.icon className="w-8 h-8 mb-4" />
            <h2 className="text-xl font-semibold mb-1">{item.title}</h2>
            <p className="text-sm opacity-70">{item.desc}</p>
          </motion.div>
        ))}

        {/* Projects Link */}
        <Link
          href="/dashboard/add-projects"
          className="rounded-2xl border border-(--color-text)/20 p-6 bg-(--color-bg) shadow-sm hover:shadow-md transition flex flex-col justify-between"
        >
          <Plus className="w-8 h-8 mb-4" />
          <div>
            <h2 className="text-xl font-semibold">Add Projects</h2>
            <p className="text-sm opacity-70">Showcase your work</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default DashboardPage;
