// src/types/project.ts

export interface Project {
  _id: string;
  type: "web" | "app";
  title: string;
  slug: string;
  description: string;
  githubLink?: string;
  liveLink?: string;
  technologies: string[];
  images: string[];
  createdAt: string;
}

export interface Props {
  project: Project;
  index: number;
  onOpen?: (project: Project) => void;
}

export type FilterType = "all" | "web" | "app";

export interface ApiResponse {
  success: boolean;
  data: Project[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
