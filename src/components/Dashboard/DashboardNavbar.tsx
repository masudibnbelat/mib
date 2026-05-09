// src/Dashboard/DashboardNavbar.tsx

// src/components/Dashboard/DashboardNavbar.tsx

"use client";

import { Dispatch, SetStateAction } from "react";
import { Key, Menu, X } from "lucide-react";
import { motion } from "motion/react";

type Props = {
  openSidebar: boolean;
  setOpenSidebar: Dispatch<SetStateAction<boolean>>;
};

const DashboardNavbar = ({ openSidebar, setOpenSidebar }: Props) => {
  return (
    <header
      className=" sticky top-0 z-40 h-16 flex items-center
            px-4 border-b border-(--color-active-border) bg-(--color-bg)/80
            backdrop-blur-xl
        "
    >
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpenSidebar((prev) => !prev)}
        className=" lg:hidden flex items-center justify-center w-11 h-11 rounded-xl border border-(--color-active-border) bg-(--color-active-bg) text-(--color-text)
"
      >
        {openSidebar ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}{" "}
      </motion.button>
      <div className="flex justify-center items-center gap-x-2 w-full">
        <h2>Welcome to Admin Panel</h2>
        <Key className="w-4 h-4" />
      </div>
    </header>
  );
};

export default DashboardNavbar;
