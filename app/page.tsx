import { Navbar } from '@/components/navbar';
import { Hero } from '@/components/sections/hero';
import { WorkSection } from '@/components/sections/work';
import { AboutSection } from '@/components/sections/about';
import { SkillsSection } from '@/components/sections/skills';
import { ExperienceSection } from '@/components/sections/experience';
import { SocialSection } from '@/components/sections/social';
import { ContactSection } from '@/components/sections/contact';
import { Footer } from '@/components/sections/footer';
import { ScrollProgress } from '@/components/scroll-progress';
import { CursorGlow } from '@/components/cursor-glow';
import { PageIntro } from '@/components/page-intro';

export default function Home() {
  return (
    <>
      <PageIntro />
      <ScrollProgress />
      <CursorGlow />
      <Navbar />
      <main>
        <Hero />
        <WorkSection />
        <AboutSection />
        <SkillsSection />
        <ExperienceSection />
        <SocialSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  );
}
