import { FinalCta } from "@/components/sections/FinalCta";
import { Hero } from "@/components/sections/Hero";
import { ArrivalLocation } from "@/components/world/locations/ArrivalLocation";

export default function HomePage() {
  return (
    <ArrivalLocation
      fallback={
        <>
          <Hero />
          <FinalCta />
        </>
      }
    />
  );
}
