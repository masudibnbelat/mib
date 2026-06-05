// src/components/Skill/Skill.tsx

import { skillsData, type Skill } from "@/src/data/skills";
import Image from "next/image";

const levelStyles: Record<Skill["level"], string> = {
  Master: "bg-red-500/10 text-red-400 border-red-500/20",
  Intermediate: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Beginner: "bg-green-500/10 text-green-400 border-green-500/20",
};

export default function Skills() {
  return (
    <section className=" bg-(--color-bg) text-(--color-text)">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center lg:justify-start items-center gap-3 my-0 lg:mb-20">
          <h2 className="text-3xl md:text-5xl audiowide">
            S<span className="text-red-500">kill</span>s
          </h2>
        </div>

        <div className="space-y-16 ">
          {skillsData.map((section) => (
            <div
              key={section.title}
              className="flex flex-col lg:flex-row gap-4 md:gap-8"
            >
              <div className="lg:w-10 shrink-0 flex items-start justify-start lg:justify-center">
                <h3 className="text-sm lg:text-base font-semibold text-(--color-gray) lg:mt-10 lg:-rotate-90 lg:whitespace-nowrap">
                  · {section.title}
                </h3>
              </div>

              <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {section.skills.map((skill) => (
                  <div
                    key={`${section.title}-${skill.name}`}
                    className="group rounded-xl p-4 border border-(--color-active-border) transition duration-200 hover:-translate-y-1 hover:border-white/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 shrink-0 rounded-lg flex items-center justify-center bg-(--color-active-bg)">
                        <Image
                          src={skill.icon}
                          alt={skill.name}
                          width={32}
                          height={32}
                          loading="lazy"
                          decoding="async"
                          draggable={false}
                          className="w-8 h-8 object-contain transition-transform duration-200 group-hover:scale-105"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-xs lg:text-sm truncate text-(--color-text)">
                          {skill.name}
                        </h4>

                        <span
                          className={`inline-block mt-1 px-1 lg:px-2 py-0.5 rounded text-[9px] lg:text-xs font-medium border ${levelStyles[skill.level]}`}
                        >
                          {skill.level}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
