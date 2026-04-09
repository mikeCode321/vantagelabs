import Navbar from "@/components/Landing/Navbar";
import HeroSection  from "@/components/Landing/HeroSection";
import PricingSection from "@/components/Landing/PricingSection";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      <HeroSection />
      <PricingSection />
    </main>
  );
}