import { unstable_cache } from "next/cache";
import { connectDB } from "@/src/lib/db";
import { Project } from "@/src/models/Project";
import ProjectsBody from "@/src/components/Projects/ProjectsBody";
import ProjectsHeader from "@/src/components/Projects/ProjectsHeader";
import type { Project as ProjectType } from "@/src/types/project";

export const revalidate = 300;

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

const getProjects = unstable_cache(
  async (): Promise<ProjectType[]> => {
    await connectDB();

    const raw = await Project.find()
      .sort({ createdAt: -1 })
      .limit(12)
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
  ["projects-header"],
  { revalidate: 300, tags: ["projects"] },
);

const Projects = async () => {
  const projects = await getProjects();

  return (
    <div>
      <ProjectsHeader projects={projects} />
      <ProjectsBody />
    </div>
  );
};

export default Projects;
