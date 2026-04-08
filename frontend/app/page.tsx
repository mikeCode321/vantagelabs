import Navbar from "@/components/Landing/Navbar";
import HeroSection  from "@/components/Landing/HeroSection";


export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      <HeroSection />
    </main>
  );
}