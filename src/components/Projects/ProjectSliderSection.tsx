// src/components/Projects/ProjectSliderSection.tsx

import { unstable_cache } from "next/cache";
import { connectDB } from "@/src/lib/db";
import { Project } from "@/src/models/Project";
import ProjectSlider from "./ProjectSlider";

type ProjectLean = {
  _id: unknown;
  type: string;
  title: string;
  description: string;
  githubLink?: string;
  liveLink?: string;
  technologies: string[];
  images: string[];
  createdAt: Date;
  slug: string;
};

const getSliderProjects = unstable_cache(
  async () => {
    await connectDB();

    const raw = await Project.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .select(
        "_id type title description githubLink liveLink technologies images createdAt slug",
      )
      .lean<ProjectLean[]>();

    return raw.map((p) => ({
      _id: String(p._id),
      type: p.type ?? "",
      title: p.title ?? "",
      description: p.description ?? "",
      githubLink: p.githubLink,
      liveLink: p.liveLink,
      technologies: Array.isArray(p.technologies) ? p.technologies : [],
      images: Array.isArray(p.images) ? p.images : [],
      createdAt: String(p.createdAt),
      slug: p.slug ?? "",
    }));
  },
  ["projects-slider"],
  { revalidate: 300, tags: ["projects"] },
);

const ProjectSliderSection = async () => {
  const projects = await getSliderProjects();
  return <ProjectSlider initialProjects={projects} />;
};

export default ProjectSliderSection;
