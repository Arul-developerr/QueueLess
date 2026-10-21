import { Hero } from '../components/landing/Hero';
import { TrustSection } from '../components/landing/TrustSection';
import { HowItWorks } from '../components/landing/HowItWorks';
import { FeatureShowcase } from '../components/landing/FeatureShowcase';
import { SimulationShowcase } from '../components/landing/SimulationShowcase';
import { FinalCta } from '../components/landing/FinalCta';

export default function LandingPage() {
  return (
    <>
      <Hero />
      <TrustSection />
      <HowItWorks />
      <FeatureShowcase />
      <SimulationShowcase />
      <FinalCta />
    </>
  );
}