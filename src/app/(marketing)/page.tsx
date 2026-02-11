import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { ValueProps } from "@/components/landing/value-props";
import { HowItWorks } from "@/components/landing/how-it-works";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-void text-text">
      <Navbar />
      <main>
        <Hero />
        <ValueProps />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
