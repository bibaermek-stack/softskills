import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Books } from "@/components/sections/Books";
import { Modules } from "@/components/sections/Modules";
import { Multimedia } from "@/components/sections/Multimedia";
import { Technologies } from "@/components/sections/Technologies";
import { TrySimulations } from "@/components/sections/TrySimulations";
import { AIAssistant, Collaboration } from "@/components/sections/AIAssistant";
import { Analytics } from "@/components/sections/Analytics";
import { Assessment, CreativeEducation } from "@/components/sections/Assessment";
import { Workflow } from "@/components/sections/Workflow";
import { Research } from "@/components/sections/Research";
import { Gallery } from "@/components/sections/Gallery";
import { Contact } from "@/components/sections/Contact";
import { collaborationRoles, collaborationSkills, collaborationScenarios } from "@/lib/content";

export default function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <Books />
      <Modules />
      <Multimedia />
      <Technologies />
      {/* Сипаттамадан кейін — бірден сынап көруге шақыру. */}
      <TrySimulations />
      <AIAssistant />
      <Collaboration
        roles={collaborationRoles}
        skills={collaborationSkills}
        scenarios={collaborationScenarios}
      />
      <Analytics />
      <Assessment />
      <CreativeEducation />
      <Workflow />
      <Research />
      <Gallery />
      <Contact />
    </>
  );
}
