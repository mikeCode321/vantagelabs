import Navbar from "@/components/Landing/Navbar";
import HeroSection  from "@/components/Landing/HeroSection";
import PricingSection from "@/components/Landing/PricingSection";
import WhatIsVantageSection from "@/components/Landing/WhatIsVantageSection";
import FeatureHighlightsSection from "@/components/Landing/FeatureHighlightSection";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      <HeroSection />
      <WhatIsVantageSection />
      <FeatureHighlightsSection />
      <PricingSection />
    </main>
  );
}