import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { ValueProps } from "@/components/landing/value-props";
import { HowItWorks } from "@/components/landing/how-it-works";
import { CTA } from "@/components/landing/cta";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <Hero />
      <ValueProps />
      <HowItWorks />
      <CTA />
    </>
  );
}
