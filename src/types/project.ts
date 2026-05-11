// src/types/project.ts

export interface Project {
  _id: string;
  type: string;
  title: string;
  description: string;
  githubLink?: string;
  liveLink?: string;
  technologies: string[];
  images: string[];
  createdAt: string;
  slug: string;
}

export interface Meta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse {
  success: boolean;
  data: Project[];
  meta: Meta;
}

export interface Props {
  project: Project;
  index: number;
  onOpen?: (project: Project) => void;
}

export type FilterType = "all" | "web" | "app";
