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
    <section className="container mx-auto w-full py-8">
      <div className="mb-6 flex flex-col lg:flex-row items-center justify-center lg:justify-between gap-4">
        <h2 className="text-3xl lg:text-5xl font-bold text-(--color-text)">
          Projects
        </h2>
      </div>

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
