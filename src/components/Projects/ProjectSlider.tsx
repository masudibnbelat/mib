// ProjectSlider.tsx
"use client";

import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence } from "motion/react";
import type { FilterType, Project, ApiResponse } from "@/src/types/project";
import { axiosSecure } from "@/src/hooks/axiosSecure";
import ProjectSliderDesktop from "./ProjectSliderDesktop";
import ProjectSliderMobile from "./ProjectSliderMobile";
import ProjectModal from "./ProjectModal";
import Loader from "../common/Loader";
import { motion } from "motion/react";

const fetchProjects = async (filter: FilterType) => {
  const res = await axiosSecure.get<ApiResponse>("/api/projects", {
    params: {
      limit: 20,
      ...(filter !== "all" ? { type: filter } : {}),
    },
  });
  return res.data.data ?? [];
};

const ProjectSlider = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const {
    data: projects = [],
    isLoading,
    isError,
  } = useQuery<Project[]>({
    queryKey: ["projects-slider"],
    queryFn: () => fetchProjects("all"),
    staleTime: 1000 * 60 * 5,
  });

  const handleOpen = useCallback((project: Project) => {
    setSelectedProject(project);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedProject(null);
  }, []);

  return (
    <section className=" w-full py-8">
      <motion.div
        className="flex justify-center lg:justify-start items-center gap-3 my-0 md:my-12"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-3xl md:text-5xl audiowide lg:ml-8">
          <span className="text-red-500 mr-1.5">Pro</span>
          jects
        </h2>
      </motion.div>

      {isLoading ? (
        <Loader />
      ) : isError ? (
        <p className="py-16 text-center text-sm text-(--color-gray)">
          Something went wrong.
        </p>
      ) : projects.length === 0 ? (
        <p className="py-16 text-center text-sm text-(--color-gray)">
          No projects found.
        </p>
      ) : (
        <div>
          <div className="hidden sm:block">
            <ProjectSliderDesktop projects={projects} onOpen={handleOpen} />
          </div>
          <div className="block sm:hidden">
            <ProjectSliderMobile projects={projects} onOpen={handleOpen} />
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedProject && (
          <ProjectModal project={selectedProject} onClose={handleClose} />
        )}
      </AnimatePresence>
    </section>
  );
};

export default ProjectSlider;
