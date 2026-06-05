// app/page.tsx

import { Hero } from "@/src/components/Hero/Hero";
import ProjectSliderSection from "@/src/components/Projects/ProjectSliderSection";
import Services from "@/src/components/services/Services";
import Skills from "@/src/components/Skill/Skill";

export default function Home() {
  return (
    <main className="container mx-auto">
      <Hero />
      <Services />
      <Skills />
      <ProjectSliderSection />
    </main>
  );
}
