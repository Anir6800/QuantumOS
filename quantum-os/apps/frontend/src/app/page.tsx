import Navbar from '@/components/landing/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import CTASection from '@/components/landing/CTASection';
import CursorGlow from '@/components/landing/CursorGlow';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col relative bg-[#050508] selection:bg-[#00e5ff] selection:text-[#050508]">
      <CursorGlow />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <CTASection />
    </main>
  );
}
