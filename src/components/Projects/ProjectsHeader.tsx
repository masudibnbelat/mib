import Image from "next/image";
import p from "@/public/assets/projects.webp";

const ProjectsHeader = () => {
  return (
    <div className="mt-20 w-full">
      <div className="relative w-full h-96 overflow-hidden rounded">
        <Image
          src={p}
          alt="projects"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>
    </div>
  );
};

export default ProjectsHeader;
